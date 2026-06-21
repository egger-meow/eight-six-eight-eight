import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "訂房資訊｜86.88民宿｜入住時間、房價與訂房規則",
  description:
    "86.88民宿訂房資訊，包含宜蘭三星住宿訂房方式、入住退房時間、付款確認、取消異動、住宿規則與 LINE、電話聯絡方式。",
  alternates: {
    canonical: "/booking-info",
  },
};

export default function BookingInfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
