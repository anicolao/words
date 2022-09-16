<script lang="ts">
	import { Content } from '@smui/card';
	import { randomScrambleForEvent } from 'cubing/scramble';
	import 'cubing/twisty';
	import { onMount, onDestroy } from 'svelte';
	import { TwistyPlayer } from 'cubing/twisty';
	import { store } from '$lib/store';
	import { known_version, type CubeInfo } from '$lib/components/cubes';
	import { GANCube } from '$lib/bluetooth/gan/gan356i_v1';
	import { Alg, Move } from 'cubing/alg';
	import { experimentalAppendMove } from '$lib/cubing/alg/operation';
	import type { KPuzzle } from 'cubing/kpuzzle';
	import Pair from '$lib/components/Pair.svelte';
	import firebase from '$lib/firebase';
	import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
	import { goto } from '$app/navigation';

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
	async function newScramble() {
		scramble = new Alg($store.solves.unattempted[0]);
		remaining = scramble;
	}
	newScramble();

	const twistyPlayer: TwistyPlayer = new TwistyPlayer();
	onMount(async () => {
		let contentElem = document.querySelector('#twisty-content');
		if (contentElem) {
			twistyPlayer.background = 'none';
			twistyPlayer.visualization = 'PG3D';
			twistyPlayer.controlPanel = 'none';
			twistyPlayer.backView = 'top-right';
			twistyPlayer.hintFacelets = 'none';
			contentElem.appendChild(twistyPlayer);
		}
	});
	onDestroy(() => {
		if (cube) {
			cube.unwatchMoves();
		}
	});

	let currentDevice: CubeInfo | undefined;
	let cube: GANCube | undefined;
	let alg = new Alg();
	let startWhenReady = false;
	let solving = false;
	let solution: { move: string; timestamp: number }[] = [];

	async function addMove(model: any, move: string) {
		alg = experimentalAppendMove(alg, new Move(move), {
			sameDirection: true,
			wideMoves333: true,
			sliceMoves333: true
		});
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
			const algNodes = Array.from(alg.childAlgNodes());
			let lastMove = algNodes[algNodes.length - 1] as Move;
			if (!lastMove) lastMove = new Move(move);
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
			if (currentDevice) {
				cube = new GANCube({ id: currentDevice[0] });
				const version = await cube.getVersionAsString();
				store.dispatch(known_version({id: currentDevice[0], version }));
				const model = twistyPlayer.experimentalModel;
				const kp: KPuzzle = await twistyPlayer.experimentalModel.kpuzzle.get();
				const ksNew = kp.startState();
				cube.watchMoves((move: number) => {
					const face = GANCube.colorToFaceMove(move, ksNew.applyAlg(alg).stateData);
					addMove(model, face);
				});
			}
		}
		useCurrentDevice();
	}

	let isSolved = false;
	let isStored = false;

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
			moves: solution,
			time: timerInTenths,
			creator: $store.auth.uid
		};
		const doc = await addDoc(collection(firebase.firestore, 'scrambles', scrambleId, 'solves'), {
			...storedSolve,
			timestamp: serverTimestamp()
		});
		goto('history_edu/' + doc.id);
	}
	$: if (isSolved) {
		if (!isStored) {
			storeScramble();
		}
	}

	$: timerInTenths = Math.round(rafTimer / 100);
	$: timerSecs = Math.floor(timerInTenths / 10);
	$: timerTenths = timerInTenths % 10;
</script>

<div class="content-row">
	<div class="center-content">
		<Content id="main-content">
			<div class="center-content">
				{#if !currentDevice}
					<Pair />
				{/if}
				{#if startWhenReady}
					<p class="tenths">Start when ready!</p>
				{:else if solving}
					<p>
						<span class="seconds">{timerSecs}.</span><span class="tenths">{timerTenths}</span>
					</p>
				{:else}
					<ul>
						{#each algView as { node, state }}
							<li class={state}>{node}</li>
						{/each}
					</ul>
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
