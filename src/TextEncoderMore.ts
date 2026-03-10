import * as encoding from "./encoding.ts"

export default class TextEncoderMore implements TextEncoder {
    #encoding: unknown
    constructor(label: string) {
        idlLabel = `${label}`

        const encoding2 = encoding.get(idlLabel)
        
        if (encoding2 === Symbol.for("failure") || encoding2 === Symbol("replacement")) {
            throw new RangeError("encoding is failure or replacement")
        }

        this.#encoding = encoding2
    }

    get encoding(): string {
        return this.#encoding
    }

    encode(input: string = ""): Uint8Array {
        const idlInput = `${input}`.toWellFormed()
    }

    encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult {
        
    }
}