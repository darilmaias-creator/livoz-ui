import type { Metadata } from "next";
import { KidModeRouteGuard } from "@/components/KidModeRouteGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Livoz",
  description: "Cada palavra, uma nova descoberta.",
  manifest: "/manifest.json",
  icons: {
    icon: "/brand/icon-main.png",
    shortcut: "/brand/icon-main.png",
    apple: "/brand/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <KidModeRouteGuard />
        {children}
      </body>
    </html>
  );
}
