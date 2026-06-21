import type { Metadata } from "next";
import { Playfair_Display, Noto_Serif_TC, Quicksand } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideBox from "@/components/SideBox";
import GoTop from "@/components/GoTop";
import MobileBotBar from "@/components/MobileBotBar";
import { LanguageProvider } from "@/context/LanguageContext";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-zh",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = "https://8688bnb.com";
const siteTitle = "【86.88民宿】宜蘭三星民宿｜安農溪畔｜貓咪陪伴歐風民宿";
const siteDescription =
  "86.88民宿位於宜蘭三星安農溪畔，提供雙人房、四人房、停車資訊與訂房規則。歐風質感空間、貓咪陪伴與鄉村景色，適合宜蘭三星住宿與放鬆旅行。";

const lodgingJsonLd = {
  "@context": "https://schema.org",
  "@type": ["BedAndBreakfast", "LodgingBusiness"],
  "@id": `${siteUrl}/#lodging`,
  name: "86.88民宿",
  alternateName: "86.88 B&B",
  url: siteUrl,
  image: [
    `${siteUrl}/images/exterior/building-1.jpg`,
    `${siteUrl}/images/index-page/dex1.jpg`,
    `${siteUrl}/images/rooms/pastoral-quad/main/main.jpg`,
  ],
  telephone: "+886-920-900-793",
  email: "86.88hello@gmail.com",
  priceRange: "NT$2800-6000",
  address: {
    "@type": "PostalAddress",
    streetAddress: "拱照十二路86號",
    addressLocality: "三星鄉",
    addressRegion: "宜蘭縣",
    addressCountry: "TW",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 24.668834384066827,
    longitude: 121.68133915112652,
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "停車位", value: true },
    { "@type": "LocationFeatureSpecification", name: "雙人房", value: true },
    { "@type": "LocationFeatureSpecification", name: "四人房", value: true },
  ],
  sameAs: [
    "https://www.facebook.com/86.88bnb/",
    "http://line.naver.jp/ti/p/~@gps2290j",
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s",
  },
  description: siteDescription,
  keywords: [
    "宜蘭民宿",
    "宜蘭三星民宿",
    "三星民宿",
    "安農溪民宿",
    "貓咪民宿",
    "歐風民宿",
    "宜蘭雙人房",
    "宜蘭四人房",
    "86.88民宿",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "86.88民宿",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: "/images/exterior/building-1.jpg",
        width: 1200,
        height: 800,
        alt: "86.88民宿宜蘭三星安農溪畔歐風建築",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-TW"
      className={`${playfair.variable} ${notoSerifTC.variable} ${quicksand.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link
          rel="stylesheet"
          href="https://use.fontawesome.com/releases/v5.15.4/css/all.css"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingJsonLd) }}
        />
      </head>
      <body>
        <LanguageProvider>
          <Header />
          <SideBox />
          <main>{children}</main>
          <Footer />
          <MobileBotBar />
          <GoTop />
        </LanguageProvider>
      </body>
    </html>
  );
}
