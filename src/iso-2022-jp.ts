import {
  finished,
  register,
  "continue" as continue_,
  type Encoder as EncoderInterface,
  type Error as HandlerError,
} from "./encoding.ts";
import indexISO2022JPKatakana from "./index-iso-2022-jp-katakana.ts";
import type { Byte, ScalarValue } from "./infra.ts";
import type { ReadableIOQueueScalarValue } from "./io-queue/index.ts";

/**
 * @see https://encoding.spec.whatwg.org/#iso-2022-jp-encoder-state
 *
 * ISO-2022-JP’s encoder has an associated ISO-2022-JP encoder state which is ASCII, Roman, or jis0208, initially ASCII.
 */
type EncoderState = "ASCII" | "Roman" | "jis0208";

/**
 * @see https://encoding.spec.whatwg.org/#iso-2022-jp-encoder
 *
 * Note: The ISO-2022-JP encoder is the only encoder for which the concatenation of multiple outputs can result in an error when run through the corresponding decoder.
 *
 * Example: Encoding U+00A5 (¥) gives 0x1B 0x28 0x4A 0x5C 0x1B 0x28 0x42. Doing that twice, concatenating the results, and then decoding yields U+00A5 U+FFFD U+00A5.
 */
class Encoder implements EncoderInterface {
  /**
   * @see https://encoding.spec.whatwg.org/#iso-2022-jp-encoder
   *
   * ISO-2022-JP’s encoder has an associated ISO-2022-JP encoder state which is ASCII, Roman, or jis0208, initially ASCII.
   */
  #state: EncoderState = "ASCII";
  constructor() {}

  handler(
    ioQueue: ReadableIOQueueScalarValue,
    codePoint: ScalarValue | undefined,
  ): finished | Byte | Byte[] | Uint8Array | HandlerError | continue_ {
    // ISO-2022-JP’s encoder’s handler, given ioQueue and codePoint, runs these steps:

    // 1. If codePoint is end-of-queue and ISO-2022-JP encoder state is not ASCII, then set ISO-2022-JP encoder state to ASCII and return three bytes 0x1B 0x28 0x42.
    // 2. If codePoint is end-of-queue and ISO-2022-JP encoder state is ASCII, then return finished.
    if (codePoint === undefined) {
      if (this.#state === "ASCII") {
        return finished;
      } else {
        this.#state = "ASCII";
        return Uint8Array.of(0x1b, 0x28, 0x42);
      }
    }

    // 3. If ISO-2022-JP encoder state is ASCII or Roman, and codePoint is
    //    U+000E, U+000F, or U+001B, then return error with U+FFFD (�).
    //
    // Note: This returns U+FFFD (�) rather than codePoint to prevent attacks.
    if (
      (this.#state === "ASCII" || this.#state === "Roman") &&
      (codePoint === 0x000e || codePoint === 0x000f || codePoint === 0x001b)
    ) {
      return { codePoint: 0xfffd as ScalarValue };
    }

    // 4. If ISO-2022-JP encoder state is ASCII and codePoint is an ASCII code point, then return a byte whose value is codePoint.
    if (this.#state === "ASCII" && codePoint < 0x80) {
      return codePoint as number as Byte;
    }

    // 5. If ISO-2022-JP encoder state is Roman and codePoint is an ASCII code
    //    point, excluding U+005C (\) and U+007E (~), or is U+00A5 (¥) or U+203E
    //    (‾):
    //     1. If codePoint is an ASCII code point, then return a byte whose
    //        value is codePoint.
    //     2. If codePoint is U+00A5 (¥), then return byte 0x5C.
    //     3. If codePoint is U+203E (‾), then return byte 0x7E.
    if (this.#state === "Roman") {
      if (codePoint < 0x80 && codePoint !== 0x005c && codePoint !== 0x007e) {
        return codePoint as number as Byte;
      }
      if (codePoint === 0x00a5) {
        return 0x5c as Byte;
      }
      if (codePoint === 0x203e) {
        return 0x7e as Byte;
      }
    }

    // 6. If codePoint is an ASCII code point, and ISO-2022-JP encoder state is not ASCII, then restore codePoint to ioQueue, set ISO-2022-JP encoder state to ASCII, and return three bytes 0x1B 0x28 0x42.
    if (codePoint < 0x80 && this.#state !== "ASCII") {
      ioQueue.restore(codePoint);
      this.#state = "ASCII";
      return Uint8Array.of(0x1b, 0x28, 0x42);
    }

    // 7. If codePoint is either U+00A5 (¥) or U+203E (‾), and ISO-2022-JP encoder state is not Roman, then restore codePoint to ioQueue, set ISO-2022-JP encoder state to Roman, and return three bytes 0x1B 0x28 0x4A.
    if ((codePoint === 0x00a5 || codePoint === 0x203e) && this.#state !== "Roman") {
      ioQueue.restore(codePoint);
      this.#state = "Roman";
      return Uint8Array.of(0x1b, 0x28, 0x4a);
    }

    // 8. If codePoint is U+2212 (−), then set it to U+FF0D (－).
    if (codePoint === 0x2212) {
      codePoint = 0xff0d as ScalarValue;
    }

    // 9. If codePoint is in the range U+FF61 (｡) to U+FF9F (ﾟ), inclusive, then set it to the index code point for codePoint − 0xFF61 in index ISO-2022-JP katakana.
    if (codePoint >= 0xff61 && codePoint <= 0xff9f) {
      codePoint = indexISO2022JPKatakana[codePoint - 0xff61] as ScalarValue;
    }

    // 10. Let pointer be the index pointer for codePoint in index jis0208.
    //
    // Note: If pointer is non-null, it is less than 8836 due to the nature of index jis0208 and the index pointer operation.
    const index = indexISO2022JPKatakana.indexOf(codePoint)
    const pointer = index !== -1 ? index : null;

    // 11. If pointer is null:
    if (pointer === null) {
      // 1. If ISO-2022-JP encoder state is jis0208, then restore codePoint to ioQueue, set ISO-2022-JP encoder state to ASCII, and return three bytes 0x1B 0x28 0x42.
      if (this.#state === "jis0208") {
        ioQueue.restore(codePoint);
        this.#state = "ASCII";
        return Uint8Array.of(0x1b, 0x28, 0x42);
      }

      // 2. Return error with codePoint.
      return { codePoint };
    }

    // 12. If ISO-2022-JP encoder state is not jis0208, then restore codePoint to ioQueue, set ISO-2022-JP encoder state to jis0208, and return three bytes 0x1B 0x24 0x42.
    if (this.#state !== "jis0208") {
      ioQueue.restore(codePoint);
      this.#state = "jis0208";
      return Uint8Array.of(0x1b, 0x24, 0x42);
    }

    // 13. Let leading be pointer / 94 + 0x21.
    const leading = Math.trunc(pointer / 94) + 0x21;

    // 14. Let trailing be pointer % 94 + 0x21.
    const trailing = (pointer % 94) + 0x21;

    // 15. Return two bytes whose values are leading and trailing.
    return Uint8Array.of(leading, trailing);
  }
}

register({
  name: "ISO-2022-JP",
  labels: [],
  Encoder,
});
