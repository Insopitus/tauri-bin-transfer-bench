# Tauri Binary Data Transfer Benchmark

## What is this?

This repo is a small benchmark between [Tauri](https://tauri.app)'s `readBinaryFile` api and an alternative way (use base64 encoding rather than json) to transfer binary data from tauri's rust backend to web frontend.

It seems like the `fs#readBinaryFile` api uses `serde` to serialize `Vec<u8>` data to a json string, then send the string to javascript. Javascript deserialize the data to a js `Array<number>`, and then use `Uint8Array.from(arr)` to convert it to a `Uint8Array`. This approach doesn't sound efficient.

IIRC, the tauri team said it's not possible for now to transfer binary data directly due to some linux limatations. So, how about using base64 encoding to encode the binary data to string rather than json?

## Method

The benchmark test the `fs#readBinaryFile` api and 3 other functions which do the same thing as `readBinaryFile`: read a binary file and send the data to the frontend. The input is a 3.3 Megabyte png image from [Unplash](https://unsplash.com/photos/bLMaqkYfnJw). The result shows how much time it takes from the js calling the `invoke`/`readBinaryFile` function till an `ArrayBuffer` data is available.

1. `default`: a direct call of `fs#readBinaryFile`
2. `base64`: rust side sends base64 encoded string and js side uses `atob` and `string.charCodeAt` to get the `ArrayBuffer`
3. `base64-fetch`: same as `base64`, but js side uses `fetch` api to decode.
4. `base64-manual`: same as `base64`, but js side manualy decodes (implementation from [MDN](https://developer.mozilla.org/en-US/docs/Glossary/Base64#solution_2_%E2%80%93_rewriting_atob_and_btoa_using_typedarrays_and_utf-8)) base64 strings.

## Results

We ran each method 5 times and calc the average(in release build).

| Method          | Time              |
| --------------- | ----------------- |
| `default`       | 634.54 ± 4.51 ms  |
| `base64`        | 176.92 ± 10.11 ms |
| `base64-fetch`  | 251.98 ± 10.43 ms |
| `base64-manual` | 217.80 ± 9.97 ms  |

It looks like using base64 encoding in this situation is much faster(around 3.5 times) than using json. For the base64 variants, althrough `atob` returns a string rather than an arraybuffer, it's still slightly faster than the manual javascript implementation.
