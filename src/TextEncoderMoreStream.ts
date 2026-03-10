let encodeAndFlush: (encoder: TextEncoderMoreStream) => void;

export default class TextEncoderMoreStream implements TextEncoderStream {
    #transform: TransformStream<string, Uint8Array>
    #transformController: TransformStreamDefaultController
    #encoding: Encoding
    #encoder: Encoder
    #leadingSurrogate: LeadingSurrogate | null = null;
    constructor(label: string = "utf-8") {
        const idlLabel = `${label}`

        const encoding = encodingGet(idlLabel)

        if (encoding === Symbol.for("failure") || encoding === Symbol("replacement")) {
            throw new RangeError("encoding is failure or replacement")
        }

        this.#encoding = encoding

        this.#encoder = new this.#encoding.encoder()

        this.#transform = new TransformStream({
            start: (controller) => {
                this.#transformController = controller;
            },
            transform: (chunk, controller) => {
                encodeAndEnqueueAChunk(this, chunk)
            },
            flush: (controller) => {
                encodeAndFlush(this)
            }
        })
    }

    get encoding(): string {
        return this.#encoding.name.toLowerCase()
    }

    get readable(): ReadableStream<Uint8Array> {
        return this.#transform.readable
    }

    get writable(): WritableStream<string> {
        return this.#transform.writable
    }

    static {
        encodeAndFlush = (encoder) => {
            if (encoder.#leadingSurrogate != null) {
                const chunk = Uint8Array.of(0xEF, 0xBF, 0xBD)

                encoder.#transformController.enqueue(chunk)
            }
        }
    }
}
