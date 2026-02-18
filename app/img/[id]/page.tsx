import { Metadata } from 'next';
import prisma from '../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Sem cache para garantir metadados sempre atualizados

interface ImagePageProps {
  params: Promise<{ id: string }>;
}

// Função auxiliar para obter a URL base dinamicamente
function getBaseUrl() {
  // Prioridade 1: Variável de ambiente explícita
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  // Prioridade 2: Vercel URL (sempre https)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback para produção VIP2 se nada for definido
  if (process.env.NODE_ENV === 'production') {
    return 'https://vip-2-efyo9go9i-cristianomarianoufscs-projects.vercel.app';
  }
  return 'http://localhost:3000';
}

async function getImage(id: string) {
  try {
    const image = await prisma.image.findUnique({
      where: { shortId: id },
    });
    return image;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ImagePageProps): Promise<Metadata> {
  const { id } = await params;
  const image = await getImage(id);
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}/img/${id}`;

  if (!image) {
    return {
      title: 'Imagem não encontrada',
      description: 'A imagem que você procura não existe.',
      metadataBase: new URL(baseUrl),
    };
  }

  // Gerar título e descrição mais descritivos
  const title = `Visualizar ${image.fileName} - VIP Image Host`;
  const description = `Clique para visualizar a imagem: ${image.fileName}. Compartilhe este link via WhatsApp, Facebook ou qualquer rede social.`;

  // Otimizar URL da imagem para garantir dimensões corretas
  // O WhatsApp prefere JPEGs progressivos e menores que 300KB para a miniatura
  // Usamos transformações do Cloudinary para garantir o formato e tamanho ideal
  const optimizedImageUrl = image.imageUrl.includes('cloudinary.com')
    ? image.imageUrl.includes('?') 
      ? `${image.imageUrl}&w=1200&h=630&c=fill&q=auto&f=jpg&fl=progressive`
      : `${image.imageUrl}?w=1200&h=630&c=fill&q=auto&f=jpg&fl=progressive`
    : image.imageUrl;

  // Imagem quadrada para WhatsApp (muito importante para previews menores)
  const squareImageUrl = image.imageUrl.includes('cloudinary.com')
    ? image.imageUrl.includes('?')
      ? `${image.imageUrl}&w=600&h=600&c=fill&q=auto&f=jpg&fl=progressive`
      : `${image.imageUrl}?w=600&h=600&c=fill&q=auto&f=jpg&fl=progressive`
    : image.imageUrl;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    
    // Open Graph - Essencial para WhatsApp, Facebook, etc
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'VIP Image Host',
      type: 'website',
      locale: 'pt_BR',
      images: [
        {
          url: optimizedImageUrl,
          width: 1200,
          height: 630,
          alt: title,
          secureUrl: optimizedImageUrl,
          type: 'image/jpeg',
        },
        {
          url: squareImageUrl,
          width: 600,
          height: 600,
          alt: title,
          secureUrl: squareImageUrl,
          type: 'image/jpeg',
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [optimizedImageUrl],
      creator: '@VIPImageHost',
    },

    // Metadados adicionais para melhor compatibilidade
    keywords: ['imagem', 'compartilhamento', 'visualizar', image.fileName],
    authors: [{ name: 'VIP Image Host' }],
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
      },
    },

    // Canonical URL para evitar duplicação
    alternates: {
      canonical: fullUrl,
    },

    // Viewport e outras configurações
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
    },
    
    // Outras tags que podem ajudar
    other: {
      'fb:app_id': '966242223397117', // ID padrão se necessário
      'thumbnail': squareImageUrl,
      'og:image:secure_url': optimizedImageUrl,
      'og:image:type': 'image/jpeg',
    }
  };
}

export default async function ImagePage({ params }: ImagePageProps) {
  const { id } = await params;
  const image = await getImage(id);

  if (!image) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Imagem não encontrada</h1>
        <p className="opacity-70">A imagem que você procura não existe ou foi removida.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="relative w-full h-screen flex items-center justify-center p-2 sm:p-4">
        <img 
          src={image.imageUrl} 
          alt={image.fileName} 
          className="max-w-full max-h-full object-contain shadow-2xl"
          loading="eager"
        />
      </div>
    </div>
  );
}
