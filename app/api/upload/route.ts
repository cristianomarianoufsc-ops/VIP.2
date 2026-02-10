import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received');
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
    const fileKey = `images/${shortId}-${Date.now()}`;

    // Converter arquivo para base64 (para armazenamento local)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const imageUrl = `data:${file.type};base64,${base64}`;

    console.log('Attempting to save to database...');
    // Salvar no banco de dados
    const image = await prisma.image.create({
      data: {
        shortId,
        fileName: file.name,
        fileKey,
        imageUrl,
      },
    });
    console.log('Database save successful');

    // Retornar link curto
    return NextResponse.json({
      success: true,
      shortId: image.shortId,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/img/${image.shortId}`,
      fileName: image.fileName,
    });
  } catch (error: any) {
    console.error('Upload error detail:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      { error: 'Upload failed', detail: error.message },
      { status: 500 }
    );
  }
}
