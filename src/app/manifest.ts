import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QR-Car Garage Pro | SaaS Automobile',
    short_name: 'Garage Pro',
    description: 'Passeport d’Entretien Numérique, Gestion d’Atelier & Diagnostic Automobile.',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#060911',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
