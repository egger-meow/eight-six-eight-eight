import { describe, expect, it } from 'vitest';
import {
  buildAdminRichMenuPayload,
  linkLineAdminRichMenuToUser,
  syncLineAdminRichMenu,
  unlinkLineAdminRichMenuFromUser,
  validateRichMenuTapAreas,
  type LineRichMenuClient,
} from '../src/lib/line-rich-menu';

function validUser(suffix: string) {
  return `U${suffix.padStart(32, '0')}`;
}

function mockClient(existingMenus: Array<{ richMenuId: string; name: string }> = []): LineRichMenuClient & { calls: string[]; linked: string[]; unlinked: string[] } {
  const calls: string[] = [];
  const linked: string[] = [];
  const unlinked: string[] = [];
  return {
    calls,
    linked,
    unlinked,
    async listRichMenus() { calls.push('list'); return existingMenus; },
    async createRichMenu() { calls.push('create'); return 'rich-new'; },
    async deleteRichMenu(id) { calls.push(`delete:${id}`); },
    async uploadRichMenuImage() { calls.push('upload'); },
    async linkRichMenuToUser(userId, richMenuId) { calls.push(`link:${userId}:${richMenuId}`); linked.push(userId); },
    async unlinkRichMenuFromUser(userId) { calls.push(`unlink:${userId}`); unlinked.push(userId); },
  };
}

describe('LINE admin Rich Menu payload', () => {
  it('uses six hidden postback tap areas inside 2500x1686 bounds', () => {
    const payload = buildAdminRichMenuPayload();
    expect(payload.size).toEqual({ width: 2500, height: 1686 });
    expect(payload.areas).toHaveLength(6);
    expect(validateRichMenuTapAreas(payload)).toEqual([]);
    expect(payload.areas.every((area) => area.action.type === 'postback')).toBe(true);
    expect(payload.areas.map((area) => area.action.data)).toEqual([
      'v=1&a=dashboard',
      'v=1&a=booking_menu',
      'v=1&a=booking_create',
      'v=1&a=blocked_menu',
      'v=1&a=room_menu',
      'v=1&a=announcement',
    ]);
  });
});

describe('LINE admin Rich Menu sync', () => {
  it('is idempotent when the current versioned menu already exists', async () => {
    const client = mockClient([{ richMenuId: 'rich-existing', name: '86.88 Admin admin-v1' }]);
    const result = await syncLineAdminRichMenu({
      client,
      activeUserIds: [validUser('1'), validUser('2'), validUser('1')],
      inactiveUserIds: [validUser('3')],
    });
    expect(result.created).toBe(false);
    expect(result.richMenuId).toBe('rich-existing');
    expect(client.calls).not.toContain('create');
    expect(client.linked).toEqual([validUser('1'), validUser('2')]);
    expect(client.unlinked).toEqual([validUser('3')]);
  });

  it('creates the menu, links multiple active users, unlinks inactive users, and skips invalid IDs', async () => {
    const client = mockClient();
    const result = await syncLineAdminRichMenu({
      client,
      activeUserIds: [validUser('a'), 'not-a-line-user', validUser('b')],
      inactiveUserIds: [validUser('c'), 'Ushort'],
    });
    expect(result.created).toBe(true);
    expect(result.linked).toEqual([validUser('a'), validUser('b')]);
    expect(result.unlinked).toEqual([validUser('c')]);
  });

  it('deletes stale 86.88 admin rich menus but does not touch unrelated menus', async () => {
    const client = mockClient([
      { richMenuId: 'old', name: '86.88 Admin admin-v0' },
      { richMenuId: 'current', name: '86.88 Admin admin-v1' },
      { richMenuId: 'other', name: 'Other Menu' },
    ]);
    const result = await syncLineAdminRichMenu({ client, activeUserIds: [], inactiveUserIds: [] });
    expect(result.deletedStale).toEqual(['old']);
    expect(client.calls).toContain('delete:old');
    expect(client.calls).not.toContain('delete:other');
  });

  it('never links unauthorized or malformed users through one-off lifecycle helpers', async () => {
    const client = mockClient([{ richMenuId: 'rich-existing', name: '86.88 Admin admin-v1' }]);
    await linkLineAdminRichMenuToUser('not-authorized', client);
    await unlinkLineAdminRichMenuFromUser('not-authorized', client);
    expect(client.linked).toEqual([]);
    expect(client.unlinked).toEqual([]);
  });
});
