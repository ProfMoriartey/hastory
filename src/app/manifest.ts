import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Your App Name',
    short_name: 'YourApp',
    description: 'A brief description of your web application.',
    start_url: '/',
    display: 'standalone', // Makes it feel like a native app (removes browser UI)
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      // You must place your icon files in your `public/` directory
      {
        src: '/icons/android-chrome-192x192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/android-chrome-512x512',
        sizes: '512x512',
        type: 'image/png',
      },
      // Add more sizes and a 'maskable' icon for Android
    ],
  };
}