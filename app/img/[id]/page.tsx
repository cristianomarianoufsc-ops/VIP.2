import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface ImagePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ImagePageProps): Promise<Metadata> {
  const { id } = params;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vip-2-kohl.vercel.app';
  
  // A URL da imagem deve ser absoluta e usar HTTPS para o WhatsApp
  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${id}`;

  return {
    title: 'Visualizar Imagem',
    description: 'Imagem compartilhada via VIP Image Host',
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: 'Visualizar Imagem',
      description: 'Clique para ver a imagem completa.',
      url: `${baseUrl}/img/${id}`,
      siteName: 'VIP Image Host',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'Imagem Compartilhada',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Visualizar Imagem',
      description: 'Clique para ver a imagem completa.',
      images: [imageUrl],
    },
  };
}

export default function ImagePage({ params }: ImagePageProps) {
  const { id } = params;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${id}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Backup para o WhatsApp: uma imagem oculta ou pequena no topo do body às vezes ajuda */}
      <img src={imageUrl} alt="Preview" style={{ display: 'none' }} />
      
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">Visualizando Imagem</h1>
          <p className="text-sm text-gray-500 mt-1">ID: {id}</p>
        </div>
        
        <div className="p-4 flex justify-center bg-gray-50">
          <img 
            src={imageUrl} 
            alt="Imagem hospedada" 
            className="max-w-full h-auto rounded-lg shadow-sm"
          />
        </div>
        
        <div className="p-6 bg-white flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href={imageUrl} 
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
