import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Pranay Software Solutions",
  description: "Monorepo frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <NextTopLoader color="#0ea5e9" showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
