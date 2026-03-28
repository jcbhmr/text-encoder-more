import { failure, getAnEncoding, type Encoder, type Encoding } from "./encoding.ts";

export default class LegacyTextEncoderStream {
  #encoding: Encoding;
  #encoder: Encoder;
  #transform: TransformStream<string, Uint8Array>;
  constructor(label: string) {
    const label2 = `${label}`;
    const encoding = getAnEncoding(label2);
    if (encoding === failure) {
      throw new RangeError(`'${label2}' is not a supported encoding label`);
    }
    this.#encoding = encoding;
    this.#encoder = new this.#encoding.Encoder();
    this.#transform = new TransformStream<string, Uint8Array>({
      start() {
        // TODO
      },
      transform(chunk, controller) {
        // TODO
      },
    });
  }

  get encoding(): string {
    return this.#encoding.name.toLowerCase();
  }

  get readable(): ReadableStream<Uint8Array> {
    return this.#transform.readable;
  }

  get writable(): WritableStream<string> {
    return this.#transform.writable;
  }
}
