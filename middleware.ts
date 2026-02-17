import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Headers essenciais para link previews
  response.headers.set('X-UA-Compatible', 'IE=edge');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache headers para otimizar crawlers (WhatsApp prefere cache curto para testes)
  response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
  
  // Content Security Policy - Removido para teste se estava bloqueando algo, mas mantendo o básico
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src * data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

// Aplicar middleware apenas em rotas dinâmicas
export const config = {
  matcher: ['/img/:path*'],
};
