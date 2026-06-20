"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineRichMenuSize = exports.lineAdminRichMenuName = exports.lineAdminRichMenuVersion = void 0;
exports.buildAdminRichMenuPayload = buildAdminRichMenuPayload;
exports.validateRichMenuTapAreas = validateRichMenuTapAreas;
exports.syncLineAdminRichMenu = syncLineAdminRichMenu;
exports.linkLineAdminRichMenuToUser = linkLineAdminRichMenuToUser;
exports.unlinkLineAdminRichMenuFromUser = unlinkLineAdminRichMenuFromUser;
exports.uniqueValidLineUserIds = uniqueValidLineUserIds;
exports.createLineRichMenuHttpClient = createLineRichMenuHttpClient;
exports.validateRichMenuImage = validateRichMenuImage;
const fs = __importStar(require("fs/promises"));
const config_1 = require("./config");
const notifications_1 = require("./notifications");
const line_ui_1 = require("./line-ui");
exports.lineAdminRichMenuVersion = 'admin-v1';
exports.lineAdminRichMenuName = `86.88 Admin ${exports.lineAdminRichMenuVersion}`;
exports.lineRichMenuSize = { width: 2500, height: 1686 };
const menuItems = [
    ['今日概況', line_ui_1.linePostbacks.dashboard],
    ['訂房管理', line_ui_1.linePostbacks.bookingMenu],
    ['新增訂房', line_ui_1.linePostbacks.bookingCreate],
    ['封鎖日期', line_ui_1.linePostbacks.blockedMenu],
    ['房型價格', line_ui_1.linePostbacks.roomMenu],
    ['網站公告', line_ui_1.linePostbacks.announcement],
];
function buildAdminRichMenuPayload() {
    const columnWidth = Math.floor(exports.lineRichMenuSize.width / 3);
    const rowHeight = Math.floor(exports.lineRichMenuSize.height / 2);
    return {
        size: exports.lineRichMenuSize,
        selected: true,
        name: exports.lineAdminRichMenuName,
        chatBarText: '86.88 管理',
        areas: menuItems.map(([, data], index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            return {
                bounds: {
                    x: col * columnWidth,
                    y: row * rowHeight,
                    width: col === 2 ? exports.lineRichMenuSize.width - columnWidth * 2 : columnWidth,
                    height: row === 1 ? exports.lineRichMenuSize.height - rowHeight : rowHeight,
                },
                action: { type: 'postback', data },
            };
        }),
    };
}
function validateRichMenuTapAreas(payload = buildAdminRichMenuPayload()) {
    const issues = [];
    if (payload.size.width !== 2500 || payload.size.height !== 1686) {
        issues.push('Rich Menu image must be 2500x1686.');
    }
    if (payload.areas.length !== 6)
        issues.push('Rich Menu must have exactly six tap areas.');
    for (const [index, area] of payload.areas.entries()) {
        const { x, y, width, height } = area.bounds;
        if (x < 0 || y < 0 || width <= 0 || height <= 0)
            issues.push(`Area ${index + 1} has invalid dimensions.`);
        if (x + width > payload.size.width || y + height > payload.size.height)
            issues.push(`Area ${index + 1} exceeds menu bounds.`);
        if (area.action.type !== 'postback')
            issues.push(`Area ${index + 1} must use postback action.`);
    }
    return issues;
}
async function syncLineAdminRichMenu(args) {
    const issues = validateRichMenuTapAreas();
    if (issues.length > 0)
        throw new Error(issues.join(' '));
    const menus = await args.client.listRichMenus();
    const existing = menus.find((menu) => menu.name === exports.lineAdminRichMenuName);
    const stale = menus.filter((menu) => menu.name.startsWith('86.88 Admin ') && menu.name !== exports.lineAdminRichMenuName);
    const richMenuId = existing?.richMenuId || await args.client.createRichMenu(buildAdminRichMenuPayload());
    let uploadedImage = false;
    if (args.imagePath) {
        const image = await fs.readFile(args.imagePath);
        validateRichMenuImage(image);
        await args.client.uploadRichMenuImage(richMenuId, image, contentTypeForImage(args.imagePath));
        uploadedImage = true;
    }
    const linked = [];
    for (const userId of uniqueValidLineUserIds(args.activeUserIds)) {
        await args.client.linkRichMenuToUser(userId, richMenuId);
        linked.push(userId);
    }
    const unlinked = [];
    for (const userId of uniqueValidLineUserIds(args.inactiveUserIds)) {
        if (linked.includes(userId))
            continue;
        await args.client.unlinkRichMenuFromUser(userId);
        unlinked.push(userId);
    }
    const deletedStale = [];
    for (const menu of stale) {
        await args.client.deleteRichMenu(menu.richMenuId);
        deletedStale.push(menu.richMenuId);
    }
    return {
        richMenuId,
        created: !existing,
        uploadedImage,
        linked,
        unlinked,
        deletedStale,
        areaCount: buildAdminRichMenuPayload().areas.length,
    };
}
async function linkLineAdminRichMenuToUser(userId, client = createLineRichMenuHttpClient()) {
    if (!(0, notifications_1.isLineUserId)(userId))
        return null;
    const menus = await client.listRichMenus();
    const existing = menus.find((menu) => menu.name === exports.lineAdminRichMenuName);
    const richMenuId = existing?.richMenuId || await client.createRichMenu(buildAdminRichMenuPayload());
    await client.linkRichMenuToUser(userId, richMenuId);
    return richMenuId;
}
async function unlinkLineAdminRichMenuFromUser(userId, client = createLineRichMenuHttpClient()) {
    if (!(0, notifications_1.isLineUserId)(userId))
        return false;
    await client.unlinkRichMenuFromUser(userId);
    return true;
}
function uniqueValidLineUserIds(values) {
    return Array.from(new Set(values.filter(notifications_1.isLineUserId)));
}
function createLineRichMenuHttpClient(accessToken = config_1.config.LINE_CHANNEL_ACCESS_TOKEN) {
    if (!accessToken)
        throw new Error('LINE channel access token is not configured');
    const headers = { Authorization: `Bearer ${accessToken}` };
    return {
        async listRichMenus() {
            const response = await fetch('https://api.line.me/v2/bot/richmenu/list', { headers });
            await assertLineOk(response, 'list rich menus');
            const body = await response.json();
            return body.richmenus || [];
        },
        async createRichMenu(payload) {
            const response = await fetch('https://api.line.me/v2/bot/richmenu', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            await assertLineOk(response, 'create rich menu');
            const body = await response.json();
            return body.richMenuId;
        },
        async deleteRichMenu(richMenuId) {
            const response = await fetch(`https://api.line.me/v2/bot/richmenu/${richMenuId}`, { method: 'DELETE', headers });
            await assertLineOk(response, 'delete stale rich menu');
        },
        async uploadRichMenuImage(richMenuId, image, contentType) {
            const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': contentType },
                body: image,
            });
            await assertLineOk(response, 'upload rich menu image');
        },
        async linkRichMenuToUser(userId, richMenuId) {
            const response = await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`, { method: 'POST', headers });
            await assertLineOk(response, 'link rich menu');
        },
        async unlinkRichMenuFromUser(userId) {
            const response = await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu`, { method: 'DELETE', headers });
            await assertLineOk(response, 'unlink rich menu');
        },
    };
}
async function assertLineOk(response, action) {
    if (response.ok)
        return;
    const body = await response.text();
    throw new Error(`Failed to ${action}: ${response.status} ${body.slice(0, 180)}`);
}
function contentTypeForImage(imagePath) {
    const lower = imagePath.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
        return 'image/jpeg';
    if (lower.endsWith('.png'))
        return 'image/png';
    throw new Error('Rich Menu image must be PNG or JPEG.');
}
function validateRichMenuImage(image) {
    const size = readImageSize(image);
    if (!size)
        throw new Error('Rich Menu image must be a valid PNG or JPEG.');
    if (size.width !== exports.lineRichMenuSize.width || size.height !== exports.lineRichMenuSize.height) {
        throw new Error(`Rich Menu image must be ${exports.lineRichMenuSize.width}x${exports.lineRichMenuSize.height}; got ${size.width}x${size.height}.`);
    }
    if (image.length > 1024 * 1024) {
        throw new Error(`Rich Menu image must be 1 MB or smaller; got ${Math.ceil(image.length / 1024)} KB.`);
    }
}
function readImageSize(image) {
    if (image.length >= 24 && image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
    }
    if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8)
        return null;
    let offset = 2;
    while (offset + 4 < image.length) {
        while (image[offset] === 0xff)
            offset += 1;
        const marker = image[offset];
        offset += 1;
        if (marker === 0xd9 || marker === 0xda)
            break;
        if (offset + 2 > image.length)
            return null;
        const length = image.readUInt16BE(offset);
        if (length < 2 || offset + length > image.length)
            return null;
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
            if (length < 7)
                return null;
            return { width: image.readUInt16BE(offset + 5), height: image.readUInt16BE(offset + 3) };
        }
        offset += length;
    }
    return null;
}
//# sourceMappingURL=line-rich-menu.js.map