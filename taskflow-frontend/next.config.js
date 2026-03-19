/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite que las imágenes de dominios externos se muestren correctamente
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;