import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Headers essenciais para link previews
  response.headers.set('X-UA-Compatible', 'IE=edge');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache headers para otimizar crawlers (WhatsApp prefere cache curto para testes)
  response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
  
  // Content Security Policy desativada temporariamente para garantir que não bloqueie crawlers
  // response.headers.set('Content-Security-Policy', "...");

  return response;
}

// Aplicar middleware apenas em rotas dinâmicas
export const config = {
  matcher: ['/img/:path*'],
};
