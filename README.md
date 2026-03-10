# `TextEncoderMore`

🔎 A `TextEncoder` that targets more than just UTF-8

## Installation

```sh
npm install @jcbhmr/text-encoder-more
```

## Usage

```js
import TextEncoderMore from "@jcbhmr/text-encoder-more";

const encoder = new TextEncoderMore("utf-16le")
const bytes = encoder.encode("Hi!")
console.log(bytes);
//=> Uint8Array [ 0x48, 0x00, 0x69, 0x00, 0x21, 0x00 ]

const decoder = new TextDecoder("utf-16le")
const string = decoder.decode(bytes);
console.log(string);
//=> Hi!
```
