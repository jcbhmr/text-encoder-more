import type { Byte, ScalarValue } from "./infra.ts";

export interface Encoding {
  readonly name: string;
  readonly labels: readonly string[];
  createEncoder(iterable: Iterable<ScalarValue>): IterableIterator<Byte>;
}

const encodings: Encoding[] = [];
export function register(encoding: Encoding): void {
  if (encodings.includes(encoding)) {
    throw new DOMException(`'${encoding.name}' encoding is already registered`);
  }
  encodings.push(encoding);
}

export function getAnEncoding(label: string): Encoding | null {
  label = label.trim();
  for (const encoding of encodings) {
    if (encoding.labels.includes(label)) {
      return encoding;
    }
  }
  return null;
}
