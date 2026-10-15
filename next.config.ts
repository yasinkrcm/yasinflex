import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'wsrv.nl' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Ana sayfanın iframe içinde açılmasını engelle
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },

          // Popup açmaya ve ana sayfayı yönlendirmeye karşı koruma
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            // Reklamlarda sık kullanılan API'leri kapat, oynatıcı için gerekli izinleri aç
            value: [
              'accelerometer=*',
              'autoplay=*',
              'camera=()',
              'clipboard-write=()',
              'encrypted-media=*',
              'fullscreen=*',
              'geolocation=()',
              'gyroscope=*',
              'magnetometer=()',
              'microphone=()',
              'midi=()',
              'payment=()',
              'picture-in-picture=*',
              'publickey-credentials-get=()',
              'screen-wake-lock=()',
              'sync-xhr=()',
              'usb=()',
              'xr-spatial-tracking=()',
            ].join(', '),
          },
          {
            // Content Security Policy — bilinen reklam ağlarını engelle, üçüncü taraf oynatıcıların çalışmasına izin ver
            key: 'Content-Security-Policy',
            value: [
              // Varsayılan olarak sadece kendi domain'e izin ver
              "default-src 'self'",

              // Script: sadece kendi script'leri + Next.js hydration'ı için inline.
              // unsafe-eval yalnızca dev (React Refresh/HMR) için.
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,

              // Style: kendi + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              // Font
              "font-src 'self' https://fonts.gstatic.com",

              // Resimler: TMDB + wsrv.nl + data URI
              "img-src 'self' data: blob: https://image.tmdb.org https://wsrv.nl https://*.tmdb.org",

              // Frame/Embed: oynatıcı iframe'leri https üzerinden yüklenir
              "frame-src 'self' https:",

              // Bağlantı: API çağrıları — TMDB çağrıları sunucu tarafında yapılır
              "connect-src 'self'",

              // Media (blob: HLS kaynakları)
              "media-src 'self' blob: https:",

              // Worker (service worker vb.)
              "worker-src 'self' blob:",

              // Nesne/embed etiketlerini tamamen kapat
              "object-src 'none'",

              // Form gönderimlerini sadece kendi siteye izin ver
              "form-action 'self'",

              // Reklam trackerları için base-uri kısıtla
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
