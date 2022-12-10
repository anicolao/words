<script lang="ts">
	import { store } from '$lib/store';
	import { update_grid, type Alchemicals, type Ingredients } from './alchemists';
	import { dispatchToTable } from './gameutil';
	import PotionToken from './PotionToken.svelte';

	export let mixes: [number, number, number][] = [];

	export let tableId = '';

	$: me = $store.auth.email || '';
	$: cstate = $store.alchemists.emailToPlayerState[me];
	$: color = (cstate && cstate.color) || 0;

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

	$: ingredientMarks = (cstate && cstate.grid) || [
		'         ',
		'         ',
		'         ',
		'         ',
		'         ',
		'         ',
		'         ',
		'         '
	];

	function basicMix(mix: [Ingredients, Ingredients, Alchemicals]) {
		return () => {
			const outcomes = [
				[true, false, true, false, true, false, true, false], // Blue Minuses
				[false, true, false, true, false, true, false, true], // Blue Pluses
				[false, true, true, false, true, false, true, false], // Green Minuses
				[true, false, false, true, false, true, false, true], // Green Pluses
				[true, false, false, true, true, false, true, false], // Red Minuses
				[false, true, true, false, false, true, false, true] // Red Pluses
			];
			const updates = outcomes[mix[2]];
			updates.forEach((doit, row) => {
				if (!doit) {
					dispatchToTable(tableId, update_grid({ player: me, row, column: mix[0], letter: 'X' }));
					dispatchToTable(tableId, update_grid({ player: me, row, column: mix[1], letter: 'X' }));
				}
			});
		};
	}
	function grid(row: number, ingredient: number) {
		return () => {
			console.log({ row, ingredient });
			const existing = ingredientMarks[ingredient][row];
			if (existing === ' ') {
				dispatchToTable(tableId, update_grid({ player: me, row, column: ingredient, letter: 'X' }));
			} else if (existing === 'X') {
				dispatchToTable(tableId, update_grid({ player: me, row, column: ingredient, letter: 'Y' }));
			} else {
				dispatchToTable(tableId, update_grid({ player: me, row, column: ingredient, letter: ' ' }));
			}
		};
	}
</script>

<div class="book">
	<h1>Experiment Grid</h1>
	<div>
		<div>
			{#each mixes as mix}
				{@const a = Math.max(mix[0], mix[1])}
				{@const r = Math.min(mix[0], mix[1])}
				<span
					style:top={ycoord(r, a)}
					style:left={xcoord(r, a)}
					class="entry"
					on:click={basicMix(mix)}
				>
					<PotionToken potion={mix[2]} />
				</span>
			{/each}
			<img class="pyramid" alt="Potion Pyramid" src="potion_table_{color}.png" />
		</div>
		<div class="center">
			<table center cellspacing="0">
				{#each [0, 1, 2, 3, 4, 5, 6, 7] as i}
					<tr>
						{#each ingredientMarks as marks, j}
							<td on:click={grid(i, j)}>{marks[i] === 'X' ? '❌' : marks[i] === 'Y' ? '✓' : ''}</td>
						{/each}
					</tr>
				{/each}
			</table>
			<img class="grid" alt="Deduction Grid" src="gridhd.jpg" />
		</div>
	</div>
</div>

<style>
	table {
		margin: 0;
		padding: 0;
		width: 91%;
		height: 100%;
		position: absolute;
		margin-left: 4%;
		margin-right: 5%;
	}
	tr {
		margin: 0;
		padding: 0;
	}
	td {
		margin: 0;
		padding: 0;
		width: 12.5%;
		text-align: right;
		padding-right: 0.4em;
	}
	.book {
		border: 2px solid brown;
		background-color: antiquewhite;
		padding: 1em;
		margin: 1em;
		line-height: 0;
	}

	.center {
		text-align: center;
	}
	.grid {
		width: 91%;
		margin: 0;
		margin-left: -1%;
		padding: 0;
	}
	.pyramid {
		width: 100%;
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
