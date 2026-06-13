import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
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

  // 2. Read rooms.json and seed rooms
  const seedDataDir = process.env.SEED_DATA_DIR || path.join(__dirname, '../../../apps/website/src/data');
  const roomsJsonPath = path.join(seedDataDir, 'rooms.json');

  if (fs.existsSync(roomsJsonPath)) {
    const roomsData = JSON.parse(fs.readFileSync(roomsJsonPath, 'utf-8'));
    let sortOrder = 0;
    for (const roomData of roomsData) {
      sortOrder += 10;
      const room = await db.room.upsert({
        where: { slug: roomData.slug },
        update: {
          nameZh: roomData.name_zh,
          nameEn: roomData.name_en,
          capacity: roomData.capacity,
          type: roomData.type,
          description: roomData.description,
          priceWeekday: roomData.price_weekday,
          priceWeekend: roomData.price_weekend,
          priceHoliday: roomData.price_holiday,
          sortOrder,
        },
        create: {
          slug: roomData.slug,
          nameZh: roomData.name_zh,
          nameEn: roomData.name_en,
          capacity: roomData.capacity,
          type: roomData.type,
          description: roomData.description,
          priceWeekday: roomData.price_weekday,
          priceWeekend: roomData.price_weekend,
          priceHoliday: roomData.price_holiday,
          sortOrder,
        },
      });
      console.log(`✅ Room ensured: ${room.nameZh} (${room.slug})`);

      // Seed media for the room
      if (roomData.images && Array.isArray(roomData.images)) {
        const target = `room_${room.slug}`;
        let imgSortOrder = 0;
        for (const imgUrl of roomData.images) {
          imgSortOrder += 10;
          const existingMedia = await db.media.findFirst({
            where: { target, url: imgUrl }
          });
          if (!existingMedia) {
            await db.media.create({
              data: {
                target,
                filenameOriginal: path.basename(imgUrl),
                filenameStored: path.basename(imgUrl),
                url: imgUrl,
                mimeType: 'image/jpeg',
                sizeBytes: 0,
                sortOrder: imgSortOrder,
              }
            });
            console.log(`  📸 Media ensured: ${imgUrl}`);
          }
        }
      }
    }
  } else {
    console.warn(`⚠️ rooms.json not found at ${roomsJsonPath}`);
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
