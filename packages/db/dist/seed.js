import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
const db = new PrismaClient();
const seededMediaTargets = {
    homepage_hero: [
        { url: '/images/index-page/dex1.jpg', altText: '86.88民宿 大廳' },
        { url: '/images/index-page/dex2.jpg', altText: '86.88民宿 露台' },
        { url: '/images/index-page/dex3.jpg', altText: '86.88民宿 餐廳' },
        { url: '/images/index-page/dex4.jpg', altText: '86.88民宿 客廳' },
        { url: '/images/exterior/building-1.jpg', altText: '86.88民宿 建築' },
    ],
    gallery: [
        { url: '/images/exterior/building-1.jpg', altText: '民宿外觀' },
        { url: '/images/public-spaces/dining-area-1.jpg', altText: '餐廳空間' },
        { url: '/images/public-spaces/dining-area-2.jpg', altText: '交誼空間' },
        { url: '/images/public-spaces/2f-lounge.jpg', altText: '二樓交誼廳' },
        { url: '/images/public-spaces/3f-lounge-1.jpg', altText: '三樓空間' },
        { url: '/images/exterior/building-2.jpg', altText: '建築外觀' },
        { url: '/images/rooms/pastoral-quad/main/main.jpg', altText: '四人房' },
        { url: '/images/rooms/romantic-double/main/main.jpg', altText: '景觀二人房' },
    ],
    about: [
        { url: '/images/public-spaces/3f-lounge-2.jpg', altText: '關於86.88民宿' },
    ],
    rooms_overview: [
        { url: '/images/rooms/pastoral-quad/main/main.jpg', altText: '客房介紹' },
    ],
    booking_info: [
        { url: '/images/index-page/dex2.jpg', altText: '訂房資訊' },
    ],
    location: [
        { url: '/images/exterior/building-2.jpg', altText: '民宿位置' },
    ],
};
async function ensureMedia(target, url, sortOrder, altText) {
    const existingMedia = await db.media.findFirst({ where: { target, url } });
    if (existingMedia) {
        await db.media.update({
            where: { id: existingMedia.id },
            data: { sortOrder, altText: existingMedia.altText || altText || null },
        });
        return;
    }
    await db.media.create({
        data: {
            target,
            filenameOriginal: path.basename(url),
            filenameStored: path.basename(url),
            url,
            mimeType: 'image/jpeg',
            sizeBytes: 0,
            altText: altText || null,
            sortOrder,
        }
    });
}
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
                    await ensureMedia(target, imgUrl, imgSortOrder, room.nameZh);
                    console.log(`  📸 Media ensured: ${imgUrl}`);
                }
            }
        }
    }
    else {
        console.warn(`⚠️ rooms.json not found at ${roomsJsonPath}`);
    }
    // 3. Seed website section media
    for (const [target, items] of Object.entries(seededMediaTargets)) {
        let sortOrder = 0;
        for (const item of items) {
            sortOrder += 10;
            await ensureMedia(target, item.url, sortOrder, item.altText);
            console.log(`✅ Media ensured: ${target} ${item.url}`);
        }
    }
    // 4. Seed pages
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
//# sourceMappingURL=seed.js.map