import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "民宿位置｜86.88民宿｜宜蘭三星安農溪旁住宿",
  description:
    "86.88民宿位於宜蘭縣三星鄉拱照十二路86號，鄰近安農溪畔，提供開車交通方式、停車資訊、電話、LINE 與 Google 地圖。",
  alternates: {
    canonical: "/location",
  },
};

export default function LocationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
