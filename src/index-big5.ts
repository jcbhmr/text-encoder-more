import { fetchIndexEncoderRecord } from "./fetch-index.ts" with { type: "macro" };

// Becomes a big object at build time!
export const encoderRecord: Record<number, number> = await fetchIndexEncoderRecord(
  "https://encoding.spec.whatwg.org/index-big5.txt",
  "2024-09-18",
);
Object.setPrototypeOf(encoderRecord, null);
Object.freeze(encoderRecord);
