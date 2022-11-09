<script lang="ts">
	import { store } from '$lib/store';
	export let email = '';
	export let scaleX = (x) => x;
	let index = -1;
	$: if (email) {
		index = $store.alchemists.players.indexOf(email);
	}
</script>

{#if index >= 0}
	<img
		alt="player {index}"
		src="flask_{index}.png"
		style="width: {scaleX(30)}px; margin-top: {scaleX(-22)}px;"
	/>
{/if}
