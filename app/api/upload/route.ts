import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
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

    // Verificar se as variáveis de ambiente estão configuradas


    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log(`[${requestId}] No file provided in formData`);
      return NextResponse.json(
        { error: 'Nenhum arquivo foi fornecido' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      console.log(`[${requestId}] File validation failed: ${validation.error}`);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Gerar IDs únicos
    const shortId = nanoid(8);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileKey = `${shortId}-${Date.now()}.${fileExtension}`;

    console.log(`[${requestId}] Generated fileKey: ${fileKey}`);

    // Converter arquivo para Buffer para upload no Supabase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[${requestId}] Attempting to upload to Cloudinary...`);

    const cloudinaryUploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "vip2_uploads", public_id: fileKey },
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
        { status: 500 }
      );
    }

    const publicUrl = cloudinaryUploadResult.secure_url;
    console.log(`[${requestId}] Cloudinary upload successful. Public URL: ${publicUrl}`);





    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Upload completed successfully in ${duration}ms`);

    // Retornar link curto e informações
    return NextResponse.json({
      success: true,
      shortId,
      imageUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      uploadDuration: duration
    });
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
      { status: 500 }
    );
  }
}
