'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Copy, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadedImage {
  id: string;
  fileName: string;
  shortUrl: string;
  imageUrl: string;
  createdAt: string;
  fileSize?: number;
}

interface UploadError {
  message: string;
  detail?: string;
}

export default function Upload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validação no cliente (feedback imediato)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `Arquivo muito grande. Tamanho máximo: 5MB. Tamanho do seu arquivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(
          `Tipo de arquivo não permitido. Tipos aceitos: JPEG, PNG, WebP, GIF. Seu arquivo: ${file.type}`
        );
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Erro ao enviar imagem');
      }

      const newImage: UploadedImage = {
        id: data.shortId,
        fileName: data.fileName,
        shortUrl: data.shortUrl,
        imageUrl: data.imageUrl,
        createdAt: new Date().toLocaleDateString("pt-BR"),
        fileSize: data.fileSize,
      };

      setImages([newImage, ...images]);
      setSuccess(`Imagem "${file.name}" enviada com sucesso!`);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao enviar imagem';
      setError({
        message: 'Erro ao enviar imagem',
        detail: errorMessage
      });
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccess('Link copiado para a área de transferência!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">{error.message}</h3>
              {error.detail && (
                <p className="text-red-700 text-sm mt-1">{error.detail}</p>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
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
          <p className="text-gray-500 text-sm mt-2">
            Formatos aceitos: JPEG, PNG, WebP, GIF • Tamanho máximo: 5MB
          </p>
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
                    src={image.imageUrl || image.shortUrl}
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
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                      <span>{image.createdAt}</span>
                      {image.fileSize && (
                        <span>{formatFileSize(image.fileSize)}</span>
                      )}
                    </div>
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
