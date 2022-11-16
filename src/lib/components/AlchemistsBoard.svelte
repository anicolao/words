<script lang="ts">
	import { store } from '$lib/store';
	import Favour from './Favour.svelte';
	import Cube from './Cube.svelte';
	import Ingredient from './Ingredient.svelte';
	import Artifact from './Artifact.svelte';
	import { actionToColumnCubeCount } from './alchemists';

	export let numPlayers = -1;
	export let previewStore = $store.alchemists;

	$: boardName = numPlayers === 4 ? 'board4' : 'board2';

	let w = 0;
	let h = 0;
	let aspect = 1157 / 605;
	$: boardWidth = Math.min(w, (h - 64) * aspect);
	$: boardHeight = boardWidth / aspect;
	function makeScale(n: number, d: number) {
		return (x: number) => Math.round((n * x) / d);
	}
	$: scaleX = boardWidth === w ? makeScale(boardHeight, 605) : makeScale(boardWidth, 1157);
	$: scaleY = scaleX;
	/*
	function scaleX(x: number) {
		return Math.round((boardWidth * x) / 1157);
	}
	function scaleY(y: number) {
		return Math.round((boardWidth * y) / 1157);
		//return Math.round(boardHeight*y/605);
	}
    */
	$: cubeW = boardWidth ? scaleX(20) : 0;
	$: cubeH = boardHeight ? scaleY(20) : 0;

	import { createEventDispatcher } from 'svelte';
	import Flask from './Flask.svelte';
	const fireEvent = createEventDispatcher();
	function cube(id: any) {
		return () => {
			fireEvent('cube', id);
		};
	}

	interface Target {
		id: string;
		x: number;
		y: number;
		height?: number;
		width?: number;
	}
	let targets: Target[] = [
		{ id: 'cube_debunk_11', x: 123, y: 76 }, // debunk
		{ id: 'cube_debunk_12', x: 123, y: 105 },
		{ id: 'cube_debunk_13', x: 123, y: 134 },
		{ id: 'cube_debunk_21', x: 155, y: 76 },
		{ id: 'cube_debunk_22', x: 155, y: 105 },
		{ id: 'cube_debunk_23', x: 155, y: 134 },
		{ id: 'cube_student_11', x: 510, y: 76 }, // student
		{ id: 'cube_student_12', x: 510, y: 105 },
		{ id: 'cube_student_13', x: 510, y: 134 },
		{ id: 'cube_student_21', x: 540, y: 76 },
		{ id: 'cube_student_22', x: 540, y: 105 },
		{ id: 'cube_student_23', x: 540, y: 134 },
		{ id: 'cube_drink_11', x: 695, y: 76 }, // drink
		{ id: 'cube_drink_12', x: 695, y: 105 },
		{ id: 'cube_drink_13', x: 695, y: 134 },
		{ id: 'cube_drink_21', x: 725, y: 76 },
		{ id: 'cube_drink_22', x: 725, y: 105 },
		{ id: 'cube_drink_23', x: 725, y: 134 },
		{ id: 'cube_publish_11', x: 310, y: 76 }, // publish
		{ id: 'cube_publish_12', x: 310, y: 105 },
		{ id: 'cube_publish_13', x: 310, y: 134 },
		{ id: 'cube_publish_21a', x: 339, y: 76 },
		{ id: 'cube_publish_21b', x: 360, y: 76 },
		{ id: 'cube_publish_22a', x: 339, y: 105 },
		{ id: 'cube_publish_22b', x: 360, y: 105 },
		{ id: 'cube_publish_23a', x: 339, y: 134 },
		{ id: 'cube_publish_23b', x: 360, y: 134 },
		{ id: 'cube_shop_11', x: 128, y: 281 }, // shop
		{ id: 'cube_shop_12', x: 128, y: 310 },
		{ id: 'cube_shop_13', x: 128, y: 339 },
		{ id: 'cube_shop_21a', x: 154, y: 281 },
		{ id: 'cube_shop_21b', x: 175, y: 281 },
		{ id: 'cube_shop_22a', x: 154, y: 310 },
		{ id: 'cube_shop_22b', x: 175, y: 310 },
		{ id: 'cube_shop_23a', x: 154, y: 339 },
		{ id: 'cube_shop_23b', x: 175, y: 339 },
		{ id: 'cube_transmute_11', x: 390, y: 475 }, // transmute
		{ id: 'cube_transmute_12', x: 390, y: 504 },
		{ id: 'cube_transmute_13', x: 390, y: 532 },
		{ id: 'cube_transmute_21a', x: 419, y: 475 },
		{ id: 'cube_transmute_21b', x: 440, y: 475 },
		{ id: 'cube_transmute_22b', x: 419, y: 504 },
		{ id: 'cube_transmute_22a', x: 440, y: 504 },
		{ id: 'cube_transmute_23a', x: 419, y: 532 },
		{ id: 'cube_transmute_23b', x: 440, y: 532 },
		{ id: 'cube_sell_1a', x: 187, y: 460 }, // adventurer
		{ id: 'cube_sell_1b', x: 208, y: 460 },
		{ id: 'cube_sell_2a', x: 187, y: 489 },
		{ id: 'cube_sell_2b', x: 208, y: 489 },
		{ id: 'cube_sell_3a', x: 187, y: 518 },
		{ id: 'cube_sell_3b', x: 208, y: 518 },
		{ id: 'sell_exact', x: 117, y: 447 }, // advent top guarantee
		{ id: 'sell_sign', x: 117, y: 475 }, // sign
		{ id: 'sell_soup', x: 117, y: 502 }, // soup
		{ id: 'sell_black', x: 117, y: 530 }, // junk
		{ id: 'sell_first_two', x: 32, y: 545 }, // left two
		{ id: 'sell_right', x: 65, y: 545 }, // right one
		{ id: 'sell_hog', x: 46, y: 575 }, // bottom one
		{ id: 'cube_forage_11', x: 575, y: 475 }, // foraging
		{ id: 'cube_forage_12', x: 575, y: 502 },
		{ id: 'cube_forage_13', x: 575, y: 530 },
		{ id: 'cube_forage_21', x: 605, y: 475 }, // foraging
		{ id: 'cube_forage_22', x: 605, y: 502 },
		{ id: 'cube_forage_23', x: 605, y: 530 },
		{ id: 'cube_forage_31', x: 635, y: 475 }, // foraging
		{ id: 'cube_forage_32', x: 635, y: 502 },
		{ id: 'cube_forage_33', x: 635, y: 530 },
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
		{ id: 'action_renounce', x: 995, y: 170, width: 40, height: 40 }, // renounce
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

	$: ingredients = previewStore.faceupIngredients;
	$: level = 1;
	$: artifacts = previewStore.shop[level - 1];
	$: ingredientDeckCount = previewStore.ingredientPile.length;
	$: favourDeckCount = previewStore.favoursPile.length;
	$: turns = previewStore.turnOrderToPlayerEmail;
	let cubes: { [k: string]: string } = {};
	$: if (previewStore.cubeActionToPlayerEmails) {
		const keys = Object.keys(previewStore.cubeActionToPlayerEmails);
		cubes = {};
		keys.forEach((key) => {
			const players = previewStore.cubeActionToPlayerEmails[key];
			const num = previewStore.players.length;
			const offset = num === 2 ? 2 : 1;
			const playerIndexes = players.map((x) => previewStore.players.indexOf(x) + offset);
			const piCounts = previewStore.players.map((x) => {
				const count =
					previewStore.completedCubeActionToPlayerEmails[key]?.filter((y) => x === y).length || 0;
				return count + 1;
			});
			for (let i = 0; i < playerIndexes.length; ++i) {
				const pi = playerIndexes[i];
				const player = previewStore.players[pi - offset];
				const piCount = piCounts[previewStore.players.indexOf(player)]++;
				const cubeCount = actionToColumnCubeCount[key][piCount - 1];
				if (cubeCount === 1) {
					cubes[`cube_${key}_${piCount}${pi}`] = player;
				} else if (cubeCount === 2) {
					cubes[`cube_${key}_${piCount}${pi}a`] = player;
					cubes[`cube_${key}_${piCount}${pi}b`] = player;
				}
			}
		});
	}
</script>

<svelte:window bind:innerHeight={h} />
<div class="boardcontainer" bind:clientWidth={w}>
	<pre>{w}x{h} {Math.round(boardWidth * 10) / 10}x{Math.round(boardHeight * 10) / 10} {Math.round(
			aspect * 100
		) / 100}</pre>
	<div
		style="background-image: url('{boardName}.jpg') ;width: {boardWidth}px; height: {boardHeight}px"
	>
		{#each targets as target}<span
				class="cubetarget"
				style="width: {target.width ? scaleX(target.width) : cubeW}px;height: {target.height
					? scaleX(target.height)
					: cubeH}px; top: {scaleY(target.y)}px; left: {scaleX(target.x)}px"
				on:click={cube(target.id)}
				>{#if target.id.startsWith('forest') && ingredients[parseInt(target.id.substring(6))] >= 0}<Ingredient
						ingredient={ingredients[parseInt(target.id.substring(6))]}
					/>{:else if target.id.startsWith('artifact') && artifacts[parseInt(target.id.substring(8)) - 1] >= 0}<Artifact
						{level}
						artifact={artifacts[parseInt(target.id.substring(8)) - 1]}
					/>{:else if target.id === 'draw_ingredient'}<Ingredient ingredient={-1} /><span
						class="cardcount">{ingredientDeckCount}</span
					>{:else if target.id === 'draw_favour'}<Favour favour={-1} /><span class="cardcount"
						>{favourDeckCount}</span
					>{:else if target.id.startsWith('turn') && turns[target.id] !== undefined}<Flask
						{scaleX}
						email={turns[target.id]}
					/>{:else if target.id.startsWith('cube_') && cubes[target.id] !== undefined}<Cube
						{scaleX}
						email={cubes[target.id]}
					/>{/if}</span
			>{/each}
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
