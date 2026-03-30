import { register } from "./encoding.ts";
import { encoderRecord } from "./index-big5.ts";
import type { Byte, ScalarValue } from "./infra.ts";

const name = "Big5" as const;
const labels = ["big5", "big5-hkscs", "cn-big5", "csbig5", "x-x-big5"] as const;
function* createEncoder(iterable: Iterable<ScalarValue>): Generator<Byte, void, void> {
  for (const codePoint of iterable) {
    if (codePoint <= 0x7f) {
      yield codePoint as number as Byte;
      continue;
    }

    const pointer = encoderRecord[codePoint];
    if (pointer == null) {
      throw Object.assign(
        new DOMException(
          `Cannot encode U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
          "EncodingError",
        ),
        { codePoint },
      );
    }

    const leading = Math.trunc(pointer / 157) + 0x81;
    const trailing = pointer % 157;
    const offset = trailing < 0x3f ? 0x40 : 0x62;
    yield leading as Byte;
    yield (trailing + offset) as Byte;
  }
}
register({ name, labels, createEncoder })

if (import.meta.vitest) {
  const { test, expect } = await import("vitest");
  const { bench, run, do_not_optimize, summary } = await import("mitata");

  test("info", () => {
    console.log("Big5 encoder record has %d entries", Object.keys(encoderRecord).length);
    // console.table(encoderRecord);
  });

  test("all index code points are encodable", { timeout: 60_000 }, () => {
    const input = Iterator.from(Object.keys(encoderRecord)).map((e) => +e as ScalarValue);
    const encoder = createEncoder(input);
    const bytes = Uint8Array.from(encoder);
    expect(bytes).toBeDefined();
  });

  test("bench", { timeout: 60_000 }, async () => {
    summary(() => {
      const allIndexCodePoints = Iterator.from(Object.keys(encoderRecord))
        .map((e) => +e as ScalarValue)
        .map((c) => String.fromCodePoint(c))
        .reduce((s, c) => s + c, "");

      bench("iterate over all Big5 index code points", () => {
        for (const codePoint of allIndexCodePoints) {
          do_not_optimize(codePoint);
        }
      });

      bench("encode all Big5 index code points", () => {
        const codePoints = allIndexCodePoints[Symbol.iterator]().map((c) => c.codePointAt(0)! as ScalarValue);
        const encoder = createEncoder(codePoints);
        for (const byte of encoder) {
          do_not_optimize(byte);
        }
      });
    });

    summary(() => {
      const allASCIICodePoints = Array.from({ length: 0x80 }, (_, i) => i)
        .map((c) => String.fromCodePoint(c))
        .reduce((s, c) => s + c, "");

      bench("iterate over all ASCII code points", () => {
        for (const codePoint of allASCIICodePoints) {
          do_not_optimize(codePoint);
        }
      });

      bench("encode all ASCII code points", () => {
        const codePoints = allASCIICodePoints[Symbol.iterator]().map((c) => c.codePointAt(0)! as ScalarValue);
        const encoder = createEncoder(codePoints);
        for (const byte of encoder) {
          do_not_optimize(byte);
        }
      });
    });

    await run();
  });
}
