"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const line_rich_menu_1 = require("../lib/line-rich-menu");
let dbClient = null;
async function loadDb() {
    if (dbClient)
        return dbClient;
    const module = await import('@8688bnb/db');
    dbClient = module.db;
    return dbClient;
}
async function main() {
    const imagePath = process.argv.find((arg) => arg.startsWith('--image='))?.slice('--image='.length) || process.env.LINE_RICH_MENU_IMAGE_PATH;
    const dryRun = process.argv.includes('--dry-run');
    const tapAreaIssues = (0, line_rich_menu_1.validateRichMenuTapAreas)();
    if (tapAreaIssues.length > 0)
        throw new Error(tapAreaIssues.join(' '));
    if (dryRun) {
        const summary = {
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
            summary.active_user_count = admins.filter((admin) => admin.active).length;
            summary.inactive_user_count = admins.filter((admin) => !admin.active).length;
        }
        else {
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
        const activeUserIds = admins.filter((admin) => admin.active).map((admin) => admin.lineUserId);
        const inactiveUserIds = admins.filter((admin) => !admin.active).map((admin) => admin.lineUserId);
        const result = await (0, line_rich_menu_1.syncLineAdminRichMenu)({
            client: (0, line_rich_menu_1.createLineRichMenuHttpClient)(),
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
    }
    finally {
        await db.$disconnect();
    }
}
main()
    .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
//# sourceMappingURL=sync-line-rich-menu.js.map