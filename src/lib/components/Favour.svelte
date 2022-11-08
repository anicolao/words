<script lang="ts">
	import IconButton from '@smui/icon-button/src/IconButton.svelte';
	import { createEventDispatcher } from 'svelte';

	const fireEvent = createEventDispatcher();

	export let favour = -1;
	export let discard = false;

	function discardCard() {
		console.log('Discard card ', favour);
		fireEvent('discard');
	}
</script>

<img alt="favour {favour}" src="favour_{favour}.jpg" />
{#if discard}
	<IconButton class="material-icons" on:click={discardCard}>delete</IconButton>
{/if}

<style>
	img {
		width: 120px;
		border-radius: 5px;
		margin: 4px;
		box-shadow: 4px;
		box-shadow: rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, rgba(6, 24, 44, 0.65) 0px 4px 6px -1px,
			rgba(255, 255, 255, 0.08) 0px 1px 0px inset;
	}
</style>
