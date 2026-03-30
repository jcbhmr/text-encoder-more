import lines, { trimEndNewline } from "./lines.ts";

class TextLocation {
  line: number;
  column: number;
  constructor(
    options: { line?: number; column?: number },
    base: { line: number; column: number } | null = null,
  ) {
    const { line = 1, column = 1 } = options;
    if (base) {
      this.line = base.line + line - 1;
      this.column = line === 1 ? base.column + column - 1 : column;
    } else {
      this.line = line;
      this.column = column;
    }
  }
  toString(): string {
    return `L${this.line}:${this.column}`;
  }
}

class TextSpan {
  start: TextLocation;
  end: TextLocation;
  constructor(
    options: {
      start?: { line?: number; column?: number };
      end?: { line?: number; column?: number };
    },
    base: { line: number; column: number } | null = null,
  ) {
    const { start = {}, end = {} } = options;
    this.start = new TextLocation(start, base);
    this.end = new TextLocation(end, base);
  }
  toString(): string {
    return `${this.start}-${this.end}`;
  }
}

/**
 * Most legacy encodings make use of an index. An index is an ordered list of
 * entries, each entry consisting of a pointer and a corresponding code point.
 * Within an index pointers are unique and code points can be duplicated.
 *
 * > [!NOTE] \
 * > An efficient implementation likely has two indexes per encoding. One
 * > optimized for its decoder and one for its encoder.
 */
export default class Index {
  /**
   * A quick way to check if an index can be parsed without a clumsy try-catch block.
   *
   * @param input The index source text to parse into an `Index` object.
   * @returns Whether `new Index(input)` would succeed.
   *
   * @example Parse the Big5 index
   * ```ts
   * // https://encoding.spec.whatwg.org/index-big5.txt
   * import big5IndexText from "./index-big5.txt?raw";
   * if (!Index.canParse(big5IndexText)) {
   *   throw new Error("Uh oh! Can't parse the Big5 index!");
   * }
   * console.log("The valid Big5 index text is:\n%s", big5IndexText);
   * ```
   */
  static canParse(input: string): boolean {
    try {
      new Index(input);
    } catch (error) {
      if (error instanceof DOMException && error.name === "SyntaxError") {
        return false;
      } else {
        throw error;
      }
    }
    return true;
  }

  /**
   * A quick way to parse an index without a clumsy try-catch block.
   *
   * @param input The index source text to parse into an `Index` object.
   * @returns The parsed `Index` object, or `null` if parsing failed.
   *
   * @example Parse the Windows-1252 index
   * ```ts
   * // https://encoding.spec.whatwg.org/index-windows-1252.txt
   * import windows1252IndexText from "./index-windows-1252.txt?raw";
   * const windows1252Index = Index.parse(windows1252IndexText);
   * if (!windows1252Index) {
   *   throw new Error(`Oh... That can't be parsed.\n${windows1252IndexText}`);
   * }
   * console.log("The valid Windows-1252 index is:\n%o", windows1252Index);
   * ```
   */
  static parse(input: string): Index | null {
    try {
      return new Index(input);
    } catch (error) {
      if (error instanceof DOMException && error.name === "SyntaxError") {
        return null;
      } else {
        throw error;
      }
    }
  }

  #identifier: string | null = null;
  #date: string | null = null;
  #entries: [number, number][] = [];
  constructor(input: string) {
    // To find the pointers and their corresponding code points in an index, let
    // lines be the result of splitting the resource’s contents on U+000A LF.
    // Then remove each item in lines that is the empty string or starts with
    // U+0023 (#). Then the pointers and their corresponding code points are
    // found by splitting each item in lines on U+0009 TAB. The first subitem is
    // the pointer (as a decimal number) and the second is the corresponding
    // code point (as a hexadecimal number). Other subitems are not relevant.
    //
    // Note: To signify changes an index includes an Identifier and a Date. If
    // an Identifier has changed, so has the index.

    const seenPointers = new Map<number, TextSpan>();
    let seenIdentifier: TextSpan | undefined;
    let seenDate: TextSpan | undefined;

    // "let lines be the result of splitting the resource’s contents on U+000A LF."
    // We are a little more lax and actually split on /\r?\n/g using `lines()`.
    for (const [lineNumber, lineWithNewline] of lines(input).map((x, i) => [i + 1, x] as const)) {
      const line = trimEndNewline(lineWithNewline);
      const lineSpan = new TextSpan({
        start: new TextLocation({ line: lineNumber, column: 1 }),
        end: new TextLocation({ line: lineNumber, column: lineWithNewline.length + 1 }),
      });

      // "Then remove each item in lines that is the empty string or starts with U+0023 (#)."
      if (line === "") {
        continue;
      }
      if (line.startsWith("#")) {
        // "To signify changes an index includes an Identifier"
        const identifierDirectiveMatch = line.match(/^(#)(\s*)([iI]dentifier:)(\s*)(\S+?)\s*$/);
        if (identifierDirectiveMatch) {
          const identifierText = identifierDirectiveMatch[5];
          const identifierSpan = new TextSpan(
            {
              start: {
                column:
                  identifierDirectiveMatch[1].length +
                  identifierDirectiveMatch[2].length +
                  identifierDirectiveMatch[3].length +
                  identifierDirectiveMatch[4].length +
                  1,
              },
              end: {
                column:
                  identifierDirectiveMatch[1].length +
                  identifierDirectiveMatch[2].length +
                  identifierDirectiveMatch[3].length +
                  identifierDirectiveMatch[4].length +
                  identifierDirectiveMatch[5].length +
                  1,
              },
            },
            lineSpan.start,
          );

          const identifierMatch = identifierText.match(/^[0-9a-fA-F]+$/);
          const identifier = identifierMatch?.[0];
          if (identifier == null) {
            throw new DOMException(
              `Invalid identifier ${JSON.stringify(identifierText)} at ${identifierSpan}`,
              "SyntaxError",
            );
          }

          if (seenIdentifier) {
            throw new DOMException(
              `Identifier ${identifier} at ${identifierSpan} already seen at ${seenIdentifier}`,
              "SyntaxError",
            );
          }
          seenIdentifier = identifierSpan;
          this.#identifier = identifier;
          continue;
        }

        // "and a Date"
        const dateDirectiveMatch = line.match(/^(#)(\s*)([dD]ate:)(\s*)(\S+?)\s*$/);
        if (dateDirectiveMatch) {
          const dateText = dateDirectiveMatch[5];
          const dateSpan = new TextSpan(
            {
              start: {
                column:
                  dateDirectiveMatch[1].length +
                  dateDirectiveMatch[2].length +
                  dateDirectiveMatch[3].length +
                  dateDirectiveMatch[4].length +
                  1,
              },
              end: {
                column:
                  dateDirectiveMatch[1].length +
                  dateDirectiveMatch[2].length +
                  dateDirectiveMatch[3].length +
                  dateDirectiveMatch[4].length +
                  dateDirectiveMatch[5].length +
                  1,
              },
            },
            lineSpan.start,
          );

          const dateMatch = dateText.match(/^\d{4}-\d{2}-\d{2}$/);
          const date = dateMatch?.[0];
          if (date == null) {
            throw new DOMException(
              `Invalid date ${JSON.stringify(dateText)} at ${dateSpan}`,
              "SyntaxError",
            );
          }

          if (seenDate) {
            throw new DOMException(
              `Date ${date} at ${dateSpan} already seen at ${seenDate}`,
              "SyntaxError",
            );
          }
          seenDate = dateSpan;
          this.#date = date;
        }

        continue;
      }

      // "Then the pointers and their corresponding code points are found by splitting each item in lines on U+0009 TAB."
      // "The first subitem is the pointer"
      // "the second is the corresponding code point"
      const [pointerText, codePointText, ..._rest] = line.split("\t");
      const pointerSpan = new TextSpan(
        {
          end: { column: (pointerText?.length ?? 0) + 1 },
        },
        lineSpan.start,
      );
      const codePointSpan = new TextSpan(
        {
          end: { column: (codePointText?.length ?? 0) + 1 },
        },
        pointerSpan.end,
      );
      if (pointerText == null) {
        throw new DOMException(`Expected pointer at ${pointerSpan}`, "SyntaxError");
      }
      if (codePointText == null) {
        throw new DOMException(`Expected code point at ${codePointSpan}`, "SyntaxError");
      }

      // "pointer (as a decimal number)"
      const pointerMatch = pointerText.match(/^ *([1-9][0-9]*|0) *$/);
      const pointer = Number.parseInt(pointerMatch?.[1] ?? "", 10);
      if (Number.isNaN(pointer)) {
        throw new DOMException(
          `Invalid pointer ${JSON.stringify(pointerText)} at ${pointerSpan}`,
          "SyntaxError",
        );
      }

      // "code point (as a hexadecimal number)"
      const codePointMatch = codePointText.match(/^ *0x([0-9a-fA-F]+) *$/);
      const codePoint = Number.parseInt(codePointMatch?.[1] ?? "", 16);
      if (Number.isNaN(codePoint)) {
        throw new DOMException(
          `Invalid code point ${JSON.stringify(codePointText)} at ${codePointSpan}`,
          "SyntaxError",
        );
      }

      const seenPointer = seenPointers.get(pointer);
      if (seenPointer) {
        throw new DOMException(
          `Pointer ${pointer} at ${pointerSpan} already seen at ${seenPointer}`,
          "SyntaxError",
        );
      }
      seenPointers.set(pointer, pointerSpan);

      this.#entries.push([pointer, codePoint] as const);
    }
  }

  get identifier(): string | null {
    return this.#identifier;
  }

  get date(): string | null {
    return this.#date;
  }

  codePoint(pointer: number): number | null {
    // The index code point for pointer in index is the code point corresponding
    // to pointer in index, or null if pointer is not in index.

    for (const [entryPointer, entryCodePoint] of this.#entries) {
      if (entryPointer === pointer) {
        return entryCodePoint;
      }
    }
    return null;
  }

  pointer(codePoint: number): number | null {
    // The index pointer for codePoint in index is the first pointer
    // corresponding to codePoint in index, or null if codePoint is not in
    // index.

    for (const [entryPointer, entryCodePoint] of this.#entries) {
      if (entryCodePoint === codePoint) {
        return entryPointer;
      }
    }
    return null;
  }

  toDecoderRecord(): Record<number, number> {
    return Object.fromEntries(this.#entries);
  }

  toEncoderRecord(): Record<number, number> {
    const record: Record<number, number> = {};
    for (const [pointer, codePoint] of this.#entries) {
      if (Object.hasOwn(record, codePoint)) {
        continue;
      }
      Object.defineProperty(record, codePoint, {
        value: pointer,
        enumerable: true,
        configurable: true,
      });
    }
    return record;
  }

  toJSON(): [number, number][] {
    return this.#entries;
  }

  [Symbol.iterator](): IterableIterator<[number, number], void, void> {
    return this.entries();
  }
  entries(): IterableIterator<[number, number], void, void> {
    return this.#entries.values();
  }
  forEach(callbackfn: (value: number, key: number, index: this) => void, thisArg?: any): void {
    for (const [pointer, codePoint] of this.#entries) {
      callbackfn.call(thisArg, codePoint, pointer, this);
    }
  }
  keys(): IterableIterator<number, void, void> {
    return this.#entries.values().map(([pointer, _codePoint]) => pointer);
  }
  values(): IterableIterator<number, void, void> {
    return this.#entries.values().map(([_pointer, codePoint]) => codePoint);
  }

  get size(): number {
    return this.#entries.length;
  }
}

if (import.meta.vitest) {
  const { test, expect } = await import("vitest");

  test("parse Big5 index", async () => {
    const response = await fetch("https://encoding.spec.whatwg.org/index-big5.txt");
    const text = await response.text();

    const index = new Index(text);
    console.log(
      "Big5 index has %d entries with identifier %s and date %s",
      index.size,
      index.identifier,
      index.date,
    );

    const encoderRecord = index.toEncoderRecord();
    expect(encoderRecord).toBeDefined();
  });

  test("parse ISO-8859-14 index", async () => {
    const response = await fetch("https://encoding.spec.whatwg.org/index-iso-8859-14.txt");
    const text = await response.text();

    const index = new Index(text);
    console.log(
      "ISO-8859-14 index has %d entries with identifier %s and date %s",
      index.size,
      index.identifier,
      index.date,
    );

    const encoderRecord = index.toEncoderRecord();
    expect(encoderRecord).toBeDefined();
  });
}
