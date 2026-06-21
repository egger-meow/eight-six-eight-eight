import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "預約訂房｜86.88民宿｜宜蘭三星雙人房與四人房",
  description:
    "預約86.88民宿宜蘭三星住宿，查詢雙人房、四人房、入住日期、人數與房價資訊。正式訂房請透過電話或 LINE 與民宿主人確認。",
  alternates: {
    canonical: "/booking",
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
