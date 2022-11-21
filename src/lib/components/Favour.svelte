<script lang="ts">
	import IconButton from '@smui/icon-button/src/IconButton.svelte';
	import { createEventDispatcher } from 'svelte';

	const fireEvent = createEventDispatcher();

	export let favour = -1;
	export let discard = false;
	export let glowing = false;

	function discardCard() {
		console.log('Discard card ', favour);
		fireEvent('discard');
	}

	function playCard() {
		if (glowing) {
			fireEvent('play');
		}
	}
</script>

{#if favour === -1}
	<img alt="favour {favour}" src="favour_back.jpg" />
{:else}
	<img class:glow={glowing} alt="favour {favour}" src="favour_{favour}.jpg" on:click={playCard} />
{/if}
{#if discard}
	<IconButton class="material-icons" on:click={discardCard}>delete</IconButton>
{/if}

<style>
	img {
		width: 100%;
		border-radius: 5px;
		--width: 120px;
		--margin: 4px;
		box-shadow: 4px;
		box-shadow: rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, rgba(6, 24, 44, 0.65) 0px 4px 6px -1px,
			rgba(255, 255, 255, 0.08) 0px 1px 0px inset;
	}

	.glow {
		box-shadow: rgba(0, 255, 0, 0.4) 0px 0px 0px 2px, rgba(0, 255, 0, 0.65) 0px 4px 6px -1px,
			rgba(255, 255, 255, 0.08) 0px 1px 0px inset;
		box-shadow: rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, rgba(6, 255, 4, 0.65) 0px 0px 4px 4px,
			rgba(0, 255, 0, 0.08) 0px 1px 0px inset;
	}
</style>
