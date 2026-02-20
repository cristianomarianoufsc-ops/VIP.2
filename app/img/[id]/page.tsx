import { Metadata } from 'next';
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
  return 'https://vip-2-biy47o94b-cristianomarianoufscs-projects.vercel.app';
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

  const title = `VIP - Visualizador de imagens protegidas`;
  const description = "Visualize esta imagem compartilhada via VIP Image Host.";

  // URL original para o preview
  const previewImageUrl = image.imageUrl;

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
          url: previewImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [previewImageUrl],
    },
    other: {
      'og:image:secure_url': previewImageUrl,
      'twitter:image': previewImageUrl,
    }
  };
}

export default async function ImagePage({ params }: ImagePageProps) {
  const { id } = await params;
  const image = await getImage(id);

  if (!image) {
    return (
      <div style={{ backgroundColor: 'black', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p>Imagem não encontrada.</p>
      </div>
    );
  }

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
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      userSelect: 'none',
      WebkitUserSelect: 'none'
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%', maxHeight: '100%' }}>
        <img 
          src={image.imageUrl} 
          alt={image.fileName} 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none'
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
        {/* Marca d'água de texto repetida */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          pointerEvents: 'none',
          zIndex: 10,
          overflow: 'hidden'
        }}>
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-45deg)',
              color: 'rgba(255, 255, 255, 0.2)',
              fontSize: '2vw',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              fontFamily: 'sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              VIP IMAGE HOST
            </div>
          ))}
        </div>
        {/* Camada invisível para bloquear clique direito e arrastar */}
        <div 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20 }} 
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
}
