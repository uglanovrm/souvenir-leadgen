import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Souvenir Lead-Gen",
  description: "Local souvenir-production lead-gen offer system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
