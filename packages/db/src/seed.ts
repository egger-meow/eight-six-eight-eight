import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create default admin user
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || '8688bnb';
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  
  const admin = await db.user.upsert({
    where: { username: 'yenfeng' },
    update: {},
    create: {
      username: 'yenfeng',
      displayName: '黃筵丰',
      passwordHash,
    },
  });
  console.log('✅ Default admin user ensured:', admin.username);

  // 2. Seed rooms (hardcoded)
  const roomsData = [
    {
      slug: 'romantic-double',
      nameZh: '浪漫情懷 景觀二人房',
      nameEn: 'Scenic Double',
      capacity: 2,
      type: 'double',
      description: '享受浪漫的景觀與舒適的空間，非常適合情侶或夫妻入住。',
      priceWeekday: 3200,
      priceWeekend: 4000,
      priceHoliday: 4500,
    },
    {
      slug: 'rustic-double',
      nameZh: '質樸愜意 二人房',
      nameEn: 'Simple Double',
      capacity: 2,
      type: 'double',
      description: '質樸的設計帶來溫馨愜意的感受，放鬆身心的最佳選擇。',
      priceWeekday: 2800,
      priceWeekend: 3500,
      priceHoliday: 4000,
    },
    {
      slug: 'cozy-country-double',
      nameZh: '鄉村溫馨 二人房',
      nameEn: 'Country Double',
      capacity: 2,
      type: 'double',
      description: '充滿鄉村風格的溫馨套房，讓您體驗舒適的住宿環境。',
      priceWeekday: 2800,
      priceWeekend: 3500,
      priceHoliday: 4000,
    },
    {
      slug: 'warm-sweet-double',
      nameZh: '溫潤甜蜜 二人房',
      nameEn: 'Warm Double',
      capacity: 2,
      type: 'double',
      description: '溫潤甜蜜的配色，帶來像家一樣的溫暖感受。',
      priceWeekday: 2800,
      priceWeekend: 3500,
      priceHoliday: 4000,
    },
    {
      slug: 'pastoral-quad',
      nameZh: '田園鄉村 四人房',
      nameEn: 'Country Quad',
      capacity: 4,
      type: 'quad',
      description: '寬敞的四人套房，適合家庭或好友一同入住，享受田園風光。',
      priceWeekday: 4200,
      priceWeekend: 5200,
      priceHoliday: 6000,
    },
  ];

  let sortOrder = 0;
  for (const roomData of roomsData) {
    sortOrder += 10;
    const room = await db.room.upsert({
      where: { slug: roomData.slug },
      update: { ...roomData, sortOrder },
      create: { ...roomData, sortOrder },
    });
    console.log(`✅ Room ensured: ${room.nameZh} (${room.slug})`);
  }
  // 3. Seed pages
  const pages = [
    { slug: 'about', titleZh: '關於86.88民宿', titleEn: 'About 86.88 B&B' },
    { slug: 'booking-info', titleZh: '訂房資訊', titleEn: 'Booking Information' },
    { slug: 'location', titleZh: '民宿位置', titleEn: 'Getting Here' }
  ];

  for (const page of pages) {
    await db.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        slug: page.slug,
        titleZh: page.titleZh,
        titleEn: page.titleEn,
      }
    });
    console.log(`✅ Page ensured: ${page.slug}`);
  }

  console.log('🎉 Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
