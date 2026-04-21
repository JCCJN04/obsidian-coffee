import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans, Bebas_Neue } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OBSIDIAN COFFEE — Café de Especialidad',
  description:
    'Granos seleccionados a mano de las altitudes más extremas del mundo, tostados con precisión milimétrica para revelar lo imposible.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${dmSans.variable} ${bebasNeue.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
