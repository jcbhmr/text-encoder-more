import { getAnEncoding, type Encoding } from "./encoding.ts";
import type { Byte } from "./infra.ts";

export interface LegacyTextEncodeOptions {
  stream?: boolean;
}

export default class LegacyTextEncoder implements TextEncoder {
  #encoding: Encoding;
  #encoder: IterableIterator<Byte, void, void> | undefined;
  #ioQueue: IOQueueBytes;
  #doNotFlush: boolean = false;
  constructor(label: string) {
    label = `${label}`;
    const encoding = getAnEncoding(label);
    if (encoding == null) {
      throw new RangeError(`'${label}' is not a supported encoding label`);
    }
    this.#encoding = encoding;
  }

  get encoding(): string {
    return this.#encoding.name.toLowerCase();
  }

  encode(input?: string, options: LegacyTextEncodeOptions = {}): Uint8Array<ArrayBuffer> {
    if (input !== undefined) {
      if (typeof input !== "string") {
        input = `${input}`;
      }
      if (!input.isWellFormed()) {
        input = input.toWellFormed();
      }
    }
    const { stream: options_stream = false } = options;
    
    if (!this.#doNotFlush) {
      this.#encoder = new this.#encoding.createEncoder();
      this.#ioQueue = ImmediateIOQueueScalarValues.of(endOfQueue);
    }
    this.#doNotFlush = options_stream;
    if (input === undefined) {
      this.#ioQueue.push(input);
    }
    const output = ImmediateIOQueueBytes.of(endOfQueue);
    while (true) {
      const item = this.#ioQueue.read();
      if (item === endOfQueue && this.#doNotFlush) {
        return this.#serializeIOQueue(output);
      } else {
        const result = processAnItem(item, this.#encoder, this.#ioQueue, output, "fatal");
        if (result === finished) {
          return this.#serializeIOQueue(output);
        } else if (typeof result === "object" && result !== null) {
          throw new TypeError();
        }
      }
    }
  }

  encodeInto(
    source: string,
    destination: Uint8Array,
    options: LegacyTextEncodeOptions = {},
  ): TextEncoderEncodeIntoResult {
    let read = 0;
    let written = 0;
    throw new Error("todo");
  }
}
