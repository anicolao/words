<script lang="ts">
	import { Content } from '@smui/card';
	import { store } from '$lib/store';
	import Button, { Label } from '@smui/button';
	import { goto } from '$app/navigation';

	let averages: {[key: number]: number} = {};
	function computeAoN(n: number) {
		const nSolves = allSolves.slice(0, n).sort();
		const discard = Math.ceil(0.1*n);
		const aSolves = nSolves.slice(discard, -discard);
		let totalTime = 0;
		aSolves.map(x => totalTime += x.time);
		averages[n] = totalTime / aSolves.length;
	}
	$: allSolves = $store.solves.allSolveIds.map(id => $store.solves.solveIdToSolve[id]).reverse();
	$: if (allSolves.length >= 5) {
		computeAoN(5);
	}
	$: if (allSolves.length >= 12) {
		computeAoN(12);
	}
	$: if (allSolves.length >= 100) {
		computeAoN(100);
	}

	function averageKeys(): number[] {
		return Object.keys(averages).map(x => Number(x));
	}
</script>

<Content>
	<table class="ao" cellspacing="0">
		{#each averageKeys() as key}
		<tr><td>Ao{key}</td><td>{Math.round(averages[key])/10}</td></tr>
		{/each}
	</table>
	<table cellspacing="0">
		{#each allSolves as solve, i}
			<tr class={i%2 ? "odd" : "even"} on:click={() => goto('history_edu/' + solve.solveId + '?from=history_edu')}
				><td>{allSolves.length - i}</td><td>{solve.time / 10}</td><td>{solve.moves.length}</td>
				<td>
					<Button on:click={() => goto('history_edu/' + solve.solveId)}>
						<Label>Analysis</Label>
						<i class="material-icons" aria-hidden="true">arrow_forward</i>
					</Button></td
				>
			</tr>
		{/each}
	</table>
</Content>

<style>
	tr:first-child td {
		border-top: 1px solid #808080;
	}
	td:first-child {
		border-left: 1px solid #808080;
	}
	td {
		border-right: 1px solid #808080;
		border-bottom: 1px solid #808080;
		margin: 0;
		padding-left: 1em;
		padding-right: 1em;
	}
	.ao {
		margin-bottom: 2em;
	}
	.ao td {
		padding-bottom: 0.5em;
		padding-top: 0.5em;
	}
	.odd td {
		background-color: #f0f0f0;
	}
	tr:hover td {
		background-color: #ffffa0;
	}
</style>
