<script lang="ts">
	import { Alg } from 'cubing/alg';
	import { TwistyPlayer } from 'cubing/twisty';
	import { onMount } from 'svelte';

	const twistyPlayer: TwistyPlayer = new TwistyPlayer();
	export let controlPanel = 'none';
	export let scramble = '';
	export let solve = '';
	export let playHead = 0;
	export let stickering = '';

	$: if (stickering) {
		console.log("RESET STICKERING to: ", stickering);
		/* this doesn't draw well at all.
		if (stickering === 'cmll') {
			twistyPlayer.experimentalStickering = 'CMLL';
		} else if (stickering === 'lse') {
			twistyPlayer.experimentalStickering = 'L6E';
		} else {
			twistyPlayer.experimentalStickering = 'full';
		}
		*/
	} else {
		console.log("CLEAR STICKERS");
		twistyPlayer.experimentalStickering = 'full';
	}

	$: if (scramble) {
		twistyPlayer.experimentalSetupAlg = scramble;
	}
	$: if (solve) {
		twistyPlayer.alg = solve;
	}

	$: if (playHead >= 0) {
		const p = async () => {
			console.log({ playHead });
			twistyPlayer.pause();
			const timestampPromise = (async (): Promise<any> => {
				const indexer = await twistyPlayer.experimentalModel.indexer.get();
				const offset = 250;
				return (indexer.indexToMoveStartTimestamp(playHead) ?? -offset) + offset;
			})();
			twistyPlayer.experimentalModel.timestampRequest.set(
				await timestampPromise // TODO
			);
		};
		p();
	}
	onMount(async () => {
		let contentElem = document.querySelector('#twisty-content');
		if (contentElem) {
			twistyPlayer.background = 'none';
			twistyPlayer.visualization = 'PG3D';
			if (controlPanel === 'none') {
				twistyPlayer.controlPanel = 'none';
			}
			const model = twistyPlayer.experimentalModel;
			twistyPlayer.experimentalSetupAlg = scramble;
			twistyPlayer.alg = solve;
			twistyPlayer.tempoScale = 4;
			twistyPlayer.backView = 'top-right';
			twistyPlayer.hintFacelets = 'none';
			contentElem.appendChild(twistyPlayer);
		}
	});
</script>

<div id="twisty-content" />

<style>
	div {
		text-align: -webkit-center;
	}
</style>
