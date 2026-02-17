import { Metadata } from 'next';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

interface ImagePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ImagePageProps): Promise<Metadata> {
  const { id } = params;

  const image = await prisma.image.findUnique({
    where: { shortId: id },
  });

  if (!image) {
    return {
      title: 'Imagem não encontrada',
      description: 'A imagem que você procura não existe.',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vip-2-kohl.vercel.app';
  const title = `Imagem ${image.fileName}`;
  const description = `Veja a imagem ${image.fileName} em VIP.2`;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      url: image.shortUrl,
      siteName: 'VIP Image Host',
      images: [
        {
          url: image.imageUrl,
          secureUrl: image.imageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.imageUrl],
    },
  };
}

export default async function ImagePage({ params }: ImagePageProps) {
  const { id } = params;

  const image = await prisma.image.findUnique({
    where: { shortId: id },
  });

  if (!image) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4">Imagem não encontrada</h1>
        <p className="text-gray-600">A imagem que você procura não existe ou foi removida.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Backup para o WhatsApp: uma imagem oculta ou pequena no topo do body às vezes ajuda */}
      <img src={image.imageUrl} alt="Preview" style={{ display: 'none' }} />
      
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">Visualizando Imagem</h1>
          <p className="text-sm text-gray-500 mt-1">ID: {image.shortId}</p>
        </div>
        
        <div className="p-4 flex justify-center bg-gray-50">
          <img 
            src={image.imageUrl} 
            alt={image.fileName} 
            className="max-w-full h-auto rounded-lg shadow-sm"
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
