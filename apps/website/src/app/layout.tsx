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

export const metadata: Metadata = {
  title: "【86.88民宿】宜蘭三星｜歐風質感精緻渡假｜貓咪陪伴 療癒人心",
  description:
    "宜蘭三星的86.88民宿，歐風質感建築設計，一樓寬敞木質感客廳，還有貓咪的溫情陪伴，讓您在這身心都放鬆，每間房精緻裝潢，窗外安農溪畔美景，戶外大露台眺望整片星空。",
  keywords: "宜蘭民宿,86.88民宿,三星民宿,歐風民宿,安農溪,貓咪民宿",
  openGraph: {
    title: "【86.88民宿】宜蘭三星｜歐風質感精緻渡假｜貓咪陪伴 療癒人心",
    description:
      "宜蘭三星的86.88民宿，歐風質感建築設計，讓您身心都放鬆，是您來宜蘭的民宿首選！",
    locale: "zh_TW",
    type: "website",
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
