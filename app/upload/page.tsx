'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Copy, ArrowLeft } from 'lucide-react';

interface UploadedImage {
  id: string;
  fileName: string;
  shortUrl: string;
  createdAt: string;
}

export default function Upload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      const newImage: UploadedImage = {
        id: data.shortId,
        fileName: data.fileName,
        shortUrl: data.shortUrl,
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };

      setImages([newImage, ...images]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Erro ao enviar imagem');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Link copiado!');
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-black">Banco de Imagens</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {uploading ? 'Enviando...' : 'Selecionar Imagem'}
          </button>
          <p className="text-gray-600 mt-4">Clique para selecionar uma imagem</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-black mb-4">
            Suas Imagens ({images.length})
          </h2>

          {images.length === 0 ? (
            <p className="text-gray-600">Nenhuma imagem enviada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow"
                >
                  <img
                    src={image.shortUrl}
                    alt={image.fileName}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm text-gray-700 font-medium truncate mb-3">
                      {image.fileName}
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => copyToClipboard(image.shortUrl)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar Link
                      </button>
                      <p className="text-xs text-gray-500 break-all">
                        {image.shortUrl}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{image.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
