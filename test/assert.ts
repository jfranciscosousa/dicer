import { expect } from "vitest";

export function assertEquals(actual: unknown, expected: unknown) {
  expect(actual).toEqual(expected);
}

export function assertStringIncludes(actual: string, expected: string) {
  expect(actual).toContain(expected);
}
