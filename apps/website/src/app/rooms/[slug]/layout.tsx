import type { Metadata } from "next";
import rooms from "@/data/rooms.json";

type RoomDetailLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: RoomDetailLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const room = rooms.find((item) => item.slug === slug);

  if (!room) {
    return {
      title: "客房介紹｜86.88民宿",
      alternates: {
        canonical: `/rooms/${slug}`,
      },
    };
  }

  const roomType = room.type === "quad" ? "四人房" : "雙人房";

  return {
    title: `${room.name_zh}｜86.88民宿｜宜蘭三星${roomType}`,
    description: `${room.name_zh}是86.88民宿的宜蘭三星${roomType}，可入住${room.capacity}人，平日價 NT$${room.price_weekday.toLocaleString()} 起，鄰近安農溪畔並提供民宿停車資訊。`,
    alternates: {
      canonical: `/rooms/${room.slug}`,
    },
    openGraph: {
      title: `${room.name_zh}｜86.88民宿`,
      description: room.description,
      url: `/rooms/${room.slug}`,
      images: [
        {
          url: room.images[0],
          alt: `${room.name_zh}房間照片`,
        },
      ],
    },
  };
}

export default function RoomDetailLayout({ children }: RoomDetailLayoutProps) {
  return children;
}
