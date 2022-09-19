<script>
	import { scaleLinear } from 'd3-scale';

	export let points = [
		{ xValue: 1990, yValue: 16.7 },
		{ xValue: 1995, yValue: 14.6 },
		{ xValue: 2000, yValue: 14.4 },
		{ xValue: 2005, yValue: 14 },
		{ xValue: 2010, yValue: 13 },
		{ xValue: 2015, yValue: 12.4 }
	];

	export let xTicks = [1990, 1995, 2000, 2005, 2010, 2015];
	export let yTicks = [0, 5, 10, 15, 20];
	export let padding = { top: 20, right: 15, bottom: 20, left: 25 };

	export let width = 500;
	export let height = 200;

	function formatMobile(tick) {
		return "'" + tick.toString().slice(-2);
	}

	$: xScale = scaleLinear()
		.domain([0, xTicks.length])
		.range([padding.left, width - padding.right]);

	$: yScale = scaleLinear()
		.domain([0, Math.max.apply(null, yTicks)])
		.range([height - padding.bottom, padding.top]);

	$: innerWidth = width - (padding.left + padding.right);
	$: barWidth = innerWidth / xTicks.length;
	const barSpacing = 12;

	export let heading = "US Birthrate by Year";
	export let axisLabel = ' per 10,000 people';
</script>

<h2>{heading}</h2>

<div class="chart" bind:clientWidth={width} bind:clientHeight={height}>
	<svg>
		<!-- y axis -->
		<g class="axis y-axis">
			{#each yTicks as tick}
				<g class="tick tick-{tick}" transform="translate(0, {yScale(tick)})">
					<line x2="100%"></line>
					<text y="-4">{tick} {tick === yTicks[yTicks.length-1] ? axisLabel : ''}</text>
				</g>
			{/each}
		</g>

		<!-- x axis -->
		<g class="axis x-axis">
			{#each points as point, i}
				<g class="tick" transform="translate({xScale(i)},{height})">
					<text x="{barWidth/2}" y="-4">{point.xValue}</text>
				</g>
			{/each}
		</g>

		<g class='bars'>
			{#each points as point, i}
				<rect
					x="{xScale(i) + barSpacing/2}"
					y="{yScale(point.yValue)}"
					width="{barWidth - barSpacing}"
					height="{yScale(0) - yScale(point.yValue)}"
				></rect>
			{/each}
		</g>
	</svg>
</div>

<style>
	h2 {
		text-align: center;
	}

	.chart {
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
	}

	svg {
		position: relative;
		width: 100%;
		height: 200px;
	}

	.tick {
		font-family: Helvetica, Arial;
		font-size: .725em;
		font-weight: 200;
	}

	.tick line {
		stroke: grey;
		stroke-dasharray: 2;
	}

	.tick text {
		fill: black;
		text-anchor: start;
	}

	.tick.tick-0 line {
		stroke-dasharray: 0;
	}

	.x-axis .tick text {
		text-anchor: middle;
	}

	.bars rect {
		fill: green;
		stroke: none;
		opacity: 0.65;
	}
</style>

