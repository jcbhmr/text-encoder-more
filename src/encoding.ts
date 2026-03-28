import type { Byte, ScalarValue } from "./infra.ts";
import type { ReadableIOQueueScalarValue } from "./io-queue/index.ts";

export interface Encoding {
  name: string;
  labels: string[];
  Encoder: new () => Encoder;
}

export interface Encoder {
  handler(
    input: ReadableIOQueueScalarValue,
    item: ScalarValue | undefined,
  ): finished | Byte | Byte[] | Uint8Array | Error | continue_;
}

export const finished: unique symbol = Symbol("finished");
export type finished = typeof finished;

export type Error = { codePoint?: ScalarValue };

const continue_: unique symbol = Symbol("continue");
type continue_ = typeof continue_;
export { continue_ as "continue" };

const encodings: Encoding[] = [];
export function register(encoding: Encoding): void {
  if (encodings.includes(encoding)) {
    throw new DOMException(`'${encoding.name}' encoding is already registered`);
  }
  encodings.push(encoding);
}

export const failure: unique symbol = Symbol("failure");
export type failure = typeof failure;

export function getAnEncoding(label: string): Encoding | failure {
  label = label.trim();
  for (const encoding of encodings) {
    if (encoding.labels.includes(label)) {
      return encoding;
    }
  }
  return failure;
}
