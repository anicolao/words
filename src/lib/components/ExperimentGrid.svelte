<script lang="ts">
	import IngredientToken from './IngredientToken.svelte';
	import Potion from './Potion.svelte';
	import { store } from '$lib/store';
	import PotionToken from './PotionToken.svelte';
	import { MixesTable } from './alchemists';

	export let mixes: [number, number, number][] = [];

	const me = $store.auth.email || '';
	$: cstate = $store.alchemists.emailToPlayerState[me];
	const color = (cstate && cstate.color) || 0;

	function mixIngredients(i0: number, i1: number) {
		const alchemicalA = $store.alchemists.ingredientToAlchemical[i0];
		const alchemicalB = $store.alchemists.ingredientToAlchemical[i1];
		const a0 = Math.min(alchemicalA, alchemicalB);
		const a1 = Math.max(alchemicalA, alchemicalB);
		return MixesTable[a0 * 10 + a1];
	}
	const xorigin = 11;
	const yorigin = 88;
	const xoffset = (100 - xorigin * 2) / 7 + 0.3;
	const yoffset = (100 - xorigin * 2) / 7 + 0.9;
	function ycoord(r: number, a: number) {
		const ret = yorigin - yoffset * a + yoffset * r;
		return `${ret}%`;
	}
	function xcoord(r: number, a: number) {
		const ret = xorigin + (xoffset / 2) * r + (xoffset / 2) * (a - 1);
		return `${ret}%`;
	}
</script>

<div class="book">
	<h1>Experiment Grid</h1>
	<!--

	<div>
		{#each [0, 1, 2, 3, 4, 5, 6, 7] as r}
			{#each [0, 1, 2, 3, 4, 5, 6, 7] as a}
				{#if a > r}
					<span style:top={ycoord(r, a)} style:left={xcoord(r, a)} class="entry">
						<PotionToken potion={mixIngredients(r, a)} />
					</span>
				{/if}
			{/each}
		{/each}
		<img alt="Potion Pyramid" src="potion_table_{color}.png" />
	</div>
 -->
	<div>
		{#each mixes as mix}
			{@const a = Math.max(mix[0], mix[1])}
			{@const r = Math.min(mix[0], mix[1])}
			<span style:top={ycoord(r, a)} style:left={xcoord(r, a)} class="entry">
				<PotionToken potion={mixIngredients(r, a)} />
			</span>
		{/each}
		<img alt="Potion Pyramid" src="potion_table_{color}.png" />
	</div>
</div>

<style>
	.book {
		border: 2px solid brown;
		background-color: antiquewhite;
		padding: 1em;
		margin: 1em;
	}
	.row {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 40px;
	}
	span {
		font-size: 30px;
		padding: 5px;
	}

	div {
		font-family: Roboto, sans-serif;
		position: relative;
		max-width: 567px;
	}

	.entry {
		display: inline-block;
		position: absolute;
		width: 9%;
		margin: 0;
		padding: 0;
	}
</style>
