<script lang="ts">
	import { Content } from '@smui/card';
	import { page } from '$app/stores';
	import { store } from '$lib/store';
	import { goto } from '$app/navigation';
	import Button, { Label } from '@smui/button';
	import Cube from '$lib/components/Cube.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import { get_roux_stages } from '$lib/third_party/onionhoney/Analyzer';

	function toArray(any: ArrayLike<unknown> | Iterable<unknown>) {
		if (any) return Array.from(any);
		return [];
	}
	const solveId = $page.params.slug;
	const sourcePage = $page.url.searchParams.get('from') || 'timer';
	$: solve = $store.solves.solveIdToSolve[solveId];
	$: time = solve && solve.time / 10;
	$: moveCount = solve?.moves.filter((x) => x.timestamp > 0).length + 1;
	$: console.log(solve);
	$: offset = -1;
	$: scrambleArray = toArray(
		solve?.moves.filter((x) => x.timestamp === 0).map((x) => x.move)
	).slice(0, offset);
	$: scrambleString = scrambleArray.join(' ');
	$: timestamps = solve?.moves.map((x) => x.timestamp);
	$: solutionString = toArray(solve?.moves.map((x) => x.move))
		.slice(scrambleArray.length)
		.join(' ');

	$: stages = get_roux_stages(scrambleString, solutionString);

	function next() {
		console.log('navigate to ', sourcePage);
		goto('/' + sourcePage);
	}

	const translation = {
		fb: 'first block',
		ss: 'second square',
		sp: 'last pair',
		cmll: 'CMLL',
		lse: 'LSE'
	};

	const headings = {
		trending_down: 'Moves by stage',
		timer: 'Times by stage',
		history_edu: 'Times by stage'
	};
	const yAxisLabels = {
		trending_down: ' moves',
		timer: ' seconds',
		history_edu: ' seconds'
	};
	$: stageKeys = Object.keys(stages);
	$: solveData = [];
	$: {
		console.log("conpute stage data", timestamps)
		let startTimeOffset = scrambleArray.length;
		stages.forEach((s) => {
			let endOffset = startTimeOffset+s.solution.length();
			console.log(s.stage, " from ", startTimeOffset, " to ", endOffset);
			let yValue = s.solution.length();
			if (sourcePage !== 'trending_down') {
				yValue = Math.round((timestamps[endOffset-1] - timestamps[startTimeOffset-1])/100)/10;
				console.log({ yValue })
			}
			solveData.push({ xValue: translation[s.stage], yValue });
			startTimeOffset = endOffset;
		});
		console.log({ stages, solveData });
	}
	$: maxY = solveData
		.map((e) => e.yValue)
		.sort((a, b) => Number(a) - Number(b))
		.slice(-1)[0];
	$: numTicks = Math.trunc(maxY / 5);
	$: yTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].slice(0, numTicks + 2);
	$: if (yTicks) { 
	let tmaxY = solveData
		.map((e) => e.yValue)
		.sort((a, b) => Number(a) - Number(b))
		console.log({ yTicks, maxY, numTicks, tmaxY }) }
	$: heading = headings[sourcePage];
	$: axisLabel = yAxisLabels[sourcePage];
</script>

<Content>
	{#if solve}
		{#if sourcePage !== 'trending_down'}
			<h1>Time: {time}s</h1>
		{/if}
		{#if sourcePage !== 'timer'}
			<h1>Time: {time}s</h1>
			<h1>Move Count: {moveCount}</h1>
		{/if}
		<p>Scramble: {scrambleString}</p>
		<p>Solution: {solutionString}</p>
		<p>
			If you click the "Tw" button on the player, you can then paste this breakdown over the
			provided solution and step through to see whether the solution breakpoints are correct.
		</p>
		{#each stages as stage}
			<p>
				{stage.solution} // {translation[stage.stage]}: {stage.solution.length()}
			</p>
		{/each}
		<BarChart points={solveData} xTicks={stageKeys} {yTicks} {heading} {axisLabel} />
		<Cube scramble={scrambleString} solve={solutionString} controlPanel={'yes'} />
		<Button on:click={next}>
			<Label>Next Scramble</Label>
			<i class="material-icons" aria-hidden="true">arrow_forward</i>
		</Button>
	{:else}
		<h1>Loading...</h1>
	{/if}
</Content>
