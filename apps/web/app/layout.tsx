import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alicia's Garden",
  description: "Alicia's Garden: organiza tu jardín, registra tus plantas y recibe ayuda de Toni.",
  icons: {
    icon: "/AG Logo.png",
    shortcut: "/AG Logo.png",
    apple: "/AG Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div id="AG_APP_ROOT">{children}</div>
      </body>
    </html>
  );
}
