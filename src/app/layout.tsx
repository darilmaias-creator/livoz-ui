import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Livoz | Cada palavra, uma nova descoberta.",
  description: "Plataforma infantil de aprendizagem de idiomas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
