import { expect, test } from "vitest";
import { DiceRoll } from "dice-roller";

test.each([
  ["2 + 3 * 4", 14],
  ["2 * 5 % 3", 1],
  ["10 % 3 * 2", 2],
  ["2 ** 3", 8],
  ["floor(7 / 2) + abs(-2)", 5],
  ["max(2, 3) + min(4, 5)", 7],
  ["(1 + 1)d1 + 3", 5],
  ["4d1kh3", 3],
  ["d%min100", 100],
])("dice notation %s retains its total", (notation, total) => {
  expect(new DiceRoll(notation).total).toBe(total);
});

test.each([
  'a = {}',
  'a.constructor',
  'a["constructor"]',
  'import("fs")',
])("dice notation rejects object access and arbitrary expressions: %s", (notation) => {
  expect(() => new DiceRoll(notation)).toThrow();
});
