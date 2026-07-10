import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "86.88 B&B 管理後台",
  description: "86.88 民宿內部管理系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://api.8688bnb.com https://cloudflareinsights.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://8688bnb.com https://api.8688bnb.com;" />
      </head>
      <body>
        <AuthProvider>
          <AdminShell>{children}</AdminShell>
        </AuthProvider>
      </body>
    </html>
  );
}
