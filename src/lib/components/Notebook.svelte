<script lang="ts">
	import { empty } from 'svelte/internal';
	import IngredientToken from './IngredientToken.svelte';
	import Potion from './Potion.svelte';

	export let mixes: [number, number, number][] = [];
</script>

<div class="book">
	<h1>Experiment Notebook</h1>
	{#if mixes.length > 0}
		{#each mixes as mix}
			<div class="row">
				<IngredientToken ingredient={mix[0]} /><span> + </span>
				<IngredientToken ingredient={mix[1]} /><span> = </span>
				<Potion potion={mix[2]} />
			</div>
		{/each}
	{:else}
		<div>Your notebook is empty. Mix some potions!</div>
	{/if}
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
	}
</style>
