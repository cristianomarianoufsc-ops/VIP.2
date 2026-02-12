import { Metadata } from 'next';

interface ImagePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ImagePageProps): Promise<Metadata> {
  const fileKey = params.id;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.error('CLOUDINARY_CLOUD_NAME is not defined');
    return {
      title: 'Imagem não encontrada',
      description: 'Não foi possível carregar a imagem.',
    };
  }

  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${fileKey}`;

  return {
    title: `Imagem ${fileKey}`,
    description: `Veja a imagem ${fileKey} hospedada no Cloudinary.`, 
    openGraph: {
      title: `Imagem ${fileKey}`,
      description: `Veja a imagem ${fileKey} hospedada no Cloudinary.`, 
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Imagem ${fileKey}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Imagem ${fileKey}`,
      description: `Veja a imagem ${fileKey} hospedada no Cloudinary.`, 
      images: [imageUrl],
    },
  };
}

export default function ImagePage({ params }: ImagePageProps) {
  const fileKey = params.id;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-500">Erro: Cloudinary Cloud Name não configurado.</p>
      </div>
    );
  }

  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${fileKey}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Visualizando Imagem</h1>
      <img src={imageUrl} alt={`Imagem ${fileKey}`} className="max-w-full h-auto rounded-lg shadow-lg" />
      <p className="mt-4 text-gray-600">ID da Imagem: {fileKey}</p>
      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-500 hover:underline">
        Ver imagem original
      </a>
    </div>
  );
}
