import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import prisma from '../../lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configurações de validação
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_IMAGE_SIZE_FOR_WHATSAPP = 600 * 1024; // 600KB - Limite do WhatsApp

/**
 * Valida se o arquivo atende aos critérios de tamanho e tipo
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: 5MB. Tamanho enviado: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: JPEG, PNG, WebP, GIF. Tipo enviado: ${file.type}`
    };
  }

  // Validar extensão
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: `Extensão de arquivo não permitida. Extensões aceitas: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  const requestId = nanoid(8);
  const startTime = Date.now();

  try {
    console.log(`[${requestId}] Upload request received`);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log(`[${requestId}] No file provided in formData`);
      return NextResponse.json(
        { error: 'Nenhum arquivo foi fornecido' },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    console.log(`[${requestId}] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      console.log(`[${requestId}] File validation failed: ${validation.error}`);
      return NextResponse.json(
        { error: validation.error },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Gerar IDs únicos
    const shortId = nanoid(8);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileKey = `${shortId}-${Date.now()}.${fileExtension}`;

    console.log(`[${requestId}] Generated fileKey: ${fileKey}`);

    // Converter arquivo para Buffer para upload no Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[${requestId}] Attempting to upload to Cloudinary...`);

    // Upload com transformações automáticas para garantir qualidade e dimensões corretas
    const cloudinaryUploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: "vip2_uploads", 
          public_id: fileKey,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          // Transformações para garantir tamanho correto para link previews
          transformation: [
            {
              width: 1200,
              height: 630,
              crop: 'fill',
              gravity: 'auto',
              quality: 'auto',
              fetch_format: 'auto'
            }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(buffer);
    });

    if (!cloudinaryUploadResult || !cloudinaryUploadResult.secure_url) {
      console.error(`[${requestId}] Cloudinary upload failed:`, cloudinaryUploadResult);
      return NextResponse.json(
        { error: 'Erro ao enviar arquivo para o Cloudinary' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Validar tamanho da imagem do Cloudinary
    if (cloudinaryUploadResult.bytes > MAX_IMAGE_SIZE_FOR_WHATSAPP) {
      console.warn(`[${requestId}] Warning: Imagem maior que 600KB (${(cloudinaryUploadResult.bytes / 1024).toFixed(2)}KB). WhatsApp pode ter problemas ao exibir.`);
    }

    console.log(`[${requestId}] Cloudinary upload successful. URL: ${cloudinaryUploadResult.secure_url}`);
    console.log(`[${requestId}] Image dimensions: ${cloudinaryUploadResult.width}x${cloudinaryUploadResult.height}, size: ${(cloudinaryUploadResult.bytes / 1024).toFixed(2)}KB`);

    // Construir URL otimizada com transformações do Cloudinary
    // Isso garante que a imagem sempre será 1200x630 para link previews
    const publicUrl = cloudinaryUploadResult.secure_url;

    // Salvar metadados da imagem no banco de dados
    const baseUrlForShortUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const shortUrl = `${baseUrlForShortUrl}/img/${shortId}`;
    
    const newImage = await prisma.image.create({
      data: {
        shortId: shortId,
        fileName: file.name,
        imageUrl: publicUrl,
        shortUrl: shortUrl,
      },
    });
    
    console.log(`[${requestId}] Image metadata saved to database: ${newImage.id}`);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Upload completed successfully in ${duration}ms`);

    // Retornar link curto e informações
    return NextResponse.json(
      {
        success: true,
        shortId: newImage.shortId,
        imageUrl: newImage.imageUrl,
        fileName: newImage.fileName,
        fileSize: file.size,
        uploadDuration: duration,
        shortUrl: newImage.shortUrl,
        message: 'Imagem enviada com sucesso! Link pronto para compartilhar no WhatsApp.',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Upload error after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: 'Erro ao processar upload',
        detail: error.message,
        requestId: requestId
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
