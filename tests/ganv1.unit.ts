import { expect } from 'chai';
import { describe, it, vi } from 'vitest';

import {
	getRawKey,
	getDecryptor,
	isProtocolEncrypted,
} from '$lib/bluetooth/gan/gan356i_v1';

describe('GAN 356i encryption/decryption', async () => {
	vi.mock('$lib/bluetooth/bluetooth', () => {
		const read = vi.fn();
		read.mockImplementationOnce(async () => new Uint8Array([1, 1, 3, 0, 0, 0]));
		read.mockImplementationOnce(async () => new Uint8Array([1, 1, 3, 0, 0, 0]));
		read.mockImplementationOnce(async () => new Uint8Array([1, 1, 3, 0, 0, 0]));
		read.mockImplementationOnce(async () => new Uint8Array([1, 1, 3, 0, 0, 0]));
		read.mockImplementationOnce(async () => new Uint8Array([29, 230, 8, 2, 48, 248]));
		read.mockImplementationOnce(async () => new Uint8Array([1, 1, 3, 0, 0, 0]));
		read.mockImplementationOnce(async () => new Uint8Array([1, 1, 3, 0, 0, 0]));
		//read.mockImplementation(async () => new Uint8Array([0,0,0,0,0,0]));
		return { read };
	});

	const dummyDevice = {
		id: 'GAN-deadf'
	};
	it('can version detect encryption', async () => {
		expect(await isProtocolEncrypted(dummyDevice)).to.be.true;
		expect((await getRawKey(dummyDevice))[0]).to.equal(67);
		const data = [
			146, 17, 135, 158, 63, 167, 219, 182, 126, 195, 156, 223, 254, 223, 79, 35, 248, 165, 28
		];
		const decrypted = [151, 6, 211, 255, 40, 63, 0, 0, 0, 1, 0, 0, 20, 3, 3, 6, 17, 0, 2];
		const data2 = [
			103, 183, 193, 78, 207, 56, 247, 255, 85, 164, 177, 231, 54, 122, 227, 248, 160, 71, 51
		];
		const decrypted2 = [139, 6, 208, 255, 41, 63, 0, 0, 0, 1, 0, 0, 20, 3, 3, 6, 17, 0, 2];
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		vi.stubGlobal('crypto', require('node:crypto').webcrypto);
		const decrypt = await getDecryptor(dummyDevice);
		const t1 = await decrypt(new Uint8Array(data));
		for (let i = 0; i < decrypted.length; ++i) {
			expect(t1[i]).to.equal(decrypted[i]);
		}
		const t2 = await decrypt(new Uint8Array(data2));
		for (let i = 0; i < decrypted.length; ++i) {
			expect(t2[i]).to.equal(decrypted2[i]);
		}
	});
});
