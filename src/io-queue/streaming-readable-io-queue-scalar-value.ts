import type { ScalarValue } from "../infra.ts";

export default class StreamingReadableIOQueueScalarValue implements AsyncIterableIterator<
  ScalarValue,
  never,
  never
> {
  static fromReadableStream(readable: ReadableStream<string>): StreamingReadableIOQueueScalarValue {
    const that = new StreamingReadableIOQueueScalarValue();
    that.#reader = readable.getReader();
    return that;
  }

  #reader: ReadableStreamDefaultReader<string> = undefined!;
  #chunk: StringIterator<string> | undefined;
  #restored: ScalarValue | undefined;
  private constructor() {}

  [Symbol.asyncIterator](): AsyncIterableIterator<ScalarValue, never, never> {
    return this;
  }

  async next(): Promise<IteratorResult<ScalarValue, never>> {
    if (this.#restored !== undefined) {
      const restored = this.#restored;
      this.#restored = undefined;
      return { value: restored, done: false };
    }

    if (this.#chunk === undefined) {
      const { value, done } = await this.#reader.read();
      if (done) {
        return { value: undefined!, done: true };
      }
      this.#chunk = value[Symbol.iterator]();
    }

    const { value, done } = this.#chunk.next();
    if (done) {
      this.#chunk = undefined;
      return this.next();
    }

    const cp = value.codePointAt(0)! as ScalarValue;
    return { value: cp, done: false };
  }

  restore(item: ScalarValue): void {
    if (this.#restored !== undefined) {
      throw new DOMException("Cannot restore more than one item", "InvalidStateError");
    }
    this.#restored = item;
  }
}
