<script lang="ts">
	import { Content } from '@smui/card';
	import { randomScrambleForEvent } from 'cubing/scramble';
	import 'cubing/twisty';
	import { onMount, onDestroy } from 'svelte';
	import { TreeAlgIndexer, TwistyAlgEditor, TwistyPlayer } from 'cubing/twisty';
	import { store } from '$lib/store';
	import type { CubeInfo } from '$lib/components/cubes';
	import { GANCube } from '$lib/bluetooth/gan/gan356i_v1';
	import { Alg, Move } from 'cubing/alg';
	import { experimentalAppendMove } from '$lib/cubing/alg/operation';
	import type { KPuzzle } from 'cubing/kpuzzle';
	import { startAfter } from 'firebase/firestore';

	let scramble = new Alg();
	let remaining = new Alg();
	async function newScramble() {
		scramble = await randomScrambleForEvent('333');
		remaining = scramble;
	}
	newScramble();

	const twistyPlayer: TwistyPlayer = new TwistyPlayer();
	onMount(async () => {
		let contentElem = document.querySelector('#main-content');
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

	let moveCount = 0;
	let version = '_unknown';
	let currentDevice: CubeInfo | undefined;
	let cube: GANCube | undefined;
	let alg = new Alg();
	let startWhenReady = false;
	let solving = false;
	let started = new Date();
	let ended = new Date();

	async function addMove(model: any, move: string) {
		alg = experimentalAppendMove(alg, new Move(move), {
			sameDirection: true,
			wideMoves333: true,
			sliceMoves333: true
		});
		console.log(alg);
		let inverted = Array.from(alg.invert().childAlgNodes());
		inverted = inverted.concat(Array.from(new Alg(scramble).childAlgNodes()));
		remaining = new Alg(inverted).simplify({ collapseMoves: true, quantumMoveOrder: () => 4 });
		console.log(`remaining: [${remaining}]`);
		if (remaining.isIdentical(new Alg()) && !solving) {
			startWhenReady = true;
		} else if (solving) {
			ended = new Date();
		} else if (startWhenReady) {
			solving = true;
			cube?.setTrackingRotations(true);
			started = new Date();
			ended = new Date();
			startWhenReady = false;
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
			viewerAlg = alg;
			model.alg.set(alg);
			const state = await model.currentState.get();
			isSolved = state.experimentalIsSolved({
				ignorePuzzleOrientation: true,
				ignoreCenterOrientation: true
			});
		}, 100);
	}
	$: if ($store.cubes.connectedDevice !== currentDevice) {
		async function useCurrentDevice() {
			currentDevice = $store.cubes.connectedDevice;
			if (currentDevice) {
				cube = new GANCube({ id: currentDevice[0] });
				version = await cube.getVersionAsString();
				const model = twistyPlayer.experimentalModel;
				const kstate = await model.currentState.get();
				const kp: KPuzzle = await twistyPlayer.experimentalModel.kpuzzle.get();
				const ksNew = kp.startState();
				cube.watchMoves((move: number) => {
					moveCount++;
					const face = GANCube.colorToFaceMove(move, ksNew.applyAlg(alg).stateData);
					addMove(model, face);
				});
			}
		}
		useCurrentDevice();
	}

	let viewerAlg = new Alg();
	let isSolved = true;

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
				if (firstNode.amount == comparisonNode.amount)
					state = 'first';
				else
					state = 'partial';
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
			rafTimer = (rafTime - rafStart);
		});
	}
	$: timerInTenths = Math.round((rafTimer)/100);
	$: timerSecs = Math.floor(timerInTenths/10);
	$: timerTenths = timerInTenths%10;
</script>

<Content id="main-content">
	{#if currentDevice}
		<p>Cube: {currentDevice[1]} v{version}</p>
	{/if}
	{#if startWhenReady}
	<p>Start when Ready!</p>
	{:else if solving}
		<p>Time: {ended.getTime() - started.getTime()}</p>
		<p>Timer: <span class="seconds">{timerSecs}</span>.<span class="tenths">{timerTenths}</span> </p>
		<p>{isSolved}</p>
	{:else}
		<ul>
			{#each algView as { node, state }}
				<li class={state}>{node}</li>
			{/each}
		</ul>
		<p>{isSolved}</p>
	{/if}
</Content>

<style>
	.executed {
		color: grey;
	}

	.seconds {
		font-size: large;
	}
	.tenths {
		font-size: medium;
	}

	.first {
		background-color: yellow;
		border-radius: 0.2em;
		border: 1px solid black;
		content: "X";
	}

	.partial {
		background-color: lime;
		border-radius: 0.2em;
		border: 1px solid black;
		content: "X";
	}

	.correction {
		background-color: orange;
		border-radius: 0.2em;
		border: 1px solid black;
		content: "X";
	}

	.remaining {
		color: green;
	}

	ul {
		display: inline-block;
		margin-block-end: 0;
		margin-block-start: 0;
		padding-inline-start: 0;
	}
	li {
		font-family: sans-serif;
		font-size: large;
		display: inline-block;
		padding-top: 0.2em;
		padding-bottom: 0.2em;
		padding: 0.4em;
	}
</style>
