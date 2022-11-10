<script lang="ts">
	import { store } from '$lib/store';
	export let email = '';
	export let scaleX = (x: number) => x;
	let index = -1;
	$: if (email) {
		index = $store.alchemists.emailToPlayerState[email].color;
	}
</script>

{#if index >= 0}
	<img
		alt="action cube {index}"
		src="cube_{index}.png"
		style="width: {scaleX(20)}px; postion: absolute; top: 0; left: 0;"
	/>
{/if}
