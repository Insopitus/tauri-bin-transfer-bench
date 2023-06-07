import { invoke } from '@tauri-apps/api/tauri'
import { readBinaryFile } from '@tauri-apps/api/fs'

bench()

async function imageFromVanilla(url: string) {
	const buffer = await readBinaryFile(url)
	// const array = await invoke<number[]>('transfer_via_json')
	// const buffer = new Uint8Array(array)
	return buffer
}

async function imageFromBase64(url: string) {
	const data = await invoke<string>('read_and_send_via_base64', { url })
	const buffer = base64ToArrayBuffer(data)
	return buffer
}
/** use fetch api to decode base64 */
async function imageFromBase64FetchVariant(url: string) {
	const data = await invoke<string>('read_and_send_via_base64', { url })
	const buffer = await fetch(`data:application/octet-stream;base64,${data}`).then((res) => res.arrayBuffer())
	return buffer
}
async function imageFromBase64ManualDecoding(url: string) {
	const data = await invoke<string>('read_and_send_via_base64', { url })
	const buffer = base64ToArrayBufferManual(data)
	return buffer
}

async function bench() {
	const url = './assets/matheo-joubert-bLMaqkYfnJw-unsplash.jpg'
	const ITERATIONS = 5
	const results: Record<string, number[]> = {
		base64: [],
		'base64-fetch': [],
		'base64-manual': [],
		default: []
	}
	for (let i = 0; i < ITERATIONS; i++) {
		{
			const start = performance.now()
			const buffer = await imageFromBase64(url)
			results['base64'].push(performance.now() - start)
			// appendImage(buffer)
		}
		{
			const start = performance.now()
			const buffer = await imageFromBase64FetchVariant(url)
			results['base64-fetch'].push(performance.now() - start)

			// appendImage(buffer)
		}
		{
			const start = performance.now()

			const buffer = await imageFromBase64ManualDecoding(url)
			results['base64-manual'].push(performance.now() - start)

			// appendImage(buffer)
		}
		{
			const start = performance.now()
			const buffer = await imageFromVanilla(url)
			results['default'].push(performance.now() - start)
			// appendImage(buffer)
		}
	}

	for (let key in results) {
		const data = results[key]
		const average = data.reduce((prev, curr) => prev + curr, 0) / data.length
		const std = Math.sqrt(data.reduce((prev, curr) => prev + Math.pow(curr - average, 2), 0))
		// console.log(`${key}: average time: ${average.toFixed(2)} ms.`)
		const node = document.createElement('p')
		node.append(`${key}: average time: ${average.toFixed(2)} ± ${std.toFixed(2)} ms.`)
		document.body.appendChild(node)
	}
}

function appendImage(buffer: ArrayBuffer) {
	const src = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }))

	const image = new Image()
	image.src = src
	document.body.appendChild(image)
}

/** use atob api to decode base64 and turn the result to arraybuffer */
function base64ToArrayBuffer(base64: string) {
	var binary_string = window.atob(base64)
	var len = binary_string.length
	var bytes = new Uint8Array(len)
	for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i)
	}
	return bytes.buffer
}
/** manually decoding base64 in js */
function base64ToArrayBufferManual(base64String: string) {
	return base64ToUint8Array(base64String).buffer
}

// Array of bytes to Base64 string decoding
function b64ToUint6(nChr: number) {
	return nChr > 64 && nChr < 91 ? nChr - 65 : nChr > 96 && nChr < 123 ? nChr - 71 : nChr > 47 && nChr < 58 ? nChr + 4 : nChr === 43 ? 62 : nChr === 47 ? 63 : 0
}

function base64ToUint8Array(sBase64: string, nBlocksSize?: number) {
	// const sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, '') // Remove any non-base64 characters, such as trailing "=", whitespace, and more.
	const sB64Enc = sBase64
	const nInLen = sB64Enc.length
	const nOutLen = nBlocksSize ? Math.ceil(((nInLen * 3 + 1) >> 2) / nBlocksSize) * nBlocksSize : (nInLen * 3 + 1) >> 2
	const taBytes = new Uint8Array(nOutLen)

	let nMod3
	let nMod4
	let nUint24 = 0
	let nOutIdx = 0
	for (let nInIdx = 0; nInIdx < nInLen; nInIdx++) {
		nMod4 = nInIdx & 3
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (6 * (3 - nMod4))
		if (nMod4 === 3 || nInLen - nInIdx === 1) {
			nMod3 = 0
			while (nMod3 < 3 && nOutIdx < nOutLen) {
				taBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255
				nMod3++
				nOutIdx++
			}
			nUint24 = 0
		}
	}

	return taBytes
}
