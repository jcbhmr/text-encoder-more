import type { Byte } from "../infra.ts";

export default class ImmediateWritableIOQueueByte {
  #chunks: Uint8Array<ArrayBuffer>[] = [];
  constructor() {}

  push(item: Byte): void {
    let lastChunk = this.#chunks.at(-1);
    if (!lastChunk || !lastChunk.buffer.resizable || lastChunk.length + 1 >= lastChunk.buffer.maxByteLength) {
      const buffer = new ArrayBuffer(0, { maxByteLength: 6000 });
      lastChunk = new Uint8Array(buffer);
      this.#chunks.push(lastChunk);
    }

    lastChunk.buffer.resize(lastChunk.length + 1);
    lastChunk[lastChunk.length - 1] = item;
  }

  pushMany(items: Byte[] | Uint8Array<ArrayBuffer>): void {
    const bytes = items instanceof Uint8Array ? items : new Uint8Array(items);
    this.#chunks.push(bytes);
  }

  bytes(): Uint8Array<ArrayBuffer> {
    const byteLength = this.#chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const buffer = new ArrayBuffer(0, { maxByteLength: byteLength });
    const result = new Uint8Array(buffer);
    const zero = new Uint8Array(0);
    let offset = 0;
    for (let i = 0; i < this.#chunks.length; i++) {
      const chunk = this.#chunks[i];
      result.set(chunk, offset);
      offset += chunk.length;
      this.#chunks[i] = zero;
    }
    this.#chunks.length = 0;
    return result;
  }
}
