import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hastory',
    short_name: 'Hastory',
    description: 'Your smart medical documentation assistant.',
    start_url: '/dashboard',
    display: 'standalone', // Makes it feel like a native app (removes browser UI)
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      // You must place your icon files in your `public/` directory
      {
        src: '/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      // Add more sizes and a 'maskable' icon for Android
    ],
  };
}