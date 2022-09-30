import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';

import { GANCube } from '$lib/bluetooth/gan/gan356i_v1';
import { Alg } from 'cubing/alg';
import { cube3x3x3 } from 'cubing/puzzles';
import { GANCubeV2 } from '$lib/bluetooth/gan/gan356i_v2';

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

	it('can stringify the version', async () => {
		const cube = new GANCube(dummyDevice);
		expect(await cube.getVersionAsString()).to.equal('1.1.3');
	});

	interface TestCase {
		cube: GANCube | GANCubeV2;
		from: number;
		to: string;
		afterRotations?: Alg;
	}

	function validateTransform({ cube, from, to, afterRotations }: TestCase) {
		const startState = kpuzzle.startState();
		const state = afterRotations ? startState.applyAlg(afterRotations) : startState;
		const newMove = cube.colorToFaceMove(from, state.stateData);
		expect(newMove).to.equal(to);
	}

	// after an X rotation , ULFRBD <- FLDRUB
	const ganv1 = new GANCube(dummyDevice);
	const ganv2 = new GANCubeV2(dummyDevice, '');
	const faceCases = [
		{ cube: ganv1, face: 0x06, originalFace: 'F', expectedFace: 'U' },
		{ cube: ganv1, face: 0x0c, originalFace: 'L', expectedFace: 'L' },
		{ cube: ganv1, face: 0x09, originalFace: 'D', expectedFace: 'F' },
		{ cube: ganv1, face: 0x03, originalFace: 'R', expectedFace: 'R' },
		{ cube: ganv1, face: 0x05, originalFace: "R'", expectedFace: "R'" },
		{ cube: ganv1, face: 0x00, originalFace: 'U', expectedFace: 'B' },
		{ cube: ganv1, face: 0x0f, originalFace: 'B', expectedFace: 'D' },
		{ cube: ganv2, face: 4, originalFace: 'F', expectedFace: 'U' },
		{ cube: ganv2, face: 8, originalFace: 'L', expectedFace: 'L' },
		{ cube: ganv2, face: 6, originalFace: 'D', expectedFace: 'F' },
		{ cube: ganv2, face: 2, originalFace: 'R', expectedFace: 'R' },
		{ cube: ganv2, face: 3, originalFace: "R'", expectedFace: "R'" },
		{ cube: ganv2, face: 0, originalFace: 'U', expectedFace: 'B' },
		{ cube: ganv2, face: 10, originalFace: 'B', expectedFace: 'D' }
	];
	const rotationCases = [
		{ cube: ganv1, face: 0x26, originalFace: 'z', expectedFace: 'z' },
		{ cube: ganv1, face: 0x23, originalFace: 'y', expectedFace: 'y' },
		{ cube: ganv2, face: 13, originalFace: 'y', expectedFace: "z'" }
	];
	for (const { cube, face, originalFace, expectedFace } of [faceCases, rotationCases].flat()) {
		it(`should not touch '${face}' moves`, () => {
			validateTransform({ cube, from: face, to: originalFace });
		});

		it(`should modify '${face}' to '${expectedFace}' moves with x rotation`, () => {
			validateTransform({
				cube,
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
			ganCube.setTrackingRotations(true);
			// we think this rotation goes from WG -> YG
			const homeState = new Uint8Array([
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3
			]);
			ganCube.updateOrientation(homeState);
			expect(ganCube.getFacing()).to.equal('WG');
			const array = new Uint8Array([
				0x0, 0x0, 0, 0x40, 0, 0, 0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3
			]);
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const nullcallback = () => {};
			ganCube.handleMoves(array, nullcallback, nullcallback);
			expect(ganCube.getFacing()).to.equal('YG');
		});

		const facingToQuaterions: { [key: string]: [number, number, number] } = {
			WG: [0, 0, 0],
			WR: [0, -Math.sqrt(2) / 2, 0],
			WB: [0, -1, 0],
			WO: [0, Math.sqrt(2) / 2, 0], // negatives
			OG: [Math.sqrt(2) / 2, 0, 0], // negs
			OW: [0.5, -0.5, 0.5],
			OB: [0, Math.sqrt(2) / 2, -Math.sqrt(2) / 2],
			OY: [0.5, 0.5, -0.5],
			YG: [1, 0, 0],
			YO: [Math.sqrt(2) / 2, 0, Math.sqrt(2) / 2],
			YB: [0, 0, 1],
			YR: [-Math.sqrt(2) / 2, 0, Math.sqrt(2) / 2],
			RG: [-Math.sqrt(2) / 2, 0, 0],
			RY: [-0.5, -0.5, -0.5],
			RB: [0, -Math.sqrt(2) / 2, -Math.sqrt(2) / 2],
			RW: [-0.5, 0.5, 0.5], // negs
			GY: [0, 0, -Math.sqrt(2) / 2], // negs
			GR: [0.5, -0.5, -0.5], // negs
			GW: [-Math.sqrt(2) / 2, Math.sqrt(2) / 2, 0],
			GO: [-0.5, 0.5, -0.5],
			BW: [0, 0, Math.sqrt(2) / 2], // negs
			BR: [-0.5, -0.5, 0.5], // negs
			BY: [Math.sqrt(2) / 2, Math.sqrt(2) / 2, 0],
			BO: [0.5, 0.5, 0.5]
		};

		function quatToInvertedBytes(q: [number, number, number]) {
			const x = q[0];
			const y = q[1];
			const z = q[2];
			const max = 16384;
			return [-z, -x, y]
				.map((q) => Math.floor(q * max))
				.map((x) => [x & 0x00ff, (x & 0x00ff00) >> 8])
				.flat();
		}

		function encodeFacing(facing: string) {
			return quatToInvertedBytes(facingToQuaterions[facing]);
		}

		it('call updateOrientation for two moves and validate', () => {
			const ganCube = new GANCube(dummyDevice);
			ganCube.setTrackingRotations(true); //? [0,0.5,Math.sqrt(2)/2].map(x => Math.floor(x*16384))
			const homeState = new Uint8Array([
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3
			]);
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const nullcallback = () => {};
			ganCube.updateOrientation(homeState);
			expect(ganCube.getFacing()).to.equal('WG');
			const tail = [0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3];
			const array = new Uint8Array([...encodeFacing('GO'), ...tail]);
			ganCube.handleMoves(array, nullcallback, nullcallback);
			expect(ganCube.getFacing()).to.equal('GO');
		});

		function orientationTest({ from, to }: { [k: string]: string }) {
			const ganCube = new GANCube(dummyDevice);
			it(`handles from WG to ${from} to ${to}`, () => {
				ganCube.setTrackingRotations(true);
				// set up WG.
				const homeState = new Uint8Array([
					0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3
				]);
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				const nullcallback = () => {};
				ganCube.updateOrientation(homeState);
				expect(ganCube.getFacing()).to.equal('WG');
				const tail = [0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3];
				const array = new Uint8Array([...encodeFacing(from), ...tail]);
				ganCube.handleMoves(array, nullcallback, nullcallback);
				expect(ganCube.getFacing()).to.equal(from);
				const move2 = new Uint8Array([...encodeFacing(to), ...tail]);
				ganCube.handleMoves(move2, nullcallback, nullcallback);
				expect(ganCube.getFacing()).to.equal(to);
			});
		}
		const facings = Object.keys(facingToQuaterions);
		facings.forEach((f1) => {
			facings.forEach((f2) => {
				if (f1 !== f2) {
					orientationTest({ from: f1, to: f2 });
				}
			});
		});

		it('ignores orientation by default', () => {
			const ganCube = new GANCube(dummyDevice);
			// we think this rotation goes from WG -> YG
			const homeState = new Uint8Array([
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3
			]);
			const fail = () => {
				expect(true).to.be.false;
			};
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const nullcallback = () => {};
			ganCube.handleMoves(homeState, fail, nullcallback);
			expect(ganCube.getFacing()).to.equal('WG');
			const array = new Uint8Array([
				0x0, 0x0, 0, 0x40, 0, 0, 0, 0, 0, 0, 0, 0, 140, 12, 6, 6, 6, 5, 3
			]);
			ganCube.handleMoves(array, fail, nullcallback);
			expect(ganCube.getFacing()).to.equal('WG');
			ganCube.handleMoves(homeState, fail, nullcallback);
			expect(ganCube.getFacing()).to.equal('WG');
			ganCube.handleMoves(array, fail, nullcallback);
			expect(ganCube.getFacing()).to.equal('WG');
		});

		function moveTest(numMoves: number) {
			it(`handles from ${numMoves} consecutive moves`, () => {
				const ganCube = new GANCube(dummyDevice);
				ganCube.setTrackingRotations(true);
				const homeState = new Uint8Array([
					0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 253, 12, 6, 6, 6, 5, 3
				]);
				let count = 0;
				const countcallback = () => {
					count++;
				};
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				const nullcallback = () => {};
				ganCube.handleMoves(homeState, countcallback, nullcallback);
				expect(count).to.equal(0);
				homeState[12] += numMoves;
				homeState[12] %= 256;
				ganCube.handleMoves(homeState, countcallback, nullcallback);
				expect(count).to.equal(Math.min(numMoves, 6));
			});
		}
		for (let i = 0; i < 9; ++i) {
			moveTest(i);
		}
	});
});
