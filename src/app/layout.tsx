import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Juego de Bingo',
  description: 'Un juego de Bingo interactivo',
  icons: {
    icon: '/favicon.ico',
  },

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <Analytics />
        <footer className="py-4 bg-gray-800 text-white text-center text-sm">
          <p>&copy; {new Date().getFullYear()} TSU. Del Rosario Johnangel. Todos los derechos reservados.</p>
        </footer>
      </body>
    </html>
  )
}