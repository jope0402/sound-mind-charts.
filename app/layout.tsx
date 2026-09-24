import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sound & Mind Charts",
  description: "Private pilot chart for sleep, focus, relaxation, binaural, noise, nature and frequency-based audio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
