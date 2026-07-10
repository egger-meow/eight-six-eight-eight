import { describe, expect, it } from 'vitest';
import { commandHelpText } from '../src/lib/line-ui';

describe('LINE text-command fallback', () => {
  it('keeps concise text help for unknown commands instead of a menu Flex card', () => {
    const help = commandHelpText();
    expect(help).toContain('可用指令');
    expect(help.length).toBeLessThan(500);
    expect(help).not.toContain('type: flex');
    expect(help).not.toContain('Rich Menu');
  });

  it('documents existing legacy text commands for desktop fallback compatibility', () => {
    const help = commandHelpText();
    expect(help).toContain('儀表板');
    expect(help).toContain('訂單 <訂單ID/姓名/電話>');
    expect(help).toContain('確認/取消/入住/退房/未入住 <訂單ID>');
    expect(help).toContain('新增訂房 <房型slug或ID>');
    expect(help).toContain('封鎖列表');
    expect(help).toContain('房型');
    expect(help).toContain('公告更新');
  });
});
