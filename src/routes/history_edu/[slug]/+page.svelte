<script lang="ts">
	import { page } from '$app/stores';
	import { store } from '$lib/store';
	import { goto } from '$app/navigation';
	import Button, { Label } from '@smui/button';
	import Cube from '$lib/components/Cube.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import IconButton from '@smui/icon-button';
	import { Item, Text } from '@smui/list';
	import { get_roux_stages, type SolutionDesc } from '$lib/third_party/onionhoney/Analyzer';
	import { Move, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
	import { makeOptimizedData } from '$lib/optimizer/optimizer';

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

	$: cubeSS = scrambleString;
	let alternateScramble = scrambleString;

	$: stages = get_roux_stages(scrambleString, solutionString);
	function rSolution(stages: SolutionDesc[]) {
		let orientation = new MoveSeq([]);
		if (stages && stages[0].orientation) {
			orientation = new MoveSeq(stages[0].orientation).inv();
		}
		const orig = new MoveSeq(solutionString);
		return orig.pushBackAll(orientation).toString();
	}
	$: cubeAlg = rSolution(stages);
	$: optimized = [] /* makeOptimizedData(scrambleString, stages) */ as {
		orientation?: string;
		stage: string;
		premove: string;
		solution: MoveSeq;
		score: number;
	}[][];
	let alternateSolution: SolutionDesc | undefined = undefined;
	$: console.log({ stages, optimized });

	function next() {
		console.log('navigate to ', sourcePage);
		goto('/' + sourcePage);
	}

	const translation: { [k: string]: string } = {
		fb: 'First block',
		ss: 'Square',
		sp: 'Last pair',
		cmll: 'CMLL',
		lse: 'LSE'
	};

	const headings: { [k: string]: string } = {
		moves: 'Moves by stage',
		times: 'Times by stage'
	};
	const yAxisLabels: { [k: string]: string } = {
		moves: ' moves',
		times: ' seconds'
	};
	$: stageKeys = Object.keys(stages);
	type DataPoint = { xValue: any; yValue: number };
	$: solveData = [] as DataPoint[];
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
			let data: DataPoint = { xValue: translation[s.stage], yValue };
			solveData.push(data);
			startTimeOffset = endOffset;
		});
		console.log({ stages, solveData });
		//console.log(JSON.stringify(stages));
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
		let orientation = new MoveSeq([]);
		if (stages[0].orientation) {
			orientation = new MoveSeq(stages[0].orientation).inv();
		}
		algStr += orientation + ' ';
		stages.forEach((s, i) => {
			let quicker = '?';
			algStr += s.rotatedSolution + ' // ' + translation[s.stage];
			if (optimized[i] && optimized[i].length) {
				const spin = new MoveSeq(optimized[i][0]?.orientation || '');
				const premoves = new MoveSeq(optimized[i][0].premove);
				const moves = new MoveSeq(optimized[i][0].solution.moves);
				quicker = spin + ' ' + premoves + ' ' + moves;
				algStr +=
					`(${s.solution.length()}) vs (${
						spin.moves.length + premoves.moves.length + moves.moves.length
					}) ` + quicker;
			}
			algStr += '\n';
		});
		navigator.clipboard.writeText(algStr);
		selectStage('solved');
	}

	function handleStage(stageSelected: any) {
		selectStage(stageSelected.detail);
	}
	function selectStage(stageSelected: string) {
		let startOffset = 0;
		playHead = -1;
		alternateSolution = undefined;
		alternateScramble = scrambleString;
		cubeSS = scrambleString;
		cubeAlg = solutionString;
		console.log('SHOW: ', stageSelected, ' scramble offset ', startOffset);
		stages.forEach((s, i) => {
			if (translation[s.stage] === stageSelected || s.stage === stageSelected) {
				console.log('SHOW POSITION: ', startOffset, ' for ', stageSelected);
				playHead = startOffset;
				stickering = s.stage;
				if (optimized[i] && optimized[i].length) {
					alternateSolution = { ...optimized[i][0], rotatedSolution: new MoveSeq([]) };
					alternateSolution.stage = s.stage;
				} else {
					alternateSolution = undefined;
				}
			} else if (alternateSolution === undefined) {
				alternateScramble += s.premove + ' ' + s.solution;
			}
			startOffset += s.solution.length();
		});
		if (playHead === -1) {
			playHead = startOffset;
			stickering = '';
		}
	}
	function playAlternate() {
		cubeSS = alternateScramble;
		const spin = new MoveSeq(alternateSolution?.orientation || '');
		cubeAlg = spin + ' ' + alternateSolution?.premove + ' ' + alternateSolution?.solution;
		playHead = 0;
		console.log({ cubeSS, cubeAlg, playHead });
	}
	let playHead = 0;
	let stickering = '';
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
					<td>{timings[stage.stage]}</td><td align="left">{stage.rotatedSolution}</td>
				</tr>
				{#if alternateSolution && alternateSolution.stage === stage.stage && alternateSolution.solution.length() > 0}
					<tr class={'alternate'} on:click={() => playAlternate()}>
						<td align="left"><em>vs: </em>{translation[stage.stage]}</td><td
							>{alternateSolution.solution.length()}</td
						>
						<td
							>{Math.round(
								timings[stage.stage] *
									(alternateSolution.solution.length() / stage.solution.length())
							)}</td
						><td align="left">{alternateSolution.solution}</td>
					</tr>
				{/if}
			{/each}
		</table>
		<Cube {playHead} {stickering} scramble={cubeSS} solve={cubeAlg} controlPanel={'yes'} />
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

	.alternate td {
		font-weight: bold;
		background-color: #a0d0a0;
	}

	table {
		padding-bottom: 3em;
	}
	p {
		padding: 0.3em;
	}
</style>
