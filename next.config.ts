import type { NextConfig } from 'next';

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

              // Script: oynatıcıların dinamik script yüklemelerine izin vermek için genişletildi
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:",

              // Style: kendi + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              // Font
              "font-src 'self' https://fonts.gstatic.com",

              // Resimler: TMDB + wsrv.nl + data URI
              "img-src 'self' data: blob: https://image.tmdb.org https://wsrv.nl https://*.tmdb.org",

              // Frame/Embed: Oynatıcıların iç içe dinamik iframe ve CDN yüklemelerini engellememek için serbest bırakıldı
              "frame-src 'self' https: http: data: blob:",

              // Bağlantı: API çağrıları
              "connect-src 'self' https: http:",

              // Media (HLS/video kaynakları)
              "media-src 'self' blob: https: http:",

              // Worker (service worker vb.)
              "worker-src 'self' blob:",

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
