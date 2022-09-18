<script lang="ts">
	import { Content } from '@smui/card';
	import { page } from '$app/stores';
	import { store } from '$lib/store';
	import { goto } from '$app/navigation';
	import Button, { Label } from '@smui/button';
	import Cube from '$lib/components/Cube.svelte';
	import { get_roux_stages } from '$lib/third_party/onionhoney/Analyzer';

	function toArray(any: ArrayLike<unknown> | Iterable<unknown>) {
		if (any) return Array.from(any);
		return [];
	}
	const solveId = $page.params.slug;
	$: solve = $store.solves.solveIdToSolve[solveId];
	$: time = solve && solve.time / 10;
	$: moveCount = solve?.moves.filter(x => x.timestamp > 0).length + 1;
	$: console.log(solve);
	$: offset = -1; 
	$: scrambleArray = toArray(solve?.moves.filter(x => x.timestamp === 0).map(x => x.move)).slice(0, offset);
	$: scrambleString = scrambleArray.join(" ");
	$: solutionString = toArray(solve?.moves.map(x => x.move)).slice(scrambleArray.length).join(" ");

	$: stages = get_roux_stages(scrambleString, solutionString);

	function next() {
		console.log("navigate to timing");
		goto('/timer');
	}

	const translation = {
		"fb": "first block",
		"ss": "second square",
		"sp": "last pair",
		"cmll": "CMLL",
		"lse": "LSE",
	}
</script>

<Content>
	{#if solve}
		<h1>Time: {time}s</h1>
		<h1>Move Count: {moveCount}</h1>
		<p>Scramble: {scrambleString}</p>
		<p>Solution: {solutionString}</p>
		<p>If you click the "Tw" button on the player, you can then paste this breakdown
			over the provided solution and step through to see whether the solution breakpoints
			are correct.
		</p>
		{#each stages as stage}
		   <p>{stage.solution} // {translation[stage.stage]}: {stage.solution.length()} moves </p>
		{/each}
		<Cube scramble={scrambleString} solve={solutionString} controlPanel={'yes'}/>
		<Button on:click={next}>
			<Label>Next Scramble</Label>
			<i class="material-icons" aria-hidden="true">arrow_forward</i>
		</Button>
	{:else}
		<h1>Loading...</h1>
	{/if}
</Content>
