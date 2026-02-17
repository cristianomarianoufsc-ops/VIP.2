import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const isCrawler = /facebookexternalhit|WhatsApp|Twitterbot|Pinterest|Slackbot|LinkedInBot/i.test(userAgent);

  // Se for um crawler conhecido, tentamos garantir que ele receba os metadados sem bloqueios
  // Nota: Se a proteção da Vercel estiver no nível de infraestrutura (Deployment Protection),
  // este middleware pode nem ser executado para o crawler.
  
  const response = NextResponse.next();

  // Headers essenciais para link previews
  response.headers.set('X-UA-Compatible', 'IE=edge');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
  
  // Cache headers para otimizar crawlers (WhatsApp prefere cache curto para testes)
  // Aumentamos um pouco o s-maxage para o CDN da Vercel servir os metadados rápido
  response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600');
  
  // Garantir que o Content-Type seja text/html para páginas de imagem
  if (request.nextUrl.pathname.startsWith('/img/')) {
    response.headers.set('Content-Type', 'text/html; charset=utf-8');
  }

  return response;
}

// Aplicar middleware apenas em rotas dinâmicas e de imagem
export const config = {
  matcher: ['/img/:path*', '/api/images/:path*'],
};
