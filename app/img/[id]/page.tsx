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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Imagem não encontrada</h1>
          <p className="text-gray-600 mb-6">A imagem que você procura não existe ou houve um erro ao acessá-la.</p>
          <a 
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Voltar para Upload
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">Visualizando Imagem</h1>
          <p className="text-sm text-gray-500 mt-1">ID: {image.shortId} | Nome: {image.fileName}</p>
        </div>
        
        <div className="p-4 flex justify-center bg-gray-50">
          <img 
            src={image.imageUrl} 
            alt={image.fileName} 
            className="max-w-full h-auto rounded-lg shadow-sm"
            loading="eager"
          />
        </div>
        
        <div className="p-6 bg-white flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href={image.imageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-center"
          >
            Ver Original
          </a>
          <a 
            href="/upload"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold transition-colors text-center"
          >
            Fazer Novo Upload
          </a>
        </div>
      </div>
    </div>
  );
}
