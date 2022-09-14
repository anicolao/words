import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';

import {
	getRawKey,
	getDecryptor,
	isProtocolEncrypted,
	GANCube
} from '$lib/bluetooth/gan/gan356i_v1';
import { Alg } from 'cubing/alg';
import { cube3x3x3 } from 'cubing/puzzles';

describe('GAN 356i', async () => {
	const kpuzzle = await cube3x3x3.kpuzzle();
	afterEach(() => {
		//vi.restoreAllMocks();
	});
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

	it('can stringify the version', async () => {
		const cube = new GANCube(dummyDevice);
		expect(await cube.getVersionAsString()).to.equal('1.1.3');
	});

	interface TestCase {
		from: number;
		to: string;
		afterRotations?: Alg;
	}

	function validateTransform({ from, to, afterRotations }: TestCase) {
		const startState = kpuzzle.startState();
		const state = afterRotations ? startState.applyAlg(afterRotations) : startState;
		const newMove = GANCube.colorToFaceMove(from, state.stateData);
		expect(newMove).to.equal(to);
	}

	// after an X rotation , ULFRBD <- FLDRUB
	const faceCases = [
		{ face: 0x06, originalFace: 'F', expectedFace: 'U' },
		{ face: 0x0c, originalFace: 'L', expectedFace: 'L' },
		{ face: 0x09, originalFace: 'D', expectedFace: 'F' },
		{ face: 0x03, originalFace: 'R', expectedFace: 'R' },
		{ face: 0x05, originalFace: "R'", expectedFace: "R'" },
		{ face: 0x00, originalFace: 'U', expectedFace: 'B' },
		{ face: 0x0f, originalFace: 'B', expectedFace: 'D' },
		{ face: 0x26, originalFace: 'z', expectedFace: 'z' }
	];
	for (const { face, originalFace, expectedFace } of faceCases) {
		it(`should not touch '${face}' moves`, () => {
			validateTransform({ from: face, to: originalFace });
		});

		it(`should modify '${face}' to '${expectedFace}' moves with x rotation`, () => {
			validateTransform({
				from: face,
				to: expectedFace,
				afterRotations: new Alg('x')
			});
		});
	}

	it('should throw an error on unexpected faces', () => {
		expect(() => validateTransform({ from: 0x42, to: 'M' })).to.throw(
			'Cannot read properties of undefined'
		);
	});

	describe('validate rotation', () => {
		it('call updateOrientation and validate', () => {
			const ganCube = new GANCube(dummyDevice);
			// we think this rotation goes from WG -> YG
			const homeState = new Uint8Array([
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3
			]);
			ganCube.updateOrientation(homeState);
			expect(ganCube.getFacing()).to.equal('WG');
			const array = new Uint8Array([
				0x0, 0x0, 0, 0x40, 0, 0, 0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3
			]);
			ganCube.updateOrientation(array);
			expect(ganCube.getFacing()).to.equal('YG');
		});
	});
});
