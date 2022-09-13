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

	let scramble = 'Scrambling...';
	let remaining = 'Scrambling...';
	async function newScramble() {
		const s = await randomScrambleForEvent('333');
		scramble = s.toString();
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
		console.log("Catted: ", inverted.toString());
		remaining = new Alg(inverted).simplify().toString();
		console.log(`remaining: [${remaining}]`);
		if (remaining.length === 0 && !solving) {
			startWhenReady = true;
		} else if (solving) {
			ended = new Date();
		} else if (startWhenReady) {
			solving = true;
			started = new Date();
			ended = new Date();
			startWhenReady = false;
		}

		// defer update until after transforms
		setTimeout(() => {
			model.timestampRequest.set('end');
			const algNodes = Array.from(alg.childAlgNodes());
			let lastMove = (algNodes[algNodes.length - 1] as Move);
			if (!lastMove) lastMove = new Move(move);
			else if (lastMove.amount > 1) {
				lastMove = lastMove.modified({amount: 1});
			} else if (lastMove.amount < -1) {
				lastMove = lastMove.modified({amount: -1});
			}
			model.catchUpMove.set({
				move: lastMove,
				amount: 0
			});
			viewerAlg = alg.toString();
			console.log('vA: ', viewerAlg);
			model.alg.set(alg);
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

	let viewerAlg = '';
</script>

<Content id="main-content">
	{#if currentDevice}
		<p>Cube: {currentDevice[1]} v{version}</p>
	{/if}
	{#if startWhenReady}
	<p>Start when Ready!</p>
	{:else if solving}
	<p>Time: {ended.getTime() - started.getTime()}</p>
	{:else}
	<p>{scramble}</p>
	<p>{remaining}</p>
	<p>{viewerAlg}</p>
	{/if}
</Content>
