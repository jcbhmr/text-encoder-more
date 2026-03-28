import type ImmediateReadableIOQueueScalarValue from "./immediate-readable-io-queue-scalar-value.ts";
import type StreamingReadableIOQueueScalarValue from "./streaming-readable-io-queue-scalar-value.ts";
import type ImmediateWritableIOQueueByte from "./immediate-writable-io-queue-byte.ts";
import type StreamingWritableIOQueueByte from "./streaming-writable-io-queue-byte.ts";

export type ReadableIOQueueScalarValue =
  | ImmediateReadableIOQueueScalarValue
  | StreamingReadableIOQueueScalarValue;
export type WritableIOQueueByte = ImmediateWritableIOQueueByte | StreamingWritableIOQueueByte;

export { default as ImmediateReadableIOQueueScalarValue } from "./immediate-readable-io-queue-scalar-value.ts";
export { default as StreamingReadableIOQueueScalarValue } from "./streaming-readable-io-queue-scalar-value.ts";
export { default as ImmediateWritableIOQueueByte } from "./immediate-writable-io-queue-byte.ts";
export { default as StreamingWritableIOQueueByte } from "./streaming-writable-io-queue-byte.ts";
