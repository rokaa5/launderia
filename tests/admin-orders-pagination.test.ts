import { test } from 'node:test';
import assert from 'node:assert/strict';

test('admin orders pagination logic: 8 items per page, page count, and boundaries', () => {
  const perPage = 8;
  const pageCount = (total: number) => Math.max(1, Math.ceil(total / perPage));
  const paginate = <T>(items: T[], page: number) => {
    const clampedPage = Math.max(1, Math.min(page, pageCount(items.length)));
    const start = (clampedPage - 1) * perPage;
    return items.slice(start, start + perPage);
  };
  const movePage = (current: number, delta: number, total: number) => {
    return Math.max(1, Math.min(current + delta, pageCount(total)));
  };

  // 0 items
  assert.equal(pageCount(0), 1);
  assert.deepEqual(paginate([], 1), []);

  // 8 items
  const items8 = Array.from({ length: 8 }, (_, i) => `order-${i + 1}`);
  assert.equal(pageCount(items8.length), 1);
  assert.equal(paginate(items8, 1).length, 8);

  // 17 items (3 pages: 8 + 8 + 1)
  const items17 = Array.from({ length: 17 }, (_, i) => `order-${i + 1}`);
  assert.equal(pageCount(items17.length), 3);
  assert.equal(paginate(items17, 1).length, 8);
  assert.equal(paginate(items17, 1)[0], 'order-1');
  assert.equal(paginate(items17, 1)[7], 'order-8');

  assert.equal(paginate(items17, 2).length, 8);
  assert.equal(paginate(items17, 2)[0], 'order-9');
  assert.equal(paginate(items17, 2)[7], 'order-16');

  assert.equal(paginate(items17, 3).length, 1);
  assert.equal(paginate(items17, 3)[0], 'order-17');

  // Page movement and clamping
  assert.equal(movePage(1, -1, 17), 1); // cannot go below 1
  assert.equal(movePage(1, 1, 17), 2);
  assert.equal(movePage(2, 1, 17), 3);
  assert.equal(movePage(3, 1, 17), 3); // cannot exceed page count 3
});
