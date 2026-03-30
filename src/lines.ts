/**
 * @param input The string to split into lines. This can be an empty string.
 * @returns An iterable iterator that yields each line of the input string, excluding the line terminators. Lines with only CR/LF are included.
 *
 * @example A simple three-line string
 * ```ts
 * for (const [lineNumber, line] of lines("Hello\r\nWorld\n").map((x, i) => [i + 1, x] as const)) {
 *   console.log("Line #%d: %o", line);
 * }
 * // Output:
 * // Line #1: 'Hello\r\n'
 * // Line #2: 'World\n'
 * // Line #3: ''
 * ```
 *
 * @example A two-line string with only CR/LF
 * ```ts
 * for (const [lineNumber, line] of lines("\r\n").map((x, i) => [i + 1, x] as const)) {
 *  console.log("Line #%d: %o", line);
 * }
 * // Output:
 * // Line #1: '\r\n'
 * // Line #2: ''
 * ```
 *
 * @example An empty string
 * ```ts
 * for (const [lineNumber, line] of lines("").map((x, i) => [i + 1, x] as const)) {
 *  console.log("Line #%d: %o", line);
 * }
 * // Output:
 * // Line #1: ''
 * ```
 */
export default function* lines(input: string): Generator<string, void, void> {
  while (input.length > 0) {
    const index = input.indexOf("\n");
    if (index === -1) {
      yield input;
      return;
    }
    const before = input.slice(0, index);
    const after = input.slice(index + 1);
    input = after;
    yield before;
  }
}

/**
 * Removes a single trailing newline from the input string, if it exists. A newline is either U+000A LF ("\n") or U+000D CR followed by U+000A LF ("\r\n").
 * 
 * @param input The string to trim the trailing newline from. This can be an empty string.
 * @returns The input string with a single trailing newline removed, if it exists. If the input string does not end with a newline, it is returned unchanged.
 */
export function trimEndNewline(input: string): string {
  if (input[input.length - 1] === "\n") {
    input = input.slice(0, -1);
    if (input[input.length - 1] === "\r") {
      input = input.slice(0, -1);
    }
  }
  return input;
}

if (import.meta.vitest) {
  const { test, expect } = await import("vitest");

  test(`lines("Hello\\r\\nWorld\\n") should yield ["Hello\\r\\n", "World\\n", ""]`, () => {
    const input = "Hello\r\nWorld\n";
    const expected = ["Hello\r\n", "World\n", ""];
    const actual = [...lines(input)];
    expect(actual).toEqual(expected);
  });

  test(`lines("\\r\\n") should yield ["\\r\\n", ""]`, () => {
    const input = "\r\n";
    const expected = ["\r\n", ""];
    const actual = [...lines(input)];
    expect(actual).toEqual(expected);
  });

  test(`lines("") should yield [""]`, () => {
    const input = "";
    const expected = [""];
    const actual = [...lines(input)];
    expect(actual).toEqual(expected);
  });
}
