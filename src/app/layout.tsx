import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { BRAND_NAME } from '@/lib/brand'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: 'Find and offer support through needs-based connections.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col bg-background`}>
        {children}
      </body>
    </html>
  )
}
