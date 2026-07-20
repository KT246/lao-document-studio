import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  return {
    metadataBase: new URL(baseUrl),
    title: "Lao Document Studio",
    description: "ສ້າງ, ແກ້ໄຂ, ບັນທຶກ ແລະ ສົ່ງອອກເອກະສານທຸລະກິດພາສາລາວ. Create, edit, save and export Lao business documents.",
    openGraph: {
      title: "Lao Document Studio",
      description: "ເລືອກແບບຟອມ, ແກ້ໄຂໂດຍກົງ ແລະ ສົ່ງອອກ PDF. Choose a template, edit directly and export Lao business documents to PDF.",
      type: "website",
      url: baseUrl,
      images: [{ url: `${baseUrl}/og.png`, width: 1200, height: 630, alt: "Lao Document Studio" }]
    },
    twitter: {
      card: "summary_large_image",
      title: "Lao Document Studio",
      description: "ເລືອກແບບຟອມ, ແກ້ໄຂໂດຍກົງ ແລະ ສົ່ງອອກ PDF. Choose, edit and export Lao documents.",
      images: [`${baseUrl}/og.png`]
    }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="lo">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
