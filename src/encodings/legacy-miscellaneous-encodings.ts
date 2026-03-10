import { ASCIICodePoint, isASCIICodePoint } from "../infra.ts"

export const replacement = {}

export const utf16BE = {
}

export const utf16LE = {}

export const xUserDefined = {
    encoder: {
        handler(_unused: unknown, codePoint: any) {
            if (codePoint === Symbol.for("end-of-queue")) {
                return Symbol.for("finished")
            }

            if (isASCIICodePoint(codePoint)) {
                return codePoint
            }

            if (0xF780 <= codePoint && codePoint <= 0xF7FF) {
                return codePoint - 0xF780 + 0x80
            }

            return new Error2(codePoint)
        }
    }
}
