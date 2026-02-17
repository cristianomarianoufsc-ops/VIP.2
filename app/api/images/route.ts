import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const images = await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(images);
  } catch (error: any) {
    console.error('Erro ao buscar imagens:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar imagens', detail: error.message },
      { status: 500 }
    );
  }
}
