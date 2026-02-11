import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '../../lib/supabase';
import prisma from '../../lib/prisma';

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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error(`[${requestId}] Missing Supabase environment variables`);
      return NextResponse.json(
        { error: 'Erro de configuração do servidor. Variáveis de ambiente não encontradas.' },
        { status: 500 }
      );
    }

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

    console.log(`[${requestId}] Attempting to upload to Supabase Storage...`);

    // 1. Upload para o Supabase Storage (bucket 'images')
    const { data: storageData, error: storageError } = await supabase.storage
      .from('images')
      .upload(fileKey, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) {
      console.error(`[${requestId}] Supabase Storage error:`, {
        message: storageError.message,
        status: storageError.status,
        statusCode: storageError.statusCode,
        details: JSON.stringify(storageError)
      });

      // Retornar erro mais específico baseado no tipo de erro
      let errorMessage = 'Erro ao enviar arquivo para armazenamento';
      if (storageError.message.includes('Bucket not found')) {
        errorMessage = 'Bucket de armazenamento não encontrado';
      } else if (storageError.message.includes('Unauthorized')) {
        errorMessage = 'Permissão negada ao armazenamento';
      } else if (storageError.message.includes('Payload too large')) {
        errorMessage = 'Arquivo muito grande para o armazenamento';
      }

      return NextResponse.json(
        { error: errorMessage, detail: storageError.message },
        { status: 500 }
      );
    }

    console.log(`[${requestId}] Storage upload successful. Data:`, storageData);

    // 2. Obter a URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileKey);

    console.log(`[${requestId}] Generated public URL: ${publicUrl}`);

    console.log(`[${requestId}] Attempting to save to database...`);

    // 3. Salvar metadados no banco de dados via Prisma
    console.log(`[${requestId}] Prisma data:`, { shortId, fileName: file.name, fileKey, imageUrl: publicUrl });
    
    const image = await prisma.image.create({
      data: {
        shortId,
        fileName: file.name,
        fileKey: fileKey,
        imageUrl: publicUrl,
      },
    });

    console.log(`[${requestId}] Database save successful. Image ID: ${image.id}`);

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Upload completed successfully in ${duration}ms`);

    // Retornar link curto e informações
    return NextResponse.json({
      success: true,
      shortId: image.shortId,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/img/${image.shortId}`,
      imageUrl: image.imageUrl,
      fileName: image.fileName,
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
