import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "民宿貓貓｜86.88民宿｜宜蘭三星貓咪民宿",
  description:
    "86.88民宿有 Tokyo、Sakura、Sake、大金與大銀陪伴旅人，是宜蘭三星適合喜歡貓咪與安靜度假的民宿。",
  alternates: {
    canonical: "/cats",
  },
};

export default function CatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
