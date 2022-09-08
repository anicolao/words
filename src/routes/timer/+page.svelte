<script lang="ts">
	import { Content } from '@smui/card';
	import { randomScrambleForEvent } from 'cubing/scramble';
	import 'cubing/twisty';
	import { onMount } from 'svelte';
	import { TwistyPlayer } from 'cubing/twisty';

	let scramble = randomScrambleForEvent('333');

	onMount(async () => {
		let contentElem = document.querySelector('#main-content');
		if (contentElem) {
			const twistyPlayer: TwistyPlayer = new TwistyPlayer();
			twistyPlayer.background = 'none';
			twistyPlayer.visualization = 'PG3D';
			twistyPlayer.controlPanel = 'none';
			twistyPlayer.backView = 'top-right';
			twistyPlayer.hintFacelets = 'none';
			contentElem.appendChild(twistyPlayer);
		}
	});
</script>

<Content id="main-content">
	<p>{scramble}</p>
</Content>
