<script lang="ts">
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

	let targets = [
		{ id: 'debunk11', x: 123, y: 76 }, // debunk
		{ id: 'debunk12', x: 123, y: 105 },
		{ x: 123, y: 134 },
		{ x: 155, y: 76 },
		{ x: 155, y: 105 },
		{ x: 155, y: 134 },
		{ x: 510, y: 76 }, // student
		{ x: 510, y: 105 },
		{ x: 510, y: 134 },
		{ x: 540, y: 76 },
		{ x: 540, y: 105 },
		{ x: 540, y: 134 },
		{ x: 695, y: 76 }, // drink
		{ x: 695, y: 105 },
		{ x: 695, y: 134 },
		{ x: 725, y: 76 },
		{ x: 725, y: 105 },
		{ x: 725, y: 134 },
		{ x: 310, y: 76 }, // drink
		{ x: 310, y: 105 },
		{ x: 310, y: 134 },
		{ x: 339, y: 76 },
		{ x: 339, y: 105 },
		{ x: 339, y: 134 },
		{ x: 360, y: 76 },
		{ x: 360, y: 105 },
		{ x: 360, y: 134 },
		{ x: 128, y: 281 }, // shop
		{ x: 128, y: 310 },
		{ x: 128, y: 339 },
		{ x: 154, y: 281 },
		{ x: 154, y: 310 },
		{ x: 154, y: 339 },
		{ x: 175, y: 281 },
		{ x: 175, y: 310 },
		{ x: 175, y: 339 },
		{ x: 390, y: 475 }, // transmute
		{ x: 390, y: 504 },
		{ x: 390, y: 532 },
		{ x: 419, y: 475 },
		{ x: 419, y: 504 },
		{ x: 419, y: 532 },
		{ x: 440, y: 475 },
		{ x: 440, y: 504 },
		{ x: 440, y: 532 },
		{ x: 187, y: 460 }, // adventurer
		{ x: 187, y: 489 },
		{ x: 187, y: 518 },
		{ x: 208, y: 460 },
		{ x: 208, y: 489 },
		{ x: 208, y: 518 },
		{ x: 117, y: 447 }, // advent top guarantee
		{ x: 117, y: 475 }, // sign
		{ x: 117, y: 502 }, // soup
		{ x: 117, y: 530 }, // junk
		{ x: 32, y: 545 }, // left two
		{ x: 65, y: 545 }, // right one
		{ x: 46, y: 575 }, // bottom one
		{ x: 575, y: 475 }, // foraging
		{ x: 575, y: 502 },
		{ x: 575, y: 530 },
		{ x: 605, y: 475 }, // foraging
		{ x: 605, y: 502 },
		{ x: 605, y: 530 },
		{ x: 635, y: 475 }, // foraging
		{ x: 635, y: 502 },
		{ x: 635, y: 530 },
		{ x: 13, y: 397, width: 85, height: 135 }, // adventurer
		{ x: 665, y: 455, width: 85, height: 135 }, // forest 1
		{ x: 762, y: 455, width: 85, height: 135 }, // forest 2
		{ x: 859, y: 455, width: 85, height: 135 }, // forest
		{ x: 956, y: 455, width: 85, height: 135 }, // forest
		{ x: 1053, y: 455, width: 85, height: 135 }, // forest
		{ x: 1002, y: 335, width: 135, height: 85 }, // forest draw pile
		{ x: 780, y: 25, width: 85, height: 170 }, // conference
		{ x: 530, y: 243, width: 85, height: 135 }, // favours
		{ x: 213, y: 243, width: 85, height: 135 }, // artifact 1
		{ x: 309, y: 243, width: 85, height: 135 }, // artifact
		{ x: 405, y: 243, width: 85, height: 135 }, // artifact
		{ x: 995, y: 170, width: 40, height: 40 }, // renounce
		{ x: 995, y: 240, width: 40, height: 40 }, // hospital
		{ x: 1065, y: 255, width: 30, height: 30 }, // paralyzed
		{ x: 1065, y: 30, width: 30, height: 30 }, // pay
		{ x: 1065, y: 63, width: 30, height: 30 }, //
		{ x: 1065, y: 96, width: 30, height: 30 }, // 1 ingredient
		{ x: 1065, y: 125, width: 30, height: 30 }, // two
		{ x: 1065, y: 155, width: 30, height: 30 }, // 1 of each
		{ x: 1065, y: 185, width: 30, height: 30 }, // two favours
		{ x: 1065, y: 217, width: 30, height: 30 } // three player only
	];
	$: if (boardHeight) {
		targets = targets;
	}
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
			/>
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
	div {
		margin: 0;
		display: block;
		background-repeat: no-repeat;
		background-size: cover;
		background-position: top 0px left 0px;
	}
</style>
