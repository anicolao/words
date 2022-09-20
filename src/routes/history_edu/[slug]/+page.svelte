<script lang="ts">
	import { page } from '$app/stores';
	import { store } from '$lib/store';
	import { goto } from '$app/navigation';
	import Button, { Label } from '@smui/button';
	import Cube from '$lib/components/Cube.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import IconButton from '@smui/icon-button';
	import List, { Item, Text } from '@smui/list';
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
		fb: 'First block',
		ss: 'Square',
		sp: 'Last pair',
		cmll: 'CMLL',
		lse: 'LSE'
	};

	const headings = {
		moves: 'Moves by stage',
		times: 'Times by stage'
	};
	const yAxisLabels = {
		moves: ' moves',
		times: ' seconds'
	};
	$: stageKeys = Object.keys(stages);
	$: solveData = [];
	const timings: { [k: string]: number } = {};
	function makeDataTable(displayMode: string) {
		solveData = [];
		let startTimeOffset = scrambleArray.length;
		stages.forEach((s) => {
			let endOffset = startTimeOffset + s.solution.length();
			let yValue = s.solution.length();
			if (endOffset > 0 && startTimeOffset > 0) {
				const timing =
					Math.round((timestamps[endOffset - 1] - timestamps[startTimeOffset - 1]) / 100) / 10;
				timings[s.stage] = timing;
				if (displayMode === 'times') {
					yValue = timing;
				}
			}
			solveData.push({ xValue: translation[s.stage], yValue });
			startTimeOffset = endOffset;
		});
		console.log({ stages, solveData });
	}
	$: makeDataTable(displayMode);
	$: maxY = solveData
		.map((e) => e.yValue)
		.sort((a, b) => Number(a) - Number(b))
		.slice(-1)[0];
	$: numTicks = Math.trunc(maxY / 5);
	$: yTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].slice(0, numTicks + 2);
	$: if (yTicks) {
		let tmaxY = solveData.map((e) => e.yValue).sort((a, b) => Number(a) - Number(b));
		console.log({ yTicks, maxY, numTicks, tmaxY });
	}
	$: heading = headings[displayMode];
	$: axisLabel = yAxisLabels[displayMode];
	let displayMode = sourcePage !== 'trending_down' ? 'times' : 'moves';

	function toggleDisplayMode() {
		displayMode = displayMode === 'times' ? 'moves' : 'times';
	}
	function copyText() {
		let algStr = scrambleString + ' // Scramble\n';
		stages.forEach((s) => {
			algStr += s.solution + ' // ' + translation[s.stage] + '\n';
		});
		navigator.clipboard.writeText(algStr);
	}

	function handleStage(stageSelected: any) {
		selectStage(stageSelected.detail);
	}
	function selectStage(stageSelected: string) {
		let startOffset = 0;
		console.log('SHOW: ', stageSelected, ' scramble offset ', startOffset);
		stages.forEach((s) => {
			if (translation[s.stage] === stageSelected || s.stage === stageSelected) {
				console.log('SHOW POSITION: ', startOffset, ' for ', stageSelected);
				playHead = startOffset;
			}
			startOffset += s.solution.length();
		});
	}
	let playHead = 0;
</script>

<div class="container">
	{#if solve}
		{#if displayMode !== 'moves'}
			<h1 on:click={toggleDisplayMode}>Time: {time}s</h1>
		{:else}
			<h1 on:click={toggleDisplayMode}>Move Count: {moveCount}</h1>
		{/if}
		<BarChart
			on:message={handleStage}
			points={solveData}
			xTicks={stageKeys}
			{yTicks}
			{heading}
			{axisLabel}
		/>
		<p style="display:inline-block" on:click={copyText}>
			<Item>
				<IconButton class="material-icons">content_copy</IconButton>
				<Text>Scramble: {scrambleString}</Text>
			</Item>
		</p>
		<table cellspacing="0" align="center">
			<tr><td align="left">Stage</td><td>Length</td><td>Time</td><td align="left">Solution</td></tr>
			{#each stages as stage, i}
				<tr class={i % 2 ? 'odd' : 'even'} on:click={() => selectStage(translation[stage.stage])}>
					<td align="left">{translation[stage.stage]}</td><td>{stage.solution.length()}</td>
					<td>{timings[stage.stage]}</td><td align="left"
						>{stage.solution}// {translation[stage.stage]}: {stage.solution.length()}</td
					>
				</tr>
			{/each}
		</table>
		<Cube {playHead} scramble={scrambleString} solve={solutionString} controlPanel={'yes'} />
		<Button on:click={next}>
			<Label>Next Scramble</Label>
			<i class="material-icons" aria-hidden="true">arrow_forward</i>
		</Button>
	{:else}
		<h1>Loading...</h1>
	{/if}
</div>

<style>
	h1 {
		text-align: center;
		border-bottom: 1px solid grey;
	}

	tr:hover td {
		background-color: #ffffa0;
	}
	tr:hover:first-child td {
		background-color: transparent;
	}
	.container {
		text-align: center;
		width: 100%;
		font-family: 'Roboto', sans-serif;
	}

	td {
		border-bottom: 1px solid #ddd;
		padding: 0.5em;
		padding-top: 0.1em;
		padding-bottom: 0.1em;
	}
	.odd td {
		background-color: #f0f0f0;
	}

	table {
		padding-bottom: 3em;
	}
	p {
		padding: 0.3em;
	}
</style>
