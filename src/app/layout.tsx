import { Analytics } from "@/components/seo/Analytics";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, localBusinessSchema, organizationSchema } from "@/lib/seo";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = buildMetadata({});
export const viewport: Viewport = { themeColor: "#0284c7", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <JsonLd data={[organizationSchema(), localBusinessSchema()]} />
      </head>
      <body className="font-sans antialiased">{children}<Analytics /></body>
    </html>
  );
}
