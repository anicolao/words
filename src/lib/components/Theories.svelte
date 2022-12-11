<script lang="ts">
	import { store } from '$lib/store';
	import Flask from './Flask.svelte';

	export let players: string[] = [];

	const wideScores = 12.1;
	const topOffset = 8.7;
	$: scores = players.map((email, i) => $store.alchemists.emailToPlayerState[email].score);
	const bottom = 93.5;
	$: scoremod = scores.map((score) => score % 50);
	$: y = scoremod.map((score) =>
		score < 8 || score > 39
			? bottom
			: score < 17
			? bottom + (bottom * (7 - score)) / 9
			: score < 25
			? 0
			: score < 27
			? ((score - 25) / 2) * 28
			: 23 + ((score - 27) / 13) * (100 - 28)
	);
	$: x = scoremod.map(
		(score, i) =>
			(score < 40 && score > 4 ? i * 3.5 : i * 0.8) +
			(score < 8
				? score < 5
					? 30 + ((4 - score) / 4) * 22
					: ((7 - score) / 3) * 30
				: score < 17
				? 0
				: score < 22
				? topOffset + (score - 17) * wideScores
				: score < 25
				? topOffset + 5 * wideScores + ((score - 22) / 3) * (100 - topOffset - 5 * wideScores) - 1
				: score < 41
				? 94
				: 55 + ((50 - score) / 9) * 36)
	);
</script>

<div>
	<img alt="Theories and Reputation" src="theory_board.jpg" />
	{#each players as player, i}
		<span style="top: {y[i]}%; left: {x[i]}%;">
			<Flask email={player} />
			<span class="score" style="top: 20%; left: 25%">{scores[i]}</span>
		</span>
	{/each}
</div>

<style>
	div {
		position: relative;
		max-width: 724px;
	}
	img {
		width: 100%;
		max-width: 724px;
	}
	span {
		position: absolute;
	}
	.score {
		color: ivory;
		font-weight: bold;
		font-family: sans-serif;
		padding: 3px;
		font-size: 10px;
		background-color: black;
		border-radius: 50%;
	}
</style>
