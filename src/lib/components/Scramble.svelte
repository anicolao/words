<script lang="ts">
	import { Content } from '@smui/card';
	import { randomScrambleForEvent } from 'cubing/scramble';
	import 'cubing/twisty';
	import { onMount, onDestroy } from 'svelte';
	import { TwistyPlayer } from 'cubing/twisty';
	import { store } from '$lib/store';
	import { known_md, known_version, type CubeInfo } from '$lib/components/cubes';
	import { GANCube } from '$lib/bluetooth/gan/gan356i_v1';
	import { Alg, Move } from 'cubing/alg';
	import { experimentalAppendMove } from '$lib/cubing/alg/operation';
	import type { KPuzzle } from 'cubing/kpuzzle';
	import Pair from '$lib/components/Pair.svelte';
	import firebase from '$lib/firebase';
	import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
	import { goto } from '$app/navigation';
	import type { BluetoothPuzzle, MoveEvent } from 'cubing/dist/types/bluetooth';
	import { Spherical, Vector3, type Quaternion } from 'three';
	import { getServer } from '$lib/bluetooth/bluetooth';
	import { GANCubeV2, getDeviceKeyInfo } from '$lib/bluetooth/gan/gan356i_v2';

	export let origin = 'timer';
	let scramble = new Alg();
	let remaining = new Alg();

	async function saveNewScramble() {
		const newScramble = await randomScrambleForEvent('333');
		const setup = newScramble.toString();
		const storedScramble = { setup, creator: $store.auth.uid };
		addDoc(collection(firebase.firestore, 'scrambles'), {
			...storedScramble,
			timestamp: serverTimestamp()
		});
	}
	$: if ($store.auth.uid && $store.solves.unattempted.length === 0) {
		saveNewScramble();
	}
	const twistyPlayer: TwistyPlayer = new TwistyPlayer();
	let alg = new Alg();
	async function newScramble() {
		scramble = new Alg($store.solves.unattempted[0]);
		remaining = scramble;
		if (twistyPlayer) {
			alg = new Alg();
			twistyPlayer.experimentalModel.alg.set(alg);
		}
	}
	newScramble();

	async function insertTwisty(): Promise<void> {
		let contentElem = document.querySelector('#twisty-content');
		if (contentElem) {
			twistyPlayer.background = 'none';
			twistyPlayer.visualization = 'PG3D';
			twistyPlayer.controlPanel = 'none';
			twistyPlayer.backView = 'top-right';
			twistyPlayer.hintFacelets = 'none';
			twistyPlayer.cameraLatitudeLimit = 400;
			contentElem.appendChild(twistyPlayer);
		}
	}
	onMount(insertTwisty);
	onDestroy(() => {
		if (cube) {
			cube.unwatchMoves();
		}
	});

	let currentDevice: CubeInfo | undefined;
	let cube: GANCube | GANCubeV2 | undefined;
	let startWhenReady = false;
	let solving = false;
	let solution: { move: string; timestamp: number }[] = [];

	async function addMove(model: any, move: string) {
		alg = experimentalAppendMove(alg, new Move(move), {
			sameDirection: true,
			wideMoves333: true,
			sliceMoves333: true
		});
		processAlg(model);
	}
	async function processAlg(model: any) {
		let solutionMoves = Array.from(alg.childAlgNodes());
		solution = solution.slice(0, solutionMoves.length - 1);
		solution.push({
			move: solutionMoves[solutionMoves.length - 1].toString(),
			timestamp: rafTimer
		});

		let inverted = Array.from(alg.invert().childAlgNodes());
		inverted = inverted.concat(Array.from(new Alg(scramble).childAlgNodes()));
		remaining = new Alg(inverted).simplify({ collapseMoves: true, quantumMoveOrder: () => 4 });
		if (remaining.isIdentical(new Alg()) && !solving) {
			startWhenReady = true;
		} else if (solving) {
		} else if (startWhenReady) {
			solveOffset = solutionMoves.length;
			solving = true;
			cube?.setTrackingRotations(true);
			startWhenReady = false;
		}

		if (solving) {
			const kp: KPuzzle = await twistyPlayer.experimentalModel.kpuzzle.get();
			const check = kp.startState().applyAlg(alg);
			isSolved = check.experimentalIsSolved({
				ignorePuzzleOrientation: true,
				ignoreCenterOrientation: true
			});
		}

		// defer update until after transforms
		setTimeout(async () => {
			model.timestampRequest.set('end');
			const algNodes = algArray;
			let lastMove = algNodes[algNodes.length - 1] as Move;
			if (!lastMove) lastMove = new Move('');
			else if (lastMove.amount > 1) {
				lastMove = lastMove.modified({ amount: 1 });
			} else if (lastMove.amount < -1) {
				lastMove = lastMove.modified({ amount: -1 });
			}
			model.catchUpMove.set({
				move: lastMove,
				amount: 0
			});
			model.alg.set(alg);
		}, 100);
	}
	$: if ($store.cubes.connectedDevice !== currentDevice) {
		async function useCurrentDevice() {
			currentDevice = $store.cubes.connectedDevice;
			if (currentDevice && currentDevice[0].slice(0, 6) !== 'legacy') {
				const server = await getServer({ id: currentDevice[0] });
				const services: BluetoothRemoteGATTService[] = await server.getPrimaryServices();
				if (services[0].uuid === '6e400001-b5a3-f393-e0a9-e50e24dc4179') {
					cube = new GANCubeV2(
						{ id: currentDevice[0] },
						$store.cubes.cubeIdToMDMap[currentDevice[0]]
					);
				} else {
					cube = new GANCube({ id: currentDevice[0] });
				}

				const version = await cube.getVersionAsString();
				store.dispatch(known_version({ id: currentDevice[0], version }));
				const model = twistyPlayer.experimentalModel;
				const kp: KPuzzle = await twistyPlayer.experimentalModel.kpuzzle.get();
				const ksNew = kp.startState();
				let spin = 0;
				async function orientationCallback(q: Quaternion) {
					//console.log({ q });
					const orbit =
						await twistyPlayer.experimentalModel.twistySceneModel.orbitCoordinates.get();
					const lat = Math.PI / 8; //(90 - orbit.latitude) / 180 * Math.PI;
					const lon = -Math.PI / 4; //(orbit.longitude) / 180 * Math.PI;
					const sphereCoords = new Spherical(orbit.distance, lat, lon);
					sphereCoords.makeSafe();
					const v3 = new Vector3(1, 1, 1);
					//v3.setFromSpherical(sphereCoords);
					v3.applyQuaternion(q.clone().invert());
					sphereCoords.setFromVector3(v3);
					const latitude = Math.PI / 8; //sphereCoords.phi * 180 / Math.PI;
					const longitude = spin / 100; //sphereCoords.theta * 180 / Math.PI;
					spin += 1;
					spin %= 3;
					const ori = {
						...orbit,
						distance: 6 + spin / 100 //orbit.distance
					};
					//console.log(ori)
					twistyPlayer.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set(ori);
					const obj3d = await twistyPlayer.experimentalCurrentThreeJSPuzzleObject();
					obj3d.setRotationFromQuaternion(q.clone());
				}
				cube.watchMoves(
					(move: number) => {
						if (cube) {
							const face = cube.colorToFaceMove(move, ksNew.applyAlg(alg).stateData);
							addMove(model, face);
						}
					},
					() => {},
					(data: number[]) => {
						rawData.push(data);
						rawData = rawData.slice(-30);
					}
				);
			} else if (currentDevice) {
				console.log('Legacy bluetooth path enabled for ', currentDevice);
				const cube = (globalThis as any).legacyCubes[currentDevice[0]] as BluetoothPuzzle;
				const model = twistyPlayer.experimentalModel;
				cube.addAlgLeafListener((e: MoveEvent) => {
					const move = new Move(e.latestAlgLeaf.toString());
					alg = experimentalAppendMove(alg, move);
					processAlg(model);
				});
			}
		}
		useCurrentDevice();
	}

	let isSolved = false;
	let isStored = false;
	let solveOffset = 0;

	$: remainingNodes = Array.from(remaining.childAlgNodes());
	$: algView = Array.from(scramble.childAlgNodes()).map((x, i, a) => {
		let state = 'remaining';
		let node = x;
		if (i < a.length - remainingNodes.length) {
			state = 'executed';
		}
		if (i == a.length - remainingNodes.length) {
			let firstNode = x as Move;
			let comparisonNode = remainingNodes[0] as Move;
			if (firstNode.family == comparisonNode.family) {
				if (firstNode.amount == comparisonNode.amount) state = 'first';
				else state = 'partial';
			} else {
				state = 'correction';
				node = comparisonNode;
			}
		}
		return { node, state };
	});
	$: algArray = Array.from(alg.childAlgNodes());
	$: moveCount = algArray.length - solveOffset + 1;

	let rafTimer = 0;
	let rafStart = 0;
	$: if (solving && !isSolved && rafTimer > -1) {
		requestAnimationFrame((rafTime) => {
			if (rafStart === 0) {
				rafStart = rafTime;
			}
			rafTimer = rafTime - rafStart;
		});
	}
	async function storeScramble() {
		isStored = true;
		const scrambleString = scramble.toString();
		const scrambleId = $store.solves.scrambleToId[scrambleString];
		const storedSolve = {
			scrambleId,
			scramble: scrambleString,
			solveOffset,
			moves: solution,
			time: timerInTenths,
			creator: $store.auth.uid
		};
		const doc = await addDoc(collection(firebase.firestore, 'scrambles', scrambleId, 'solves'), {
			...storedSolve,
			timestamp: serverTimestamp()
		});
		goto('history_edu/' + doc.id + `?from=${origin}`);
	}
	$: if (isSolved) {
		if (!isStored) {
			storeScramble();
		}
	}

	$: timerInTenths = Math.round(rafTimer / 100);
	$: timerSecs = Math.floor(timerInTenths / 10);
	$: timerTenths = timerInTenths % 10;

	let movesRequired = cube?.numEncryptionMovesRequired() || 0;
	let rawData: number[][] = [];
	$: if (rawData || casesDone >= 0) {
		movesRequired = cube?.numEncryptionMovesRequired() || 0;
	}

	let lastUpdate = new Date();
	let casesDone = 0;
	let totalCases = 0;
	function progress(cases: number, total: number) {
		const now = new Date();
		const delta = now.getTime() - lastUpdate.getTime();
		if (delta > 500 || cases === total) {
			lastUpdate = now;
			casesDone = cases;
			totalCases = total;
		}
	}
	let ready = cube?.isReady(progress);
	$: if (casesDone === totalCases) {
		ready = cube?.isReady(progress);
		if (casesDone > 0) {
			newScramble();
			async function recordDeviceKey() {
				if (currentDevice) {
					const hexString = [...new Uint8Array(await getDeviceKeyInfo({ id: currentDevice[0] }))]
						.map((b) => {
							return b.toString(16).padStart(2, '0');
						})
						.join(' ');
					firebase.dispatchDoc(
						currentDevice[0],
						known_md({ id: currentDevice[0], data: hexString })
					);
				}
			}
			recordDeviceKey();
		}
	}
</script>

<div class="content-row">
	<div class="center-content">
		<Content id="main-content">
			<div class="center-content">
				{#if !currentDevice}
					<Pair />
				{:else if ready}
					{#if startWhenReady}
						<p class="tenths">Start when ready!</p>
					{:else if solving}
						{#if origin === 'trending_down'}
							<p>
								<span class="seconds">{moveCount}</span>
							</p>
						{:else}
							<p>
								<span class="seconds">{timerSecs}.</span><span class="tenths">{timerTenths}</span>
							</p>
						{/if}
					{:else}
						<ul>
							{#each algView as { node, state }}
								<li class={state}>{node}</li>
							{/each}
						</ul>
					{/if}
				{:else}
					{#if movesRequired > 0}
						<p>Please twist any face {movesRequired} more times.</p>
					{:else}
						<p>
							Optimizing communications: {Math.round((casesDone / totalCases) * 100)}% done ({casesDone}/{totalCases})
						</p>
					{/if}
					<table>
						{#each rawData as row}
							<tr>
								{#each row as col}
									<td>{col.toString(16).padStart(2, '0')}</td>
								{/each}
							</tr>
						{/each}
					</table>
				{/if}
				<div class="center-content" id="twisty-content" />
			</div>
		</Content>
	</div>
</div>

<style>
	.content-row {
		display: flex;
		flex-direction: row;
	}
	.executed {
		color: grey;
	}

	.seconds {
		font-size: 120px;
		font-family: Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
	.tenths {
		font-size: 60px;
		font-family: Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	.first {
		background-color: yellow;
		border-radius: 0.2em;
		border: 1px solid black;
		content: 'X';
	}

	.partial {
		background-color: lime;
		border-radius: 0.2em;
		border: 1px solid black;
		content: 'X';
	}

	.correction {
		background-color: orange;
		border-radius: 0.2em;
		border: 1px solid black;
		content: 'X';
	}

	.remaining {
		color: green;
	}

	ul {
		display: inline-block;
		margin-block-end: 0;
		margin-block-start: 0;
		padding-inline-start: 0;
		text-align: center;
		padding-top: 3em;
		padding-bottom: 2em;
	}
	li {
		font-family: sans-serif;
		font-size: large;
		display: inline-block;
		padding-top: 0.2em;
		padding-bottom: 0.2em;
		padding: 0.4em;
	}

	.app-content {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.center-content {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		flex-direction: column;
	}

	div {
		width: 100%;
	}

	#twisty-content {
		padding-bottom: 120px;
	}
</style>
