import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from './components/SessionProvider'

export const metadata: Metadata = {
  title: "Library Management System",
  description: "A modern library management system for managing books, check-ins, and check-outs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}