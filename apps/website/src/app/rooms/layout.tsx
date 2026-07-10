import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "客房介紹｜86.88民宿｜宜蘭三星雙人房與四人房",
  description:
    "瀏覽86.88民宿客房介紹，包含宜蘭三星雙人房、四人房、平日假日房價、容納人數、房間照片與訂房連結。",
  alternates: {
    canonical: "/rooms",
  },
};

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
