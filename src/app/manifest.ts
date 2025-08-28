import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Therapist',
    short_name: 'AI Therapist',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
  };
}


