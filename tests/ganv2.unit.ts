import { expect } from 'chai';
import { describe, it, vi } from 'vitest';

import {
	getRawKey, makeKeyArray, getDecryptor, makeKey, getEncryptor, GANCubeV2, getDeviceKeyInfo 
} from '$lib/bluetooth/gan/gan356i_v2';


describe('GAN v2 encryption/decryption', () => {
	const dummyV2 = {
		id: 'GANi3XXX'
	};
	it('can generate and import correct keys', async () => {
		const keys = await getRawKey(dummyV2);
		const rawKey = [0x01, 0x02, 0x42, 0x28, 0x31, 0x91, 0x16, 0x07, 0x20, 0x05, 0x18, 0x54, 0x42, 0x11, 0x12, 0x53];
		expect(keys.key.toString()).to.equal(rawKey.toString());
		const rawIV = [0x11, 0x03, 0x32, 0x28, 0x21, 0x01, 0x76, 0x27, 0x20, 0x95, 0x78, 0x14, 0x32, 0x12, 0x02, 0x43];
		expect(keys.iv.toString()).to.equal(rawIV.toString());
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		vi.stubGlobal('crypto', require('node:crypto').webcrypto);
		const keyXOR = await getDeviceKeyInfo(dummyV2);
		const aesKey = await makeKeyArray(dummyV2, Uint8Array.from(keys.key), keyXOR);
		const v2Bytes = [0x9c, 0x73, 0x44, 0x5c, 0x43, 0x3d, 0x16, 0x07, 0x20, 0x05, 0x18, 0x54, 0x42, 0x11, 0x12, 0x53];
		expect(aesKey.toString()).to.equal(v2Bytes.toString());
		const aesIv = await makeKeyArray(dummyV2, Uint8Array.from(keys.iv), keyXOR);
		const v2iv = [0xac, 0x74, 0x34, 0x5c, 0x33, 0xac, 0x76, 0x27, 0x20, 0x95, 0x78, 0x14, 0x32, 0x12, 0x02, 0x43];
		expect(aesIv.toString()).to.equal(v2iv.toString());
	})

	it('can decrypt a message', async () => {
		const keys = await getRawKey(dummyV2);
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		vi.stubGlobal('crypto', require('node:crypto').webcrypto);
		const m = [0x1f, 0x80, 0x62, 0xf3, 0x08, 0x1c, 0xa7, 0x15, 0x6a, 0x6f, 0xd5, 0x99, 0xb2, 0x58, 0xd2, 0xda, 0x25, 0x66, 0xf1, 0x06];

		const data = Uint8Array.from(m);
		const keyXOR = await getDeviceKeyInfo(dummyV2);
		const decrypt = await getDecryptor(dummyV2, keys, keyXOR);
		const message = await decrypt(data);
		const decryptedBlock = [0x1d, 0x23, 0x21, 0xd9, 0xfa, 0x23, 0xdd, 0x70, 0xb0, 0x00, 0xd2, 0x2e, 0x1d, 0xa1, 0xa2, 0x42, 0xd7, 0x0c, 0x00, 0x0a];

		expect(message.toString()).to.equal(decryptedBlock.toString());
	})

	/* This takes about 9s on my M1, too slow for practical use.
	it('can bruteforce the key for a message', async () => {
		const keys = await getRawKey(dummyV2);
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		vi.stubGlobal('crypto', require('node:crypto').webcrypto);
		const m = [0x1f, 0x80, 0x62, 0xf3, 0x08, 0x1c, 0xa7, 0x15, 0x6a, 0x6f, 0xd5, 0x99, 0xb2, 0x58, 0xd2, 0xda, 0x25, 0x66, 0xf1, 0x06];

		const data = Uint8Array.from(m);
		const keyXOR = [0x00, 0x00, 0x00, 0x34, 0x12, 0xab];
		let message = Uint8Array.from([0x00]);
		const decryptedBlock = [0x1d, 0x23, 0x21, 0xd9, 0xfa, 0x23, 0xdd, 0x70, 0xb0, 0x00, 0xd2, 0x2e, 0x1d, 0xa1, 0xa2, 0x42, 0xd7, 0x0c, 0x00, 0x0a];
		let match = true;
		for (let a = 0; a < 256; ++a) {
			for (let b = 0; b < 256; ++b) {
				for (let c = 0; c < 3; ++c) {
					keyXOR[0] = a;
					keyXOR[1] = b;
					keyXOR[2] = c;
					const decrypt = await getDecryptor(dummyV2, keys, keyXOR);
					message = await decrypt(data);
					match = true;
					for (let i = 0; i < decryptedBlock.length && match; ++i) {
						match = match && (message[i] === decryptedBlock[i]);
					}
					if (match) {
						console.log({a, b, c});
						break;
					}
				}
				if (match) break;
			}
			if (match) break;
		}

		expect(message.toString()).to.equal(decryptedBlock.toString());
	}, 100000)
	*/

	it('can encrypt a message', async () => {
		const reference = {
			input: [0x09, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			phase_1: [0x35, 0x70, 0x5c, 0xe7, 0x56, 0x34, 0xd1, 0xe2, 0xd3, 0x1b, 0x08, 0x9e, 0x28, 0xcf, 0x50, 0xf6, 0x00, 0x00, 0x00, 0x00],
			encoded: [0x35, 0x70, 0x5c, 0xe7, 0xc2, 0x03, 0x73, 0xdb, 0x0d, 0xa5, 0x3f, 0xdf, 0xe9, 0x2b, 0x07, 0xc5, 0x4b, 0xfb, 0x1b, 0x2b]
		  };

		const keys = await getRawKey(dummyV2);
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		vi.stubGlobal('crypto', require('node:crypto').webcrypto);

		const data = Uint8Array.from(reference.input);
		const keyXOR = await getDeviceKeyInfo(dummyV2);
		const crypt = await getEncryptor(dummyV2, keys, keyXOR);
		const message = await crypt(data);

		expect(message.toString()).to.equal(reference.encoded.toString());
	})

	it('can extract move info from moves messages', () => {
		const m = new Uint8Array([35, 1, 136, 98, 24, 134, 8, 166, 24, 102, 14, 116, 20, 87, 255, 255, 255, 254, 185, 50]);
		const cube = new GANCubeV2(dummyV2);
		expect(cube.extractBits(m, 0, 4)).to.equal(2);
		expect(cube.extractBits(m, 4, 8)).to.equal(48);
		expect(cube.extractBits(m, 12, 5)).to.equal(3);
		expect(cube.extractBits(m, 12 + 5, 5)).to.equal(2);
	})
})
