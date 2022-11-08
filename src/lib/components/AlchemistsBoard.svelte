<script lang="ts">
	import { store } from '$lib/store';
	import Favour from './Favour.svelte';
	import Ingredient from './Ingredient.svelte';

	export let numPlayers = -1;
	export let round = -1;

	$: boardName = numPlayers === 4 ? 'board4' : 'board2';

	let w = 0;
	let h = 0;
	let aspect = 1157 / 605;
	$: boardWidth = Math.min(w, (h - 64) * aspect);
	$: boardHeight = boardWidth / aspect;
	function scaleX(x: number) {
		return Math.round((boardWidth * x) / 1157);
	}
	function scaleY(y: number) {
		return Math.round((boardWidth * y) / 1157);
		//return Math.round(boardHeight*y/605);
	}
	$: cubeW = boardWidth ? scaleX(20) : 0;
	$: cubeH = boardHeight ? scaleY(20) : 0;

	function cube(id: any) {
		return () => console.log('Got click on ' + id);
	}

	interface Target {
		id: string;
		x: number;
		y: number;
		height?: number;
		width?: number;
	}
	let targets: Target[] = [
		{ id: 'debunk11', x: 123, y: 76 }, // debunk
		{ id: 'debunk12', x: 123, y: 105 },
		{ id: 'debunk13', x: 123, y: 134 },
		{ id: 'debunk21', x: 155, y: 76 },
		{ id: 'debunk22', x: 155, y: 105 },
		{ id: 'debunk23', x: 155, y: 134 },
		{ id: 'student11', x: 510, y: 76 }, // student
		{ id: 'student12', x: 510, y: 105 },
		{ id: 'student13', x: 510, y: 134 },
		{ id: 'student21', x: 540, y: 76 },
		{ id: 'student22', x: 540, y: 105 },
		{ id: 'student23', x: 540, y: 134 },
		{ id: 'drink11', x: 695, y: 76 }, // drink
		{ id: 'drink12', x: 695, y: 105 },
		{ id: 'drink13', x: 695, y: 134 },
		{ id: 'drink21', x: 725, y: 76 },
		{ id: 'drink22', x: 725, y: 105 },
		{ id: 'drink23', x: 725, y: 134 },
		{ id: 'unknown11', x: 310, y: 76 }, // drink
		{ id: 'unknown11', x: 310, y: 105 },
		{ id: 'unknown11', x: 310, y: 134 },
		{ id: 'unknown11', x: 339, y: 76 },
		{ id: 'unknown11', x: 339, y: 105 },
		{ id: 'unknown11', x: 339, y: 134 },
		{ id: 'unknown11', x: 360, y: 76 },
		{ id: 'unknown11', x: 360, y: 105 },
		{ id: 'unknown11', x: 360, y: 134 },
		{ id: 'shop11', x: 128, y: 281 }, // shop
		{ id: 'shop12', x: 128, y: 310 },
		{ id: 'shop13', x: 128, y: 339 },
		{ id: 'shop21a', x: 154, y: 281 },
		{ id: 'shop21b', x: 154, y: 310 },
		{ id: 'shop22a', x: 154, y: 339 },
		{ id: 'shop22b', x: 175, y: 281 },
		{ id: 'shop23a', x: 175, y: 310 },
		{ id: 'shop23b', x: 175, y: 339 },
		{ id: 'transmute11', x: 390, y: 475 }, // transmute
		{ id: 'transmute12', x: 390, y: 504 },
		{ id: 'transmute13', x: 390, y: 532 },
		{ id: 'transmute21a', x: 419, y: 475 },
		{ id: 'transmute21b', x: 419, y: 504 },
		{ id: 'transmute22a', x: 419, y: 532 },
		{ id: 'transmute22b', x: 440, y: 475 },
		{ id: 'transmute23a', x: 440, y: 504 },
		{ id: 'transmute23b', x: 440, y: 532 },
		{ id: 'sell1a', x: 187, y: 460 }, // adventurer
		{ id: 'sell1b', x: 187, y: 489 },
		{ id: 'sell2a', x: 187, y: 518 },
		{ id: 'sell2b', x: 208, y: 460 },
		{ id: 'sell3a', x: 208, y: 489 },
		{ id: 'sell3b', x: 208, y: 518 },
		{ id: 'sell_exact', x: 117, y: 447 }, // advent top guarantee
		{ id: 'sell_sign', x: 117, y: 475 }, // sign
		{ id: 'sell_soup', x: 117, y: 502 }, // soup
		{ id: 'sell_black', x: 117, y: 530 }, // junk
		{ id: 'sell_first_two', x: 32, y: 545 }, // left two
		{ id: 'sell_right', x: 65, y: 545 }, // right one
		{ id: 'sell_hog', x: 46, y: 575 }, // bottom one
		{ id: 'forage11', x: 575, y: 475 }, // foraging
		{ id: 'forage12', x: 575, y: 502 },
		{ id: 'forage13', x: 575, y: 530 },
		{ id: 'forage21', x: 605, y: 475 }, // foraging
		{ id: 'forage22', x: 605, y: 502 },
		{ id: 'forage23', x: 605, y: 530 },
		{ id: 'forage31', x: 635, y: 475 }, // foraging
		{ id: 'forage32', x: 635, y: 502 },
		{ id: 'forage33', x: 635, y: 530 },
		{ id: 'hero', x: 13, y: 397, width: 85, height: 135 }, // adventurer
		{ id: 'forest0', x: 665, y: 455, width: 85, height: 135 }, // forest 1
		{ id: 'forest1', x: 762, y: 455, width: 85, height: 135 }, // forest 2
		{ id: 'forest2', x: 859, y: 455, width: 85, height: 135 }, // forest
		{ id: 'forest3', x: 956, y: 455, width: 85, height: 135 }, // forest
		{ id: 'forest4', x: 1053, y: 455, width: 85, height: 135 }, // forest
		{ id: 'draw_ingredient', x: 1002, y: 335, width: 135, height: 85 }, // forest draw pile
		{ id: 'conference', x: 780, y: 25, width: 85, height: 170 }, // conference
		{ id: 'draw_favour', x: 530, y: 243, width: 85, height: 135 }, // favours
		{ id: 'artifact1', x: 213, y: 243, width: 85, height: 135 }, // artifact 1
		{ id: 'artifact2', x: 309, y: 243, width: 85, height: 135 }, // artifact
		{ id: 'artifact3', x: 405, y: 243, width: 85, height: 135 }, // artifact
		{ id: 'renounce', x: 995, y: 170, width: 40, height: 40 }, // renounce
		{ id: 'hospital', x: 995, y: 240, width: 40, height: 40 }, // hospital
		{ id: 'paralyzed', x: 1065, y: 255, width: 30, height: 30 }, // paralyzed
		{ id: 'turn0', x: 1065, y: 30, width: 30, height: 30 }, // pay
		{ id: 'turn1', x: 1065, y: 63, width: 30, height: 30 }, //
		{ id: 'turn2', x: 1065, y: 96, width: 30, height: 30 }, // 1 ingredient
		{ id: 'turn3', x: 1065, y: 125, width: 30, height: 30 }, // two
		{ id: 'turn4', x: 1065, y: 155, width: 30, height: 30 }, // 1 of each
		{ id: 'turn5', x: 1065, y: 185, width: 30, height: 30 }, // two favours
		{ id: 'turn6', x: 1065, y: 217, width: 30, height: 30 } // three player only
	];
	$: if (boardHeight) {
		targets = targets;
	}

	$: ingredients = $store.alchemists.faceupIngredients;
	$: ingredientDeckCount = $store.alchemists.ingredientPile.length;
	$: favourDeckCount = $store.alchemists.favoursPile.length;
</script>

<svelte:window bind:innerHeight={h} />
<div class="boardcontainer" bind:clientWidth={w}>
	<pre>{w}x{h} {Math.round(boardWidth * 10) / 10}x{Math.round(boardHeight * 10) /
			10} {cubeW}x{cubeH}</pre>
	<div
		style="background-image: url('{boardName}.jpg') ;width: {boardWidth}px; height: {boardHeight}px"
	>
		{#each targets as target}
			<span
				class="cubetarget"
				style="width: {target.width ? scaleX(target.width) : cubeW}px;height: {target.height
					? scaleX(target.height)
					: cubeH}px; top: {scaleY(target.y)}px; left: {scaleX(target.x)}px"
				on:click={cube(target.id)}
				>{#if target.id.startsWith('forest') && ingredients[parseInt(target.id.substring(6))]}
					<Ingredient ingredient={ingredients[parseInt(target.id.substring(6))]} />
				{:else if target.id === 'draw_ingredient'}
					<Ingredient ingredient={-1} />
					<span class="cardcount">{ingredientDeckCount}</span>
				{:else if target.id === 'draw_favour'}
					<Favour favour={-1} />
					<span class="cardcount">{favourDeckCount}</span>
				{/if}</span
			>
		{/each}
	</div>
</div>

<style>
	pre {
		position: absolute;
		top: 0px;
		left: 8px;
		color: lime;
		font-size: 8px;
		font-weight: bold;
		font: courier;
	}
	.cubetarget {
		--background-color: lime;
		--border: 1px solid lime;
		--border-radius: 20px;
		display: inline-block;
		position: absolute;
	}
	.boardcontainer {
		width: 100%;
		display: block;
	}
	.cardcount {
		font-size: 12;
		color: white;
		font-family: sans-serif;
		position: absolute;
		left: 5px;
		top: 5px;
	}
	div {
		margin: 0;
		display: block;
		background-repeat: no-repeat;
		background-size: cover;
		background-position: top 0px left 0px;
	}
</style>
