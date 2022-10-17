<script lang="ts">
	import { words as ospd } from '$lib/components/ospd4';
	import { store } from '$lib/store';
	import Button, { Label } from '@smui/button';
	import IconButton from '@smui/icon-button/src/IconButton.svelte';
	import { dispatchToTable, shuffle } from './gameutil';
	import { generateDictionary } from './trie';
	import {
		draw_tiles,
		dump,
		initialWordsState,
		pass,
		play,
		words,
		type WordsState,
		fail_challenge,
		challenge
	} from './words';

	export let tableId = '';
	export let numRows = 0;
	export let numCols = 0;
	export let letterm = '';
	export let wordm = '';
	export let tiles = '';
	export let values = '';
	export let rack = '';
	export let boardState: WordsState = initialWordsState;
	$: state = boardState;
	let w: number;
	let h: number;

	$: boardHeight = Math.min(w, h);
	$: boardWidth = Math.floor(boardHeight / 1.07);
	$: tileWidth = Math.floor(boardWidth / numCols) - 3;
	$: tileHeight = Math.floor(boardHeight / numRows) - 3;
	$: letterMultipliers = letterm.split('').map((x) => parseInt(x));
	$: wordMultipliers = wordm.split('').map((x) => parseInt(x));
	let squareTypes: string[][] = [];
	$: if (letterMultipliers && wordMultipliers) {
		const typeOf = ['normal', 'dls', 'tls'];
		squareTypes = [];
		for (let row = 0; row < numRows; ++row) {
			squareTypes[row] = [];
			for (let col = 0; col < numCols; ++col) {
				const lmult = letterMultipliers[row * numCols + col];
				const wmult = wordMultipliers[row * numCols + col];
				if (lmult === 2) squareTypes[row].push('dls');
				else if (lmult === 3) squareTypes[row].push('tls');
				else if (wmult === 2) squareTypes[row].push('dws');
				else if (wmult === 3) squareTypes[row].push('tws');
				else squareTypes[row].push('nil');
			}
		}
	}
	const content: { [k: string]: string } = {
		dls: 'DOUBLE LETTER SCORE',
		tls: 'TRIPLE LETTER SCORE',
		dws: 'DOUBLE WORD SCORE',
		tws: 'TRIPLE WORD SCORE',
		nil: ''
	};

	let tileToValue: { [letter: string]: number } = {};
	$: if (tiles && values) {
		const tArray = tiles.split('');
		const vArray = values.split('').map((x) => parseInt(x, 16));
		tArray.forEach((letter, i) => (tileToValue[letter] = vArray[i]));
		tArray.forEach((letter, i) => (tileToValue[letter.toUpperCase()] = tileToValue['_']));
	}

	let goVertical = false;
	let selectedRow = -1;
	let selectedCol = -1;
	function cell(r: number, c: number) {
		return () => {
			if (selectedRow === r && selectedCol === c) {
				goVertical = !goVertical;
			}
			selectedRow = r;
			selectedCol = c;
		};
	}

	const me = $store.auth.email || '';
	$: rack = state.emailToRack[me];
	let wordSoFar = '';
	let score = 0;
	function handleLetter(letter: string) {
		async function previewMove(expectedChange: number) {
			const move = play({
				x: selectedCol,
				y: selectedRow,
				isVertical: goVertical,
				letters: wordSoFar,
				player: me,
				allowIllegalMoves: true
			});
			state = words(boardState, move);
			if (rack.length !== state.emailToRack[me].length + expectedChange) {
				if (expectedChange === 1 && letter.toUpperCase() !== letter) {
					letter = letter.toUpperCase();
					wordSoFar = wordSoFar.slice(0, -1) + letter.toUpperCase();
					previewMove(1);
				} else {
					wordSoFar = wordSoFar.slice(0, -1);
					previewMove(0);
				}
			} else {
				console.log({ plays: state.plays });
				score = state.plays.slice(-1)[0].score;
			}
		}
		if (letter.length === 1 && letter >= 'a' && letter <= 'z') {
			wordSoFar += letter;
			previewMove(1);
		} else if (letter === 'enter') {
			console.log('submit move');
			const move = play({
				x: selectedCol,
				y: selectedRow,
				isVertical: goVertical,
				letters: wordSoFar,
				player: me
			});
			state = words(boardState, move);
			if (rack !== state.emailToRack[me]) {
				console.log('Not your turn?', { rack, srack: state.emailToRack[me] });
				state = boardState;
			} else {
				state = boardState;
				dispatchToTable(tableId, move);
				const draw = draw_tiles(me);
				dispatchToTable(tableId, draw);
			}
			wordSoFar = '';
		} else if (letter === 'escape') {
			wordSoFar = '';
			state = boardState;
		} else if (letter === 'backspace') {
			wordSoFar = wordSoFar.slice(0, -1);
			previewMove(-1);
		} else if (letter === 'dump') {
			if (state.drawPile.length >= 7) {
				const letters = wordSoFar;
				previewMove(0);
				const draw = draw_tiles(me);
				state = words(state, draw);
				const newDrawPile = state.drawPile + wordSoFar;
				const shuffleArrray = shuffle(newDrawPile.split(''));
				const reshuffledDrawPile = shuffleArrray.join('');
				const dumpTiles = dump({
					player: me,
					newRack: state.emailToRack[me],
					reshuffledDrawPile,
					numDumped: wordSoFar.length,
					letters
				});
				state = boardState;
				wordSoFar = '';
				dispatchToTable(tableId, dumpTiles);
			} else {
				console.log('NOT ENOUGH TILES TO DUMP', state.drawPile.length);
			}
		} else {
			console.log({ letter });
		}
	}
	function onKeyDown(e: { keyCode: any; key: string }) {
		switch (e.keyCode) {
			case 38:
				selectedRow -= 1;
				break;
			case 40:
				selectedRow += 1;
				break;
			case 37:
				selectedCol -= 1;
				break;
			case 39:
				selectedCol += 1;
				break;
			case 0x20:
				goVertical = !goVertical;
				break;
		}
		if (e.key) {
			let letter = e.key.toLowerCase();
			handleLetter(letter);
		}
		selectedRow = Math.max(0, selectedRow);
		selectedCol = Math.max(0, selectedCol);
		selectedRow = Math.min(numRows - 1, selectedRow);
		selectedCol = Math.min(numCols - 1, selectedCol);
	}
	function passTurn() {
		const passAction = pass(me);
		dispatchToTable(tableId, passAction);
	}
	let dictionary = generateDictionary(ospd);
	function challengePlay() {
		const lastPlay = $store.words.plays.slice(-1)[0];
		const allWords = [lastPlay.mainWord, lastPlay.sideWords].flat();
		const inDictionary = allWords.map((x) => dictionary.contains(x));
		let legal = true;
		inDictionary.forEach((x) => (legal = legal && x));
		if (!legal) {
			const numToRebag = lastPlay.letters.length;
			const sadPlayer = $store.words.players[lastPlay.playerIndex];
			const rebagLetters = $store.words.emailToRack[sadPlayer].slice(-numToRebag).split('');
			console.log('Rebagging ', rebagLetters);
			const newDrawPile = [$store.words.drawPile.split(''), rebagLetters].flat();
			const drawString = shuffle(newDrawPile).join('');
			const challengeAction = challenge(drawString);
			dispatchToTable(tableId, challengeAction);
		} else {
			const failed = fail_challenge(me);
			dispatchToTable(tableId, failed);
		}
	}
	$: myIndex = $store.words.players.indexOf(me);
	let lastPlayWasntMine = false;
	$: if ($store.words.plays.length > 0) {
		const lastPlay = $store.words.plays.slice(-1)[0];
		lastPlayWasntMine = lastPlay.playerIndex !== myIndex;
	}
	$: if ($store.words.currentPlayerIndex === myIndex) {
		if ($store.words.emailToPass[me]) {
			passTurn();
		}
	}
</script>

<div class="boardcontainer" bind:clientWidth={w} bind:clientHeight={h}>
	{#if state.board && state.board.length && state.board[0] && state.board[0].length}
		<div class="board" style="--wd:{boardWidth};--ht:{boardHeight}">
			{#each squareTypes as row, r}<div class="row">
					{#each row as square, c}{#if state.board[r][c]}<div
								style="--wd:{tileWidth};--ht:{tileHeight}"
								class="tile boardCell {tileToValue[state.board[r][c]] === 0 ? 'blank' : ''}"
							>
								{state.board[r][c]}<span>{tileToValue[state.board[r][c]]}</span>
							</div>{:else}<div
								on:click={cell(r, c)}
								class="{c === selectedCol && r === selectedRow
									? goVertical
										? 'arrow-down'
										: 'arrow-right'
									: ''} boardCell {square}"
								style="--wd:{tileWidth};--ht:{tileHeight}"
							>
								{content[square]}
							</div>{/if}{/each}
				</div>{/each}
		</div>
	{/if}
	{#if rack}
		<div class="rack">
			{#each rack.split('') as letter}<div
					style="--wd:{tileWidth};--ht:{tileHeight}"
					class="tile boardCell"
					on:click={() => handleLetter(letter)}
				>
					{letter}<span>{tileToValue[letter]}</span>
				</div>
			{/each}
		</div>
	{/if}
	<div class="controls">
		{#if wordSoFar}
			<Button on:click={() => handleLetter('enter')}>
				<Label>Score {score}</Label>
				<i class="material-icons" aria-hidden="true">arrow_forward</i>
			</Button>
			<Button on:click={() => handleLetter('escape')}>
				<Label>Undo</Label>
				<i class="material-icons" aria-hidden="true">undo</i>
			</Button>
			{#if $store.words.drawPile.length >= 7}
				<Button on:click={() => handleLetter('dump')}>
					<Label>Dump ({$store.words.drawPile.length} left)</Label>
					<i class="material-icons" aria-hidden="true">recycling</i>
				</Button>
			{/if}
		{/if}
		{#if lastPlayWasntMine}
			<Button on:click={challengePlay}>Challenge</Button>
		{/if}
		{#if $store.words.currentPlayerIndex === myIndex}
			<Button on:click={passTurn}>Pass</Button>
		{/if}
	</div>
</div>

<svelte:window on:keydown|preventDefault={onKeyDown} />

<style>
	.boardcontainer {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		display: flex;
		flex-direction: column;
	}

	.rack {
		display: flex;
	}

	.tile {
		background-color: maroon !important;
		color: ivory;
		align-items: center;
		justify-content: center;
		font-weight: 100 !important;
		font-size: calc(var(--wd) * 0.7px) !important;
		text-transform: uppercase;
	}
	.blank {
		color: yellowgreen;
	}
	.boardCell {
		width: calc(var(--wd) * 1px);
		height: calc(var(--ht) * 1px);
		font-size: calc(var(--wd) / 5 * 1px);
		font-family: sans-serif;
		font-weight: bold;
		text-align: center;
		vertical-align: center;
		display: flex;
		align-items: center;
		margin-top: 3px;
		margin-left: 3px;
		padding: 0;
		background-color: #aa9678;
		overflow: hidden;
	}
	.dls {
		background-color: #c8d2d7;
	}
	.tls {
		background-color: #508cbe;
	}
	.dws {
		background-color: #d29696;
	}
	.tws {
		background-color: #d26e6e;
	}
	.board {
		border: 2px solid black;
		margin: 2px;
		padding: 0;
		width: calc(var(--wd) * 1px);
		height: calc(var(--ht) * 1px);
		background-color: ivory;
		color: black;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.arrow-right {
		width: 0;
		height: 0;
		border-top: calc(var(--ht) / 2 * 1px) solid transparent;
		border-bottom: calc(var(--ht) / 2 * 1px) solid transparent;

		border-left: calc(var(--wd) * 1px) solid green;
	}

	.arrow-down {
		width: 0;
		height: 0;
		border-left: calc(var(--wd) / 2 * 1px) solid transparent;
		border-right: calc(var(--wd) / 2 * 1px) solid transparent;

		border-top: calc(var(--ht) * 1px) solid green;
	}
	.boardCell span {
		font-size: small;
		font-size: calc(var(--wd) * 0.25px) !important;
		position: relative;
		top: 1em;
		left: 0.2em;
	}
</style>
