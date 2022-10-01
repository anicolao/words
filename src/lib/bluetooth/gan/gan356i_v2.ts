import {
	getCharacteristic,
	write,
	type GATTCharacteristicDescriptor,
	type GATTDeviceDescriptor
} from '$lib/bluetooth/bluetooth';
import { importKey, unsafeDecryptBlock, unsafeEncryptBlock } from '$lib/third_party/unsafe-raw-aes';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KStateData, KState } from 'cubing/kpuzzle';
import { Euler, Quaternion, Vector3 } from 'three';
import type {
	MoveCallback,
	OrientationCallback,
	ProgressCallback,
	RawCallback
} from './gan356i_v1';

const kpuzzle = await cube3x3x3.kpuzzle();
const UUIDs = {
	ganCubeService: '6e400001-b5a3-f393-e0a9-e50e24dc4179',
	ganV2NotificationsCharacteristic: '28be4cb6-cd67-11e9-a32f-2a2ae2dbcce4',
	ganV2WriteCharacteristic: '28be4a4a-cd67-11e9-a32f-2a2ae2dbcce4'
};

const keyInfoMap: { [k: string]: number[] } = {};
export async function getDeviceKeyInfo(f: GATTDeviceDescriptor) {
	// Ethan's i3 [0x9b, 0x71, 0x02, 0x34, 0x12, 0xab];
	// iCarry [0x83, 0x36, 0x5D, 0x34, 0x12, 0xAB];
	// Monster Go [ 0x32, 0x01, 0x5E, 0x34, 0x12, 0xAB ]
	return keyInfoMap[f.id];
}

export type GANV2KeyInfo = { key: number[]; iv: number[] };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getRawKey(f: GATTDeviceDescriptor): Promise<GANV2KeyInfo> {
	return {
		key: [
			0x01, 0x02, 0x42, 0x28, 0x31, 0x91, 0x16, 0x07, 0x20, 0x05, 0x18, 0x54, 0x42, 0x11, 0x12, 0x53
		],
		iv: [
			0x11, 0x03, 0x32, 0x28, 0x21, 0x01, 0x76, 0x27, 0x20, 0x95, 0x78, 0x14, 0x32, 0x12, 0x02, 0x43
		]
	};
}

export async function makeKeyArray(
	f: GATTDeviceDescriptor,
	rawKey: Uint8Array,
	keyXOR: number[]
): Promise<Uint8Array> {
	const key = new Uint8Array(rawKey);
	for (let i = 0; i < keyXOR.length; i++) {
		key[i] = (key[i] + keyXOR[i]) % 255;
	}
	return key;
}
export async function makeKey(
	f: GATTDeviceDescriptor,
	rawKey: Uint8Array,
	keyXOR: number[]
): Promise<CryptoKey> {
	return importKey(await makeKeyArray(f, rawKey, keyXOR));
}

type Decryptor = (data: Uint8Array) => Promise<Uint8Array>;
export async function getDecryptor(f: GATTDeviceDescriptor): Promise<Decryptor> {
	const keys = await getRawKey(f);
	const keyXOR = await getDeviceKeyInfo(f);
	const rawKey = Uint8Array.from(keys.key);
	const aesKey = await makeKey(f, rawKey, keyXOR);
	const iv = await makeKeyArray(f, Uint8Array.from(keys.iv), keyXOR);
	return async (data: Uint8Array) => {
		const copy = new Uint8Array(data);
		const offset = copy.length - 16;
		copy.set(new Uint8Array(await unsafeDecryptBlock(aesKey, copy.slice(offset))), offset);
		for (let i = offset; i < copy.length; ++i) {
			copy[i] ^= iv[i - offset];
		}
		copy.set(new Uint8Array(await unsafeDecryptBlock(aesKey, copy.slice(0, 16))), 0);
		for (let i = 0; i < keys.iv.length; ++i) {
			copy[i] ^= iv[i];
		}

		return copy;
	};
}

export async function getEncryptor(f: GATTDeviceDescriptor): Promise<Decryptor> {
	const keys = await getRawKey(f);
	const keyXOR = await getDeviceKeyInfo(f);
	const rawKey = Uint8Array.from(keys.key);
	const aesKey = await makeKey(f, rawKey, keyXOR);
	const iv = await makeKeyArray(f, Uint8Array.from(keys.iv), keyXOR);
	return async (data: Uint8Array) => {
		const copy = new Uint8Array(data);
		for (let i = 0; i < keys.iv.length; ++i) {
			copy[i] ^= iv[i];
		}
		copy.set(new Uint8Array(await unsafeEncryptBlock(aesKey, copy.slice(0, 16))), 0);
		const offset = copy.length - 16;
		for (let i = offset; i < copy.length; ++i) {
			copy[i] ^= iv[i - offset];
		}
		copy.set(new Uint8Array(await unsafeEncryptBlock(aesKey, copy.slice(offset))), offset);

		return copy;
	};
}

export class GANCubeV2 {
	private deviceDescriptor;
	private decrypt?: Decryptor;
	private notifications: GATTCharacteristicDescriptor;
	private request: GATTCharacteristicDescriptor;
	private encrypt?: Decryptor;
	private lastMoveCount;
	private lastMoveTime: number;
	private watchingMoves: ((e: Event) => Promise<void>) | undefined = undefined;
	private trackingRotation = false;

	private homeOrientationKnown = false;
	private homeOrientation = new Quaternion();
	private orientation = new Quaternion();

	public constructor(f: GATTDeviceDescriptor, manufacturerData: string) {
		if (manufacturerData) {
			const md = manufacturerData.split(' ').map((x) => parseInt(x, 16));
			keyInfoMap[f.id] = md.slice(-6);
		} else if (!keyInfoMap[f.id]) {
			keyInfoMap[f.id] = [0, 0, 0, 0, 0, 0];
		}
		this.deviceDescriptor = f;
		this.lastMoveCount = -1;
		this.lastMoveTime = -1;
		this.notifications = {
			...this.deviceDescriptor,
			service: UUIDs.ganCubeService,
			characteristic: UUIDs.ganV2NotificationsCharacteristic
		};
		this.request = {
			...this.deviceDescriptor,
			service: UUIDs.ganCubeService,
			characteristic: UUIDs.ganV2WriteCharacteristic
		};
		this.initQuaternionToOrientationMap();
	}

	public async getVersionAsString() {
		/*const version = await getVersionDecoded(this.deviceDescriptor);
		return `${(version & 0xff0000) >> 16}.${(version & 0xff00) >> 8}.${version & 0xff}`;
		*/
		return 'unknown';
	}

	public async makeMessage(n: number) {
		const message = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		message[0] = n;
		const buffer = Uint8Array.from(message);
		if (!this.encrypt) throw 'No encryptor';
		return this.encrypt(buffer);
	}

	NUM_MOVES_TO_DECRYPT = 6;
	encryptionMoveCount = 0;
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	progress: ProgressCallback = () => {};
	public isReady(p: ProgressCallback) {
		this.progress = p;
		return this.keyIsGood();
	}
	public keyIsGood() {
		const nonZeroEntryCount = keyInfoMap[this.deviceDescriptor.id].filter((x) => x > 0).length;
		return nonZeroEntryCount > 4;
	}
	public numEncryptionMovesRequired() {
		if (this.keyIsGood()) {
			return 0;
		}
		return this.NUM_MOVES_TO_DECRYPT - this.encryptionMoveCount;
	}
	public async watchMoves(callback: MoveCallback, ori: OrientationCallback, raw: RawCallback) {
		const n = await getCharacteristic(this.notifications);
		await n.startNotifications();
		const setupEncryption = async () => {
			const nonZeroEntryCount = keyInfoMap[this.deviceDescriptor.id].filter((x) => x > 0).length;
			if (nonZeroEntryCount > 4) {
				this.decrypt = await getDecryptor(this.deviceDescriptor);
				this.encrypt = await getEncryptor(this.deviceDescriptor);
				const requestState = await this.makeMessage(4);
				write(this.request, requestState);
			}
		};
		const encryptionSample: Uint8Array[] = [];
		this.watchingMoves = async (e) => {
			if (!this.decrypt) {
				await setupEncryption();
			}
			if (!e.currentTarget) return;
			const target = e.currentTarget as unknown as { value: Uint8Array };
			if (this.decrypt) {
				const encrypted = new Uint8Array(target.value.buffer);
				const decrypted = await this.decrypt(encrypted);

				const message = this.extractBits(decrypted, 0, 4);
				const curMoveCount = this.extractBits(decrypted, 4, 8);
				if (message === 1) {
					return;
				}
				if (message === 4) {
					if (this.lastMoveCount === -1) {
						this.lastMoveCount = curMoveCount;
						this.lastMoveTime = new Date().getTime();
					}
				}
				if (message === 2) {
					this.handleMoves(decrypted, callback, ori);
				}
			} else {
				const encrypted = new Uint8Array(target.value.buffer);
				raw(Array.from(encrypted));
				encryptionSample.push(encrypted);
				if (encryptionSample.length === this.NUM_MOVES_TO_DECRYPT) {
					const stillValid = await this.bruteForceKeys(encryptionSample, this.progress);
					if (stillValid.length === 1) {
						console.log('Success!');
						keyInfoMap[this.deviceDescriptor.id] = stillValid[0];
					}
				}
				this.encryptionMoveCount++;
			}
		};
		n.addEventListener('characteristicvaluechanged', this.watchingMoves);
	}

	public async bruteForceKeys(encryptionSample: Uint8Array[], progress: ProgressCallback) {
		const possiblyValidKeys = [];
		const digitSize = 62;
		for (let d1 = 0; d1 < digitSize; d1++) {
			for (let d2 = 0; d2 < digitSize; d2++) {
				for (let d3 = 0; d3 < digitSize; d3++) {
					let keySalt = d1 * digitSize * digitSize + d2 * digitSize + d3;
					progress(keySalt, digitSize * digitSize * digitSize);
					let kb0 = (keySalt & 0x00ff0000) >> 16;
					let kb1 = (keySalt & 0x00ff00) >> 8;
					let kb2 = keySalt & 0x00ff;
					let key = [];
					key.push(kb2);
					key.push(kb1);
					key.push(kb0);
					key.push(0x34);
					key.push(0x12);
					key.push(0xab);
					let result = await this.filterKey(encryptionSample[2], key);
					if (result) {
						possiblyValidKeys.push(key);
					}
					keySalt += 25 * 62 * 62 * 62;
					kb0 = (keySalt & 0x00ff0000) >> 16;
					kb1 = (keySalt & 0x00ff00) >> 8;
					kb2 = keySalt & 0x00ff;
					key = [];
					key.push(kb2);
					key.push(kb1);
					key.push(kb0);
					key.push(0x34);
					key.push(0x12);
					key.push(0xab);
					result = await this.filterKey(encryptionSample[2], key);
					if (result) {
						possiblyValidKeys.push(key);
					}
				}
			}
		}
		console.log({ possiblyValidKeys });
		const stillValid = [];
		for (let i = 0; i < possiblyValidKeys.length; ++i) {
			let valid = true;
			for (let j = 0; j < encryptionSample.length && valid; ++j) {
				valid = valid && (await this.filterKey(encryptionSample[j], possiblyValidKeys[i]));
			}
			if (valid) {
				stillValid.push(possiblyValidKeys[i]);
			}
		}
		console.log({ stillValid });
		if (stillValid.length === 1) {
			progress(digitSize * digitSize * digitSize, digitSize * digitSize * digitSize);
		}
		return stillValid;
	}

	public async filterKey(sample: Uint8Array, key: number[]) {
		keyInfoMap[this.deviceDescriptor.id] = key;
		const decrypt = await getDecryptor(this.deviceDescriptor);
		const sample1 = await decrypt(sample);
		const message = this.extractBits(sample1, 0, 4);
		if (message === 2) {
			let possiblyValid = true;
			for (let i = 0; i < 7 && possiblyValid; ++i) {
				const offset = 7 - 1 - i;
				const moveCode = this.extractBits(sample1, 12 + offset * 5, 5);
				possiblyValid = possiblyValid && moveCode < 17;
			}
			/*
					let previousTimestamp = this.extractBits(sample1, 12 + 7*5 + 0*16, 16);
					for (let i = 1; i < 7 && possiblyValid; ++i) {
						let timestamp = this.extractBits(sample1, 12 + 7 * 5 + i*16, 16);
						if (timestamp < previousTimestamp) {
							possiblyValid = false;
						} else {
							previousTimestamp = timestamp;
						}
					}
					*/
			return possiblyValid;
		}
		if (message === 1) {
			return true;
		}
		return false;
	}
	public extractBits(buffer: Uint8Array, startBit: number, numBits: number) {
		let byteNum = Math.floor(startBit / 8);
		const start = startBit % 8;
		let byte = buffer[byteNum++] & 0x00ff;
		byte = (byte << start) & 0x00ff;
		byte = byte >> start;
		let bitsRemaining = 8 - start;
		while (numBits > bitsRemaining) {
			byte = (byte << 8) | buffer[byteNum++];
			numBits -= bitsRemaining;
			bitsRemaining = 8;
		}
		byte = byte >> (bitsRemaining - numBits);
		return byte;
	}

	public handleMoves(decryptedMoves: Uint8Array, callback: MoveCallback, ori: OrientationCallback) {
		const curMoveCount = this.extractBits(decryptedMoves, 4, 8);
		/*
		const facingQuat = this.updateOrientation(decryptedMoves);
		ori(facingQuat);
		*/
		if (this.lastMoveCount !== curMoveCount) {
			let mc = curMoveCount;
			if (mc < this.lastMoveCount) mc += 256;
			if (this.lastMoveCount === -1) {
				// assume 1 move ...
				this.lastMoveCount = mc - 1;
				this.lastMoveTime = new Date().getTime();
			}
			const numMoves = Math.min(mc - this.lastMoveCount, 6);
			if (mc - this.lastMoveCount > 6) {
				console.error(
					`There were ${mc - this.lastMoveCount} moves! We dropped ${
						mc - this.lastMoveCount - numMoves
					}!`
				);
			}
			const clockTime = new Date().getTime();
			for (let i = 0; i < numMoves; ++i) {
				const offset = numMoves - 1 - i;
				const moveCode = this.extractBits(decryptedMoves, 12 + offset * 5, 5);
				const timing = this.extractBits(decryptedMoves, 12 + 7 * 5 + 16 * offset, 16);
				console.log({ moveCode, timestamp: timing, clock_timing: clockTime - this.lastMoveTime });
				callback(moveCode);
				if (timing < 30) {
					// hack in a rotation move so that we get a slice.
					callback(moveCode + 12);
				}
			}
		}

		const rotationMove = this.facingToRotationMove[this.rotation];
		if (rotationMove) {
			this.rotation = 'none';
			// two rotaton moves packed in one number
			if (rotationMove > 0x00ff) {
				callback(rotationMove >> 8);
				callback(rotationMove & 0x00ff);
			} else {
				callback(rotationMove);
			}
		}
		this.lastMoveCount = curMoveCount;
		this.lastMoveTime = new Date().getTime();
	}

	public async unwatchMoves() {
		if (this.watchingMoves) {
			const n = await getCharacteristic(this.notifications);
			await n.stopNotifications();
			n.removeEventListener('characteristicvaluechanged', this.watchingMoves);
			this.watchingMoves = undefined;
		}
	}

	public colorToFaceMove(originalMove: number, stateData: KStateData) {
		const colors = 'WOGRBY';
		const mapped = [
			'W',
			"W'",
			'R',
			"R'",
			'G',
			"G'",
			'Y',
			"Y'",
			'O',
			"O'",
			'B',
			"B'",
			"w'",
			'w',
			"r'",
			'r',
			"g'",
			'g',
			"y'",
			'y',
			"o'",
			'o',
			"b'",
			'b'
		];
		const move = mapped[originalMove];
		const faceIndex = colors.indexOf(move[0].toUpperCase());
		const faces = 'ULFRBD';
		const rotations = 'yxzxzy';
		const inversion = '010011';
		const index = stateData['CENTERS'].pieces.indexOf(faceIndex);
		let family = faces[index];
		let inverted = false;
		if (move[0].toUpperCase() !== move[0]) {
			family = rotations[index];
			inverted = inversion[index] === '1';
		}
		let forward = move.length === 1;
		if (inverted) forward = !forward;
		if (forward) {
			return family;
		}
		if (family.slice(-1) === "'") {
			return family.slice(0, -1);
		}
		return family + "'";
	}

	public updateOrientation(decryptedMoves: Uint8Array): Quaternion {
		const dataView = new DataView(decryptedMoves.buffer);
		let x = dataView.getInt16(0, true) / 16384;
		let y = dataView.getInt16(2, true) / 16384;
		let z = dataView.getInt16(4, true) / 16384;
		[x, y, z] = [-y, z, -x];
		const wSquared = 1 - (x * x + y * y + z * z);
		const w = wSquared > 0 ? Math.sqrt(wSquared) : 0;
		const quat = new Quaternion(x, y, z, w).normalize();

		if (!this.homeOrientationKnown) {
			const orient = new Euler(0, Math.PI / 2, 0, 'XYZ');
			const hQuat = quat;
			const oQ = new Quaternion();
			oQ.setFromEuler(orient);
			// as close as I've come to getting the orientation to work.
			//hQuat = oQ.clone().multiply(quat);

			this.homeOrientation = hQuat.clone().invert();
			this.homeOrientationKnown = true;
		}

		this.orientation = quat.clone().multiply(this.homeOrientation.clone());

		// put some dead space in so that the orientation doesn't
		// flip back and forth due to sensor noise
		const threshold = Math.PI / 4 - 0.15;
		for (let i = 0; i < this.quaternionToOrientationMap.length; ++i) {
			const facingAngle = this.quaternionToOrientationMap[i].q;
			const faces = this.quaternionToOrientationMap[i].facing;
			const offset = this.orientation.angleTo(facingAngle);
			if (Math.abs(offset) < threshold) {
				if (faces !== this.facing) {
					this.rotation = `${faces}<${this.facing}`;
					const rotationMove = this.facingToRotationMove[this.rotation];
					if (rotationMove) {
						if (this.trackingRotation) {
							console.log(`Will rotate to ${faces} from ${this.facing}`);
							this.facing = faces;
						} else {
							console.log(`Ignoring rotate to ${faces} from ${this.facing}`);
							this.rotation = 'none';
						}
					} else {
						// impossible now that we allow two cube rotations
						console.error(`Don't know how to rotate to ${faces} from ${this.facing}`);
					}
				}
			}
		}
		return this.orientation;
	}

	public setTrackingRotations(flag: boolean) {
		this.trackingRotation = flag;
	}

	public getFacing() {
		return this.facing;
	}

	private quaternionToOrientationMap: { q: Quaternion; facing: string }[] = [];
	private facing = 'WG';
	private rotation = 'none';
	private facings: string[] = [];
	private facingToRotationMove: { [k: string]: number } = {};
	public kpuzzleToFacing = function (state: KState) {
		const colours = 'WOGRBY';
		const centers = state.stateData['CENTERS'].pieces;
		const axisToIndex = { x: 3, y: 0, z: 2 };
		const topIndex = centers[axisToIndex['y']];
		const frontIndex = centers[axisToIndex['z']];
		const topFace = colours[topIndex];
		const frontFace = colours[frontIndex];
		return topFace + frontFace;
	};

	private initQuaternionToOrientationMap() {
		const WGOrientation = new Quaternion(0, 0, 0, 1);
		const zMove = new Quaternion();
		const yMove = new Quaternion();
		const xMove = new Quaternion();
		zMove.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
		yMove.setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
		xMove.setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2);
		const facingStates: { [key: string]: KState } = {};
		let currentOrientation = WGOrientation;
		let state: KState = kpuzzle.startState();
		// centers is in "ULFRBD" order
		let centers = state.stateData['CENTERS'].pieces;
		// so rotations correspond to ULFRDB order
		const rotations = [
			yMove,
			xMove.clone().invert(),
			zMove,
			xMove,
			zMove.clone().invert(),
			yMove.clone().invert()
		];
		function rotateCube(axis: string) {
			const axisToIndex: { [key: string]: number } = { x: 3, y: 0, z: 2 };
			const move = rotations[centers[axisToIndex[axis]]];
			currentOrientation = currentOrientation.clone().multiply(move);
			state = state.applyMove(axis);
			centers = state.stateData['CENTERS'].pieces;
		}
		for (let zxRotation = 0; zxRotation < 6; ++zxRotation) {
			if (zxRotation > 0 && zxRotation < 4) {
				rotateCube('z');
			} else if (zxRotation == 4) {
				rotateCube('z');
				rotateCube('x');
			} else if (zxRotation == 5) {
				rotateCube('x');
				rotateCube('x');
			}
			for (let yRotation = 0; yRotation < 4; ++yRotation) {
				if (yRotation > 0) {
					rotateCube('y');
				}
				const currentFacing = this.kpuzzleToFacing(state);
				this.facings.push(currentFacing);
				facingStates[currentFacing] = state;
				this.quaternionToOrientationMap.push({
					q: currentOrientation,
					facing: currentFacing
				});
			}
			rotateCube('y');
		}
		// For every facing, generate all the cube rotations from that
		// facing that we want to recognize.
		const recognizableCubeRotations = ['x', "x'", 'x2', 'y', "y'", 'y2', 'z', "z'", 'z2'];
		const moveToNumber: { [k: string]: number } = {
			x: 0x20,
			"x'": 0x21,
			x2: 0x22,
			y: 0x23,
			"y'": 0x24,
			y2: 0x25,
			z: 0x26,
			"z'": 0x27,
			z2: 0x28
		};
		this.facings.map((startFacing) => {
			recognizableCubeRotations.map((move) => {
				const endState = facingStates[startFacing].applyMove(move);
				const endFacing = this.kpuzzleToFacing(endState);
				const key = `${endFacing}<${startFacing}`;
				this.facingToRotationMove[key] = moveToNumber[move];
			});
		});
		// find all remaining orientation changes by considering
		// two recognizableCubeRotations in a row and recording the
		// first unique option
		this.facings.map((startFacing) => {
			recognizableCubeRotations.map((move1) => {
				recognizableCubeRotations.map((move2) => {
					const endState = facingStates[startFacing].applyMove(move1).applyMove(move2);
					const endFacing = this.kpuzzleToFacing(endState);
					if (endFacing !== startFacing) {
						const key = `${endFacing}<${startFacing}`;
						if (!this.facingToRotationMove[key]) {
							this.facingToRotationMove[key] = (moveToNumber[move1] << 8) | moveToNumber[move2];
						}
					}
				});
			});
		});
	}
}

/*
const commands: { [cmd: string]: BufferSource } = {
  reset: new Uint8Array([
    0x00, 0x00, 0x24, 0x00, 0x49, 0x92, 0x24, 0x49, 0x6d, 0x92, 0xdb, 0xb6,
    0x49, 0x92, 0xb6, 0x24, 0x6d, 0xdb,
  ]),
};
*/
