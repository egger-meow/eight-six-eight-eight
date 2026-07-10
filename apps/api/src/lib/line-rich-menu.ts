import * as fs from 'fs/promises';
import { config } from './config';
import { isLineUserId } from './notifications';
import { linePostbacks } from './line-ui';

export const lineAdminRichMenuVersion = 'admin-v1';
export const lineAdminRichMenuName = `86.88 Admin ${lineAdminRichMenuVersion}`;
export const lineRichMenuSize = { width: 2500, height: 1686 };

export type LineRichMenuClient = {
  listRichMenus(): Promise<Array<{ richMenuId: string; name: string }>>;
  createRichMenu(payload: any): Promise<string>;
  deleteRichMenu(richMenuId: string): Promise<void>;
  uploadRichMenuImage(richMenuId: string, image: Buffer, contentType: string): Promise<void>;
  linkRichMenuToUser(userId: string, richMenuId: string): Promise<void>;
  unlinkRichMenuFromUser(userId: string): Promise<void>;
};

const menuItems = [
  ['今日概況', linePostbacks.dashboard],
  ['訂房管理', linePostbacks.bookingMenu],
  ['新增訂房', linePostbacks.bookingCreate],
  ['封鎖日期', linePostbacks.blockedMenu],
  ['房型價格', linePostbacks.roomMenu],
  ['網站公告', linePostbacks.announcement],
] as const;

export function buildAdminRichMenuPayload() {
  const columnWidth = Math.floor(lineRichMenuSize.width / 3);
  const rowHeight = Math.floor(lineRichMenuSize.height / 2);
  return {
    size: lineRichMenuSize,
    selected: true,
    name: lineAdminRichMenuName,
    chatBarText: '86.88 管理',
    areas: menuItems.map(([, data], index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      return {
        bounds: {
          x: col * columnWidth,
          y: row * rowHeight,
          width: col === 2 ? lineRichMenuSize.width - columnWidth * 2 : columnWidth,
          height: row === 1 ? lineRichMenuSize.height - rowHeight : rowHeight,
        },
        action: { type: 'postback', data },
      };
    }),
  };
}

export function validateRichMenuTapAreas(payload = buildAdminRichMenuPayload()) {
  const issues: string[] = [];
  if (payload.size.width !== 2500 || payload.size.height !== 1686) {
    issues.push('Rich Menu image must be 2500x1686.');
  }
  if (payload.areas.length !== 6) issues.push('Rich Menu must have exactly six tap areas.');
  for (const [index, area] of payload.areas.entries()) {
    const { x, y, width, height } = area.bounds;
    if (x < 0 || y < 0 || width <= 0 || height <= 0) issues.push(`Area ${index + 1} has invalid dimensions.`);
    if (x + width > payload.size.width || y + height > payload.size.height) issues.push(`Area ${index + 1} exceeds menu bounds.`);
    if (area.action.type !== 'postback') issues.push(`Area ${index + 1} must use postback action.`);
  }
  return issues;
}

export async function syncLineAdminRichMenu(args: {
  client: LineRichMenuClient;
  activeUserIds: string[];
  inactiveUserIds: string[];
  imagePath?: string;
}) {
  const issues = validateRichMenuTapAreas();
  if (issues.length > 0) throw new Error(issues.join(' '));

  const menus = await args.client.listRichMenus();
  const existing = menus.find((menu) => menu.name === lineAdminRichMenuName);
  const stale = menus.filter((menu) => menu.name.startsWith('86.88 Admin ') && menu.name !== lineAdminRichMenuName);
  const richMenuId = existing?.richMenuId || await args.client.createRichMenu(buildAdminRichMenuPayload());

  let uploadedImage = false;
  if (args.imagePath) {
    const image = await fs.readFile(args.imagePath);
    validateRichMenuImage(image);
    await args.client.uploadRichMenuImage(richMenuId, image, contentTypeForImage(args.imagePath));
    uploadedImage = true;
  }

  const linked: string[] = [];
  for (const userId of uniqueValidLineUserIds(args.activeUserIds)) {
    await args.client.linkRichMenuToUser(userId, richMenuId);
    linked.push(userId);
  }

  const unlinked: string[] = [];
  for (const userId of uniqueValidLineUserIds(args.inactiveUserIds)) {
    if (linked.includes(userId)) continue;
    await args.client.unlinkRichMenuFromUser(userId);
    unlinked.push(userId);
  }

  const deletedStale: string[] = [];
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

export async function linkLineAdminRichMenuToUser(userId: string, client = createLineRichMenuHttpClient()) {
  if (!isLineUserId(userId)) return null;
  const menus = await client.listRichMenus();
  const existing = menus.find((menu) => menu.name === lineAdminRichMenuName);
  const richMenuId = existing?.richMenuId || await client.createRichMenu(buildAdminRichMenuPayload());
  await client.linkRichMenuToUser(userId, richMenuId);
  return richMenuId;
}

export async function unlinkLineAdminRichMenuFromUser(userId: string, client = createLineRichMenuHttpClient()) {
  if (!isLineUserId(userId)) return false;
  await client.unlinkRichMenuFromUser(userId);
  return true;
}

export function uniqueValidLineUserIds(values: string[]) {
  return Array.from(new Set(values.filter(isLineUserId)));
}

export function createLineRichMenuHttpClient(accessToken = config.LINE_CHANNEL_ACCESS_TOKEN): LineRichMenuClient {
  if (!accessToken) throw new Error('LINE channel access token is not configured');
  const headers = { Authorization: `Bearer ${accessToken}` };
  return {
    async listRichMenus() {
      const response = await fetch('https://api.line.me/v2/bot/richmenu/list', { headers });
      await assertLineOk(response, 'list rich menus');
      const body = await response.json() as { richmenus?: Array<{ richMenuId: string; name: string }> };
      return body.richmenus || [];
    },
    async createRichMenu(payload) {
      const response = await fetch('https://api.line.me/v2/bot/richmenu', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await assertLineOk(response, 'create rich menu');
      const body = await response.json() as { richMenuId: string };
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
        body: image as any,
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

async function assertLineOk(response: Response, action: string) {
  if (response.ok) return;
  const body = await response.text();
  throw new Error(`Failed to ${action}: ${response.status} ${body.slice(0, 180)}`);
}

function contentTypeForImage(imagePath: string) {
  const lower = imagePath.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  throw new Error('Rich Menu image must be PNG or JPEG.');
}
export function validateRichMenuImage(image: Buffer) {
  const size = readImageSize(image);
  if (!size) throw new Error('Rich Menu image must be a valid PNG or JPEG.');
  if (size.width !== lineRichMenuSize.width || size.height !== lineRichMenuSize.height) {
    throw new Error(`Rich Menu image must be ${lineRichMenuSize.width}x${lineRichMenuSize.height}; got ${size.width}x${size.height}.`);
  }
  if (image.length > 1024 * 1024) {
    throw new Error(`Rich Menu image must be 1 MB or smaller; got ${Math.ceil(image.length / 1024)} KB.`);
  }
}

function readImageSize(image: Buffer) {
  if (image.length >= 24 && image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
  }

  if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 < image.length) {
    while (image[offset] === 0xff) offset += 1;
    const marker = image[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > image.length) return null;
    const length = image.readUInt16BE(offset);
    if (length < 2 || offset + length > image.length) return null;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      if (length < 7) return null;
      return { width: image.readUInt16BE(offset + 5), height: image.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  return null;
}

