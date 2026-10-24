import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "NCINGA Fabric",
  description: "Device management for the NCINGA edge AI compute fabric",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ThemeProvider>
          <div className="flex min-h-svh flex-col md:flex-row">
            <AppSidebar />
            <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
