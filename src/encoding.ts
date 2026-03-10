/**
 * Each encoding has an associated decoder and most of them have an associated
 * encoder. Instances of decoders and encoders have a handler algorithm and
 * might also have state. A handler algorithm takes an input I/O queue and an
 * item, and returns finished, one or more items, error optionally with a code
 * point, or continue.
 */
export interface Encoding {
    encoder?: Encoder
}

type Encoder = { new(): EncoderInstance }

export interface EncoderInstance {
    handler(a: ioQueue, b: item)
}

// To get an encoding from a string label, run these steps:
export function encodingGet(label: string) {
    // 1. Remove any leading and trailing ASCII whitespace from label.
    label = label.trim()

    // 2. If label is an ASCII case-insensitive match for any of the labels listed in the table below, then return the corresponding encoding; otherwise return failure.
    for (const [encoding, labels] of table) {
        for (const l of labels) {
            if (l.toLowerCase() === label.toLowerCase()) {
                return encoding
            }
        }
    }
    return Symbol.for("failure")
}

const table = new Map<unknown, string[]>([
    [null, [
        "unicode-1-1-utf-8",
        "unicode11utf8",
        "unicode20utf8",
        "utf-8",
        "utf8",
        "x-unicode20utf8",
    ]],
    [null, [
        "866",
        "cp866",
        "csibm866",
        "ibm866"
    ]]
])
