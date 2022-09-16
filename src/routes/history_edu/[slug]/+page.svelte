<script lang="ts">
	import { Content } from '@smui/card';
	import { page } from '$app/stores';
	import { store } from '$lib/store';
	import { goto } from '$app/navigation';
	import Button, { Label } from '@smui/button';

	const solveId = $page.params.slug;
	$: solve = $store.solves.solveIdToSolve[solveId];
	$: time = solve && solve.time / 10;
	$: moveCount = solve?.moves.filter(x => x.timestamp > 0).length + 1;
	$: console.log(solve);

	function next() {
		console.log("navigate to timing");
		goto('/timer');
	}
</script>

<Content>
	{#if solve}
		<h1>Time: {time}s</h1>
		<h1>Move Count: {moveCount}</h1>
		<Button on:click={next}>
			<Label>Next Scramble</Label>
			<i class="material-icons" aria-hidden="true">arrow_forward</i>
		</Button>
	{:else}
		<h1>Loading...</h1>
	{/if}
</Content>
