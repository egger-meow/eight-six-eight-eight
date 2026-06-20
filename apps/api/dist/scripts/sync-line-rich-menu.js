"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("@8688bnb/db");
const line_rich_menu_1 = require("../lib/line-rich-menu");
async function main() {
    const imagePath = process.argv.find((arg) => arg.startsWith('--image='))?.slice('--image='.length) || process.env.LINE_RICH_MENU_IMAGE_PATH;
    const dryRun = process.argv.includes('--dry-run');
    const admins = await db_1.db.lineAdmin.findMany({
        where: { role: { in: ['owner', 'developer'] } },
        select: { lineUserId: true, active: true },
        orderBy: [{ role: 'asc' }, { boundAt: 'asc' }],
    });
    const tapAreaIssues = (0, line_rich_menu_1.validateRichMenuTapAreas)();
    if (tapAreaIssues.length > 0)
        throw new Error(tapAreaIssues.join(' '));
    const activeUserIds = admins.filter((admin) => admin.active).map((admin) => admin.lineUserId);
    const inactiveUserIds = admins.filter((admin) => !admin.active).map((admin) => admin.lineUserId);
    if (dryRun) {
        console.log(JSON.stringify({
            dry_run: true,
            image_configured: Boolean(imagePath),
            active_user_count: activeUserIds.length,
            inactive_user_count: inactiveUserIds.length,
            tap_area_count: 6,
        }, null, 2));
        return;
    }
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
main()
    .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
})
    .finally(async () => {
    await db_1.db.$disconnect();
});
//# sourceMappingURL=sync-line-rich-menu.js.map