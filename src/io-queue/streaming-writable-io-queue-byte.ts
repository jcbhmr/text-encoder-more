import type { Byte } from "../infra.ts";

export default class StreamingWritableIOQueueByte {
  readable: ReadableStream<Uint8Array<ArrayBuffer>>;
  #controller: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>> | undefined;
  #chunk: Uint8Array<ArrayBuffer>;
  constructor() {
    const buffer = new ArrayBuffer(0, { maxByteLength: 6000 });
    this.#chunk = new Uint8Array(buffer);
    this.readable = new ReadableStream<Uint8Array<ArrayBuffer>>({
      start: (controller) => {
        this.#controller = controller;
      },
      cancel: (_reason) => {
        this.#controller = undefined;
      },
    });
  }

  push(item: Byte): void {
    if (!this.#controller) {
      throw new DOMException("Cannot write to a closed I/O Queue", "InvalidStateError");
    }

    if (this.#chunk.length + 1 >= this.#chunk.buffer.maxByteLength) {
      this.#controller.enqueue(this.#chunk);
      const buffer = new ArrayBuffer(0, { maxByteLength: 6000 });
      this.#chunk = new Uint8Array(buffer);
    }

    this.#chunk.buffer.resize(this.#chunk.length + 1);
    this.#chunk[this.#chunk.length - 1] = item;
  }

  pushMany(items: Byte[] | Uint8Array<ArrayBuffer>): void {
    if (!this.#controller) {
      throw new DOMException("Cannot write to a closed I/O Queue", "InvalidStateError");
    }

    const bytes = items instanceof Uint8Array ? items : new Uint8Array(items);

    this.#controller.enqueue(this.#chunk);
    this.#controller.enqueue(bytes);

    const buffer = new ArrayBuffer(0, { maxByteLength: 6000 });
    this.#chunk = new Uint8Array(buffer);
  }
}
