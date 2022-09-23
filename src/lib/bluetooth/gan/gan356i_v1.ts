import {
	read,
	type GATTCharacteristicDescriptor,
	type GATTDeviceDescriptor
} from '$lib/bluetooth/bluetooth';
import { importKey, unsafeDecryptBlock } from '$lib/third_party/unsafe-raw-aes';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KStateData, KState } from 'cubing/kpuzzle';
import { Quaternion, Vector3 } from 'three';

const kpuzzle = await cube3x3x3.kpuzzle();
const UUIDs = {
	ganCubeService: '0000fff0-0000-1000-8000-00805f9b34fb',
	physicalStateCharacteristic: '0000fff5-0000-1000-8000-00805f9b34fb',
	actualAngleAndBatteryCharacteristic: '0000fff7-0000-1000-8000-00805f9b34fb',
	faceletStatus1Characteristic: '0000fff2-0000-1000-8000-00805f9b34fb',
	faceletStatus2Characteristic: '0000fff3-0000-1000-8000-00805f9b34fb',
	infoService: '0000180a-0000-1000-8000-00805f9b34fb',
	systemIDCharacteristic: '00002a23-0000-1000-8000-00805f9b34fb',
	versionCharacteristic: '00002a28-0000-1000-8000-00805f9b34fb'
};

export function getVersion(f: GATTDeviceDescriptor) {
	return read({ ...f, service: UUIDs.infoService, characteristic: UUIDs.versionCharacteristic });
}

export async function getVersionDecoded(f: GATTDeviceDescriptor) {
	const value = await getVersion(f);
	const versionBuffer = new Uint8Array(value.buffer);
	return (((versionBuffer[0] << 8) + versionBuffer[1]) << 8) + versionBuffer[2];
}

export async function isProtocolEncrypted(f: GATTDeviceDescriptor) {
	return (await getVersionDecoded(f)) >= 0x010008;
}

export async function getRawKey(f: GATTDeviceDescriptor) {
	if ((await getVersionDecoded(f)) < 0x01_01_00) {
		return new Uint8Array([
			198, 202, 21, 223, 79, 110, 19, 182, 119, 13, 230, 89, 58, 175, 186, 162
		]);
	}
	return new Uint8Array([67, 226, 91, 214, 125, 220, 120, 216, 7, 96, 163, 218, 130, 60, 1, 241]);
}

async function makeKey(f: GATTDeviceDescriptor, rawKey: Uint8Array): Promise<CryptoKey> {
	const sysId = { ...f, service: UUIDs.infoService, characteristic: UUIDs.systemIDCharacteristic };
	const systemID = new Uint8Array((await read(sysId)).buffer);

	const key = new Uint8Array(rawKey);
	for (let i = 0; i < systemID.length; i++) {
		key[i] = (key[i] + systemID[systemID.length - i - 1]) % 256;
	}

	return importKey(key);
}

type Decryptor = (data: Uint8Array) => Promise<Uint8Array>;
export async function getDecryptor(f: GATTDeviceDescriptor): Promise<Decryptor> {
	function probablyDecodedCorrectly(data: Uint8Array): boolean {
		return (
			data[13] < 0x12 &&
			data[14] < 0x12 &&
			data[15] < 0x12 &&
			data[16] < 0x12 &&
			data[17] < 0x12 &&
			data[18] < 0x12
		);
	}
	if (await isProtocolEncrypted(f)) {
		const rawKey = await getRawKey(f);
		const aesKey = await makeKey(f, rawKey);
		return async (data: Uint8Array) => {
			const copy = new Uint8Array(data);
			copy.set(new Uint8Array(await unsafeDecryptBlock(aesKey, copy.slice(3))), 3);
			copy.set(new Uint8Array(await unsafeDecryptBlock(aesKey, copy.slice(0, 16))), 0);

			if (probablyDecodedCorrectly(copy)) {
				return copy;
			}

			throw new Error(`Decryption failed ${data} ==> ${copy}`);
		};
	}
	return async (d: Uint8Array) => d;
}

export type MoveCallback = (move: number) => void;
export class GANCube {
	private deviceDescriptor;
	private decrypt?: Decryptor;
	private moves: GATTCharacteristicDescriptor;
	private lastMoveCount;
	private watchingMoves = false;
	private trackingRotation = false;

	private homeOrientationKnown = false;
	private homeOrientation = new Quaternion();
	private orientation = new Quaternion();

	public constructor(f: GATTDeviceDescriptor) {
		this.deviceDescriptor = f;
		this.lastMoveCount = -1;
		this.moves = {
			...f,
			service: UUIDs.ganCubeService,
			characteristic: UUIDs.physicalStateCharacteristic
		};
		this.initQuaternionToOrientationMap();
	}

	public async getVersionAsString() {
		const version = await getVersionDecoded(this.deviceDescriptor);
		return `${(version & 0xff0000) >> 16}.${(version & 0xff00) >> 8}.${version & 0xff}`;
	}

	public async watchMoves(callback: MoveCallback) {
		const pollMoveState = async () => {
			if (!this.decrypt) {
				this.decrypt = await getDecryptor(this.deviceDescriptor);
			}
			const encryptedMoves = await read(this.moves);
			const decryptedMoves = await this.decrypt(new Uint8Array(encryptedMoves.buffer));
			this.handleMoves(decryptedMoves, callback);
		};
		this.watchingMoves = true;
		window.setTimeout(pollMoveState, 10);
	}

	public handleMoves(decryptedMoves: Uint8Array, callback: MoveCallback) {
		const arr = new Uint8Array(decryptedMoves.buffer);
		this.updateOrientation(decryptedMoves);
		if (this.lastMoveCount !== arr[12] && this.lastMoveCount !== -1) {
			let mc = arr[12];
			if (mc < this.lastMoveCount) mc += 256;
			const numMoves = Math.min(mc - this.lastMoveCount, 6);
			if (mc - this.lastMoveCount > 6) {
				console.error(
					`There were ${mc - this.lastMoveCount} moves! We dropped ${
						mc - this.lastMoveCount - numMoves
					}!`
				);
			}
			for (let i = arr.length - numMoves; i < arr.length; ++i) {
				callback(arr[i]);
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
		this.lastMoveCount = arr[12];
		if (this.watchingMoves) {
			this.watchMoves(callback);
		}
	}

	public unwatchMoves() {
		this.watchingMoves = false;
		console.log('no longer watching moves');
	}

	static colorToFaceMove(originalMove: number, stateData: KStateData) {
		const colors = 'WOGRBY';
		const moveToColor: { [move: number]: string } = {
			0x00: 'W',
			0x02: "W'",
			0x03: 'R',
			0x05: "R'",
			0x06: 'G',
			0x08: "G'",
			0x09: 'Y',
			0x0b: "Y'",
			0x0c: 'O',
			0x0e: "O'",
			0x0f: 'B',
			0x11: "B'"
		};
		const moveToRotation: { [k: number]: string } = {
			0x20: 'x',
			0x21: "x'",
			0x22: 'x2',
			0x23: 'y',
			0x24: "y'",
			0x25: 'y2',
			0x26: 'z',
			0x27: "z'",
			0x28: 'z2'
		};
		const move = moveToColor[originalMove];
		if (!move && moveToRotation[originalMove]) {
			return moveToRotation[originalMove];
		}
		const faceIndex = colors.indexOf(move[0]);
		const faces = 'ULFRBD';
		const family = faces[stateData['CENTERS'].pieces.indexOf(faceIndex)];
		if (move.length === 1) {
			return family;
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
			this.homeOrientation = quat.clone().invert();
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
