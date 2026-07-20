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
    description: "ເຄື່ອງມືສ້າງ, ແກ້ໄຂ, ບັນທຶກ ແລະ ຈັດການເອກະສານພາສາລາວທຸກປະເພດ.",
    icons: {
      icon: [{ url: "/logo.png", type: "image/png" }],
      apple: "/logo.png"
    },
    openGraph: {
      title: "Lao Document Studio",
      description: "ສ້າງ, ແກ້ໄຂ ແລະ ຈັດການເອກະສານພາສາລາວທຸກປະເພດ.",
      type: "website",
      url: baseUrl,
      images: [{ url: `${baseUrl}/og.png`, width: 1200, height: 630, alt: "Lao Document Studio" }]
    },
    twitter: {
      card: "summary_large_image",
      title: "Lao Document Studio",
      description: "ສ້າງ, ແກ້ໄຂ ແລະ ຈັດການເອກະສານພາສາລາວທຸກປະເພດ.",
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
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Lao:wght@400;500;600;700&family=Noto+Sans+Lao+Looped:wght@400;500;600;700&family=Noto+Serif+Lao:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
