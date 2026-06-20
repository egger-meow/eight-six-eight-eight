import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection } from '../middleware/csrf';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { RoomCreateSchema, RoomUpdateSchema } from '../schemas/rooms.schema';
import { DateRangeQuerySchema, SlugParamSchema } from '../schemas/common.schema';

import { db } from '@8688bnb/db';
import { calculateStayPricingDetails } from '../lib/pricing';
import { bootstrapKnownMediaTargets, bootstrapMediaTarget } from '../lib/media-bootstrap';

const router = Router();

function mapRoomToResponse(room: any) {
  return {
    id: room.id,
    slug: room.slug,
    name_zh: room.nameZh,
    name_en: room.nameEn,
    capacity: room.capacity,
    type: room.type,
    description: room.description,
    amenities: room.amenities,
    price_weekday: room.priceWeekday,
    price_weekend: room.priceWeekend,
    price_holiday: room.priceHoliday,
    available: room.available,
    sort_order: room.sortOrder,
    created_at: room.createdAt.toISOString(),
    updated_at: room.updatedAt.toISOString()
  };
}

function mapMediaToResponse(m: any) {
  return {
    id: m.id,
    target: m.target,
    filename_original: m.filenameOriginal,
    filename_stored: m.filenameStored,
    url: m.url,
    mime_type: m.mimeType,
    size_bytes: m.sizeBytes,
    alt_text: m.altText,
    sort_order: m.sortOrder,
    created_at: m.createdAt.toISOString(),
    updated_at: m.updatedAt.toISOString()
  };
}

router.get('/', async (req, res, next) => {
  try {
    await bootstrapKnownMediaTargets();
    const rooms = await db.room.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    const roomSlugs = rooms.map((r: any) => `room_${r.slug}`);
    const allImages = await db.media.findMany({
      where: { target: { in: roomSlugs } },
      orderBy: { sortOrder: 'asc' }
    });

    const imagesByRoom = new Map<string, any[]>();
    for (const img of allImages) {
      const slug = img.target.replace(/^room_/, '');
      if (!imagesByRoom.has(slug)) {
        imagesByRoom.set(slug, []);
      }
      imagesByRoom.get(slug)!.push(mapMediaToResponse(img));
    }

    const mappedRooms = rooms.map((r: any) => ({
      ...mapRoomToResponse(r),
      images: imagesByRoom.get(r.slug) || []
    }));

    res.json({ success: true, data: mappedRooms });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAdmin, doubleCsrfProtection, validate(RoomCreateSchema), async (req, res, next) => {
  try {
    const data = req.body;
    
    // Check if slug is unique
    const existing = await db.room.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: '房型代號 (slug) 已存在' } });
    }

    const room = await db.room.create({
      data: {
        slug: data.slug,
        nameZh: data.name_zh,
        nameEn: data.name_en || null,
        capacity: data.capacity,
        type: data.type,
        description: data.description || null,
        amenities: data.amenities || [],
        priceWeekday: data.price_weekday,
        priceWeekend: data.price_weekend,
        priceHoliday: data.price_holiday,
        available: data.available !== undefined ? data.available : true,
        sortOrder: data.sort_order || 0
      }
    });

    res.status(201).json({ success: true, data: { ...mapRoomToResponse(room), images: [] } });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', validateParams(SlugParamSchema), async (req, res, next) => {
  try {
    await bootstrapMediaTarget(`room_${req.params.slug}`);
    const room = await db.room.findUnique({
      where: { slug: req.params.slug }
    });
    if (!room) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } });
    }

    const images = await db.media.findMany({
      where: { target: `room_${room.slug}` },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      data: {
        ...mapRoomToResponse(room),
        images: images.map(mapMediaToResponse)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:slug', requireAdmin, doubleCsrfProtection, validateParams(SlugParamSchema), validate(RoomUpdateSchema), async (req, res, next) => {
  try {
    const data = req.body;
    
    const existingRoom = await db.room.findUnique({
      where: { slug: req.params.slug }
    });
    if (!existingRoom) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } });
    }

    const updateData: any = {};
    if (data.name_zh !== undefined) updateData.nameZh = data.name_zh;
    if (data.name_en !== undefined) updateData.nameEn = data.name_en;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.price_weekday !== undefined) updateData.priceWeekday = data.price_weekday;
    if (data.price_weekend !== undefined) updateData.priceWeekend = data.price_weekend;
    if (data.price_holiday !== undefined) updateData.priceHoliday = data.price_holiday;
    if (data.available !== undefined) updateData.available = data.available;
    if (data.sort_order !== undefined) updateData.sortOrder = data.sort_order;

    const room = await db.room.update({
      where: { slug: req.params.slug },
      data: updateData
    });

    const images = await db.media.findMany({
      where: { target: `room_${room.slug}` },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      data: {
        ...mapRoomToResponse(room),
        images: images.map(mapMediaToResponse)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:slug', requireAdmin, doubleCsrfProtection, validateParams(SlugParamSchema), async (req, res, next) => {
  try {
    const existingRoom = await db.room.findUnique({
      where: { slug: req.params.slug }
    });
    if (!existingRoom) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } });
    }

    await db.room.update({
      where: { slug: req.params.slug },
      data: { available: false }
    });

    res.json({ success: true, data: { message: '房型已停用' } });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug/availability', validateParams(SlugParamSchema), validateQuery(DateRangeQuerySchema), async (req, res, next) => {
  try {
    const fromStr = req.query.from as string;
    const toStr = req.query.to as string;
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const slug = req.params.slug;

    const room = await db.room.findUnique({
      where: { slug }
    });
    if (!room) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } });
    }

    const bookingConflict = await db.booking.findFirst({
      where: {
        roomId: room.id,
        status: { notIn: ['cancelled', 'no_show'] },
        AND: [
          { checkIn: { lt: to } },
          { checkOut: { gt: from } }
        ]
      }
    });

    const blockConflict = await db.blockedDate.findFirst({
      where: {
        OR: [
          { roomId: room.id },
          { roomId: null }
        ],
        AND: [
          { startDate: { lte: to } },
          { endDate: { gte: from } }
        ]
      }
    });

    const conflicts: any[] = [];
    if (bookingConflict) {
      conflicts.push({
        type: 'booking',
        id: bookingConflict.id,
        status: bookingConflict.status
      });
    }
    if (blockConflict) {
      conflicts.push({
        type: 'block',
        id: blockConflict.id,
        reason: blockConflict.reason
      });
    }

    const available = conflicts.length === 0;

    const pricingDetails = await calculateStayPricingDetails(room, from, to);

    res.json({
      success: true,
      data: {
        available,
        room_slug: slug,
        from: fromStr,
        to: toStr,
        conflicts,
        estimated_price: pricingDetails.totalPrice,
        pricing_flags: {
          special_weekend: pricingDetails.hasSpecialWeekendRate,
          holiday: pricingDetails.hasHolidayRate
        }
      }
    });
  } catch (error) {
    next(error);
  }
});


export default router;
