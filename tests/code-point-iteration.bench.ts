import { describe, bench } from "vitest";

function randomASCIIString(length: number): string {
  let result = "";
  const u8s = new Uint8Array(100);
  for (let i = 0; i < length; i++) {
    if (i % 100 === 0) {
      crypto.getRandomValues(u8s);
    }
    const randomCodePoint = u8s[i % 100] & 0x7f;
    result += String.fromCharCode(randomCodePoint);
  }
  return result;
}

function randomUnicodeString(length: number): string {
  let result = "";
  const u32s = new Uint32Array(100);
  for (let i = 0; i < length; i++) {
    if (i % 100 === 0) {
      crypto.getRandomValues(u32s);
    }
    const randomCodePoint = u32s[i % 100] & 0x10ffff;
    result += String.fromCodePoint(randomCodePoint);
  }
  return result;
}

function once<T>(fn: () => T): () => T {
  let called = false;
  let result: T;
  return () => {
    if (!called) {
      result = fn();
      called = true;
    }
    return result!;
  };
}

for (const [name, createInput] of Object.entries({
  "10 ASCII characters": () => randomASCIIString(10),
  "100 ASCII characters": () => randomASCIIString(100),
  "1 KB ASCII text": () => randomASCIIString(1000),
  "500 KB ASCII text": () => randomASCIIString(500 * 1000),
  "10 MB ASCII text": () => randomASCIIString(10 * 1000 * 1000),
  "10 Unicode characters": () => randomUnicodeString(10),
  "100 Unicode characters": () => randomUnicodeString(100),
  "1 KB Unicode text": () => randomUnicodeString(1000),
  "500 KB Unicode text": () => randomUnicodeString(500 * 1000),
  "10 MB Unicode text": () => randomUnicodeString(10 * 1000 * 1000),
  "HTML specification": once(
    async () => await (await fetch("https://html.spec.whatwg.org/")).text(),
  ),
} as const)) {
  describe(`${name}`, () => {
    let input: string;
    async function setup() {
      input ??= await createInput();
    }
    function teardown() {
      input = "";
    }

    bench(
      "StringIterator codePointAt(0) for...of let/const",
      () => {
        for (const c of input) {
          const cp = c.codePointAt(0)!;
          void cp;
        }
      },
      { iterations: 100, setup, teardown },
    );

    bench(
      "StringIterator codePointAt(0) for...of var",
      () => {
        var c = "";
        var cp = 0;
        for (var c of input) {
          cp = c.codePointAt(0)!;
          void cp;
        }
      },
      { iterations: 100, setup, teardown },
    );

    bench(
      "StringIterator codePointAt(0) while let/const",
      () => {
        const it = input[Symbol.iterator]();
        while (true) {
          const { value: c, done } = it.next();
          if (done) {
            break;
          }
          const cp = c.codePointAt(0)!;
          void cp;
        }
      },
      { iterations: 100, setup, teardown },
    );

    bench(
      "StringIterator codePointAt(0) while var",
      () => {
        var it = input[Symbol.iterator]();
        var c = "";
        var done = false;
        var cp = 0;
        while (true) {
          ({ value: c, done } = it.next() as { value: string; done: boolean });
          if (done) {
            break;
          }
          cp = c.codePointAt(0)!;
          void cp;
        }
      },
      { iterations: 100, setup, teardown },
    );

    bench(
      "slice codePointAt(0) while let/const",
      () => {
        let remaining = input;
        let remainingLength = remaining.length;
        while (remainingLength > 0) {
          const cp = remaining.codePointAt(0)!;
          const oneOrTwo = cp > 0xffff ? 2 : 1;
          remaining = remaining.slice(oneOrTwo);
          remainingLength -= oneOrTwo;
          void cp;
        }
      },
      { iterations: 100, setup, teardown },
    );

    bench(
      "slice codePointAt(0) while var",
      () => {
        var remaining = input;
        var remainingLength = remaining.length;
        var cp = 0;
        var oneOrTwo = 0;
        while (remainingLength > 0) {
          cp = remaining.codePointAt(0)!;
          oneOrTwo = cp > 0xffff ? 2 : 1;
          remaining = remaining.slice(oneOrTwo);
          remainingLength -= oneOrTwo;
          void cp;
        }
      },
      { iterations: 100, setup, teardown },
    );

    bench(
      "codePointAt(i) for let/const",
      () => {
        const inputLength = input.length;
        for (let i = 0; i < inputLength; ) {
          const cp = input.codePointAt(i)!;
          void cp;
          i += cp > 0xffff ? 2 : 1;
        }
      },
      { iterations: 100, setup, teardown },
    );

    bench(
      "codePointAt(i) while var",
      () => {
        var inputLength = input.length;
        var i = 0;
        var cp = 0;
        while (i < inputLength) {
          cp = input.codePointAt(i)!;
          void cp;
          i += cp > 0xffff ? 2 : 1;
        }
      },
      { iterations: 100, setup, teardown },
    );

    bench(
      "codePointAt(n) for let/const",
      () => {
        for (
          let n = 0, cp = input.codePointAt(0);
          cp !== undefined;
          cp = input.codePointAt((n += cp > 0xffff ? 2 : 1))
        ) {
          void cp;
        }
      },
      { iterations: 100, setup, teardown },
    );

    bench(
      "codePointAt(n) while var",
      () => {
        var n = 0;
        var cp: number | undefined = input.codePointAt(0);
        for (; cp !== undefined; cp = input.codePointAt((n += cp > 0xffff ? 2 : 1))) {
          void cp;
        }
      },
      { iterations: 100, setup, teardown },
    );
  });
}
