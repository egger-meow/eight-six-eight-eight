import { createLineRichMenuHttpClient, syncLineAdminRichMenu, validateRichMenuTapAreas } from '../lib/line-rich-menu';

let dbClient: any | null = null;

async function loadDb() {
  if (dbClient) return dbClient;
  const module = await import('@8688bnb/db');
  dbClient = module.db;
  return dbClient;
}

async function main() {
  const imagePath = process.argv.find((arg) => arg.startsWith('--image='))?.slice('--image='.length) || process.env.LINE_RICH_MENU_IMAGE_PATH;
  const dryRun = process.argv.includes('--dry-run');
  const tapAreaIssues = validateRichMenuTapAreas();
  if (tapAreaIssues.length > 0) throw new Error(tapAreaIssues.join(' '));

  if (dryRun) {
    const summary: Record<string, any> = {
      dry_run: true,
      image_configured: Boolean(imagePath),
      tap_area_count: 6,
    };

    if (process.env.DATABASE_URL) {
      const db = await loadDb();
      const admins = await db.lineAdmin.findMany({
        where: { role: { in: ['owner', 'developer'] } },
        select: { lineUserId: true, active: true },
        orderBy: [{ role: 'asc' }, { boundAt: 'asc' }],
      });
      summary.active_user_count = admins.filter((admin: any) => admin.active).length;
      summary.inactive_user_count = admins.filter((admin: any) => !admin.active).length;
    } else {
      summary.database_connected = false;
    }

    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for rich-menu sync');
  }

  const db = await loadDb();
  try {
    const admins = await db.lineAdmin.findMany({
      where: { role: { in: ['owner', 'developer'] } },
      select: { lineUserId: true, active: true },
      orderBy: [{ role: 'asc' }, { boundAt: 'asc' }],
    });
    const activeUserIds = admins.filter((admin: any) => admin.active).map((admin: any) => admin.lineUserId);
    const inactiveUserIds = admins.filter((admin: any) => !admin.active).map((admin: any) => admin.lineUserId);

    const result = await syncLineAdminRichMenu({
      client: createLineRichMenuHttpClient(),
      activeUserIds,
      inactiveUserIds,
      imagePath,
    });

    console.log(JSON.stringify({
      rich_menu_id: result.richMenuId,
      created: result.created,
      uploaded_image: result.uploadedImage,
      linked_count: result.linked.length,
      unlinked_count: result.unlinked.length,
      deleted_stale_count: result.deletedStale.length,
      tap_area_count: result.areaCount,
    }, null, 2));
  } finally {
    await db.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
