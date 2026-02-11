import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { supabase } from '@/app/lib/supabase';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received');
    
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file provided in formData');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Gerar IDs únicos
    const shortId = nanoid(8);
    const fileExtension = file.name.split('.').pop();
    const fileKey = `${shortId}-${Date.now()}.${fileExtension}`;

    // Converter arquivo para Buffer para upload no Supabase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Attempting to upload to Supabase Storage...');
    // 1. Upload para o Supabase Storage (bucket 'images')
    const { data: storageData, error: storageError } = await supabase.storage
      .from('images')
      .upload(fileKey, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) {
      console.error('Supabase Storage error:', storageError);
      throw new Error(`Storage upload failed: ${storageError.message}`);
    }

    // 2. Obter a URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileKey);

    console.log('Attempting to save to database...');
    // 3. Salvar metadados no banco de dados via Prisma
    const image = await prisma.image.create({
      data: {
        shortId,
        fileName: file.name,
        fileKey: fileKey,
        imageUrl: publicUrl,
      },
    });
    console.log('Database save successful');

    // Retornar link curto e informações
    return NextResponse.json({
      success: true,
      shortId: image.shortId,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/img/${image.shortId}`,
      imageUrl: image.imageUrl,
      fileName: image.fileName,
    });
  } catch (error: any) {
    console.error('Upload error detail:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Upload failed', detail: error.message },
      { status: 500 }
    );
  }
}
