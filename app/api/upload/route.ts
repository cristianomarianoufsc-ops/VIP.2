import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import prisma from '../../lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: 5MB. Tamanho enviado: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: JPEG, PNG, WebP, GIF. Tipo enviado: ${file.type}`
    };
  }

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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi fornecido' },
        { status: 400 }
      );
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const shortId = nanoid(8);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileKey = `${shortId}-${Date.now()}.${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudinaryUploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: "vip2_uploads", 
          public_id: fileKey,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          // REMOVIDO: Transformações de redimensionamento (width/height/crop)
          // Isso garante que a imagem original seja mantida.
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(buffer);
    });

    if (!cloudinaryUploadResult || !cloudinaryUploadResult.secure_url) {
      return NextResponse.json(
        { error: 'Erro ao enviar arquivo para o Cloudinary' },
        { status: 500 }
      );
    }

    const publicUrl = cloudinaryUploadResult.secure_url;
    const baseUrlForShortUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://vip-2-biy47o94b-cristianomarianoufscs-projects.vercel.app');
    const shortUrl = `${baseUrlForShortUrl}/img/${shortId}`;
    
    const newImage = await prisma.image.create({
      data: {
        shortId: shortId,
        fileName: file.name,
        imageUrl: publicUrl,
        shortUrl: shortUrl,
      },
    });
    
    return NextResponse.json(
      {
        success: true,
        shortId: newImage.shortId,
        imageUrl: newImage.imageUrl,
        fileName: newImage.fileName,
        fileSize: file.size,
        shortUrl: newImage.shortUrl,
        message: 'Imagem enviada com sucesso!',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao processar upload',
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
