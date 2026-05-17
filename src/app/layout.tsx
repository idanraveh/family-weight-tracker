import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Weight Tracker",
  description: "A simple family weight tracking app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
          {children}
        </div>
        <p className="text-center text-xs text-gray-300 pb-6">
          Simple family tracking tool — not medical advice.
        </p>
      </body>
    </html>
  );
}
