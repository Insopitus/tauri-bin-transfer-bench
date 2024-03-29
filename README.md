# Tauri Binary Data Transfer Benchmark

**Update: With the upcoming Tauri 2.0, this is non-issue.**

## What is this?

This repo is a small benchmark between [Tauri](https://tauri.app)'s `readBinaryFile` api and an alternative way, using base64 encoding rather than json, to transfer binary data from tauri's rust backend to web frontend.

It seems like the `fs#readBinaryFile` api uses `serde` to serialize `Vec<u8>` data to a json string, then sends the string to javascript. Javascript deserializes the data to a js `Array<number>`, and then uses `Uint8Array.from(arr)` to convert it to a `Uint8Array`. This approach doesn't sound efficient.

IIRC, the tauri team said it's not possible for now to transfer binary data directly due to some linux limatations. So, how about using base64 encoding to encode the binary data to string rather than json?

## Method

The benchmark test the `fs#readBinaryFile` api and 3 other functions which do the same thing as `readBinaryFile`: read a binary file and send the data to the frontend. The input is a 3.3 Megabyte png image from [Unplash](https://unsplash.com/photos/bLMaqkYfnJw). The result shows how much time it takes from the js calling the `invoke`/`readBinaryFile` function till an `ArrayBuffer` data is available.

1. `default`: a direct call of `fs#readBinaryFile`
2. `base64`: rust side sends base64 encoded string and js side uses `atob` and `string.charCodeAt` to get the `ArrayBuffer`
3. `base64-fetch`: same as `base64`, but js side uses `fetch` api to decode.
4. `base64-manual`: same as `base64`, but js side manualy decodes (implementation from [MDN](https://developer.mozilla.org/en-US/docs/Glossary/Base64#solution_2_%E2%80%93_rewriting_atob_and_btoa_using_typedarrays_and_utf-8)) base64 strings.

## Results

We ran each method 50 times and calc the average(in release build).

| Method          | Time                |
| --------------- | ------------------- |
| `default`       | 2859.31 ± 510.70 ms |
| `base64`        | 531.00 ± 147.48 ms  |
| `base64-fetch`  | 598.67 ± 126.60 ms  |
| `base64-manual` | 564.75 ± 126.70 ms  |

It looks like using base64 encoding in this situation is much faster(around 5 times) than using json. For the base64 variants, althrough `atob` returns a string rather than an arraybuffer, it's still slightly faster than the manual javascript implementation.
