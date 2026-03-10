declare const __brand: unique symbol
type Brand<B> = { [__brand]: B }
type Branded<T, B> = T & Brand<B>

export type ASCIICodePoint = Branded<number, "ASCII code point">

export function isASCIICodePoint(value: number): value is ASCIICodePoint {
    return 0x0000 <= value && value <= 0x007F
}
