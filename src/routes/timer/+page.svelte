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

	let scramble = 'Scrambling...';
	async function newScramble() {
		const s = await randomScrambleForEvent('333');
		scramble = s.toString();
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
	})

	let moveCount = 0;
	let version = '_unknown';
	let currentDevice: CubeInfo | undefined;
	let cube: GANCube | undefined;
	let alg = new Alg();
	async function addMove(model: any, move: string) {
		const newAlg = experimentalAppendMove(alg, new Move(move), {
			sameDirection: true,
			wideMoves333: true,
			sliceMoves333: true
		});
		model.timestampRequest.set("end");
		model.catchUpMove.set({
			move: new Move(move),
			amount: 0
		});
		model.alg.set(newAlg);
		alg = newAlg;
		viewerAlg = newAlg.toString();
		console.log("vA: ", viewerAlg);
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
	<p>{scramble}</p>
	<p>{viewerAlg}</p>
</Content>
