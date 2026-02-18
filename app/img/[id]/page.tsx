import { Metadata } from 'next';
import { headers } from 'next/headers';
import prisma from '../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ImagePageProps {
  params: Promise<{ id: string }>;
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
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
      metadataBase: new URL(baseUrl),
    };
  }

  const title = `VIP Image - ${image.fileName}`;
  const description = "Visualize esta imagem compartilhada via VIP Image Host.";

  // Otimização agressiva para WhatsApp (Cloudinary)
  const optimizedImageUrl = image.imageUrl.includes('cloudinary.com')
    ? image.imageUrl.includes('?') 
      ? `${image.imageUrl}&w=1200&h=630&c=fill&q=auto&f=jpg`
      : `${image.imageUrl}?w=1200&h=630&c=fill&q=auto&f=jpg`
    : image.imageUrl;

  const squareImageUrl = image.imageUrl.includes('cloudinary.com')
    ? image.imageUrl.includes('?')
      ? `${image.imageUrl}&w=400&h=400&c=fill&q=auto&f=jpg`
      : `${image.imageUrl}?w=400&h=400&c=fill&q=auto&f=jpg`
    : image.imageUrl;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'VIP Image Host',
      type: 'website',
      images: [
        {
          url: optimizedImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
        {
          url: squareImageUrl,
          width: 400,
          height: 400,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [optimizedImageUrl],
    },
    other: {
      'og:image:secure_url': optimizedImageUrl,
      'og:image:type': 'image/jpeg',
      'og:image:width': '1200',
      'og:image:height': '630',
      'twitter:image': optimizedImageUrl,
      'thumbnail': squareImageUrl,
    }
  };
}

export default async function ImagePage({ params }: ImagePageProps) {
  const { id } = await params;
  const image = await getImage(id);
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  // Lista de crawlers conhecidos que precisam ver as meta tags
  const isBot = /facebookexternalhit|WhatsApp|Twitterbot|Pinterest|Slackbot|LinkedInBot|TelegramBot|Googlebot/i.test(userAgent);

  if (!image) {
    return (
      <div style={{ backgroundColor: 'black', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p>Imagem não encontrada.</p>
      </div>
    );
  }

  // LÓGICA DE REDIRECIONAMENTO DEFINITIVA:
  // Se NÃO for um bot (ou seja, se for um humano no navegador), redireciona direto para a URL da imagem.
  // Isso garante que o usuário veja APENAS a imagem, exatamente como "abrir em nova aba".
  if (!isBot) {
    return (
      <html>
        <head>
          <meta httpEquiv="refresh" content={`0;url=${image.imageUrl}`} />
          <script dangerouslySetInnerHTML={{ __html: `window.location.href = "${image.imageUrl}";` }} />
        </head>
        <body style={{ backgroundColor: 'black', margin: 0 }}>
          {/* Fallback caso o redirecionamento demore um milésimo de segundo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <img src={image.imageUrl} style={{ maxWidth: '100%', maxHeight: '100%' }} />
          </div>
        </body>
      </html>
    );
  }

  // Se for um BOT (WhatsApp), renderiza a página com as meta tags (que estão no generateMetadata)
  // e uma estrutura mínima de visualização.
  return (
    <div style={{ 
      backgroundColor: 'black', 
      margin: 0, 
      padding: 0, 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <img 
        src={image.imageUrl} 
        alt={image.fileName} 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100%', 
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}
