<script lang="ts">
	import { words as ospd } from '$lib/components/ospd4';
	import { store } from '$lib/store';
	import Button, { Label } from '@smui/button';
	import IconButton from '@smui/icon-button/src/IconButton.svelte';
	import { dispatchToTable, shuffle } from './gameutil';
	import { generateDictionary } from './trie';
	import {
		draw_tiles,
		play,
		initialDuplicateState,
		type DuplicateState,
		duplicate,
		submit
	} from './duplicate';
	import Avatar from './Avatar.svelte';

	export let tableId = '';
	export let numRows = 0;
	export let numCols = 0;
	export let letterm = '';
	export let wordm = '';
	export let tiles = '';
	export let values = '';
	export let rack = '';
	export let boardState: DuplicateState = initialDuplicateState;
	export let displayBoard = boardState.board;
	$: state = boardState;
	let lastBoard = displayBoard;
	$: if (state.board !== lastBoard) {
		console.log(`${JSON.stringify(lastBoard)}`);
		console.log(`vs ${JSON.stringify(state.board)}`);
		lastBoard = state.board;
		displayBoard = boardState.board;
	}
	$: evaluatePlay(boardState);
	let w: number;
	let h: number;

	let pendingPlay = false;
	function evaluatePlay(newState: DuplicateState) {
		console.log(`Play was made; was it ours?`);
		if (state.emailToPlays[me]?.length > state.plays.length && !pendingPlay) {
			const myPlay = state.emailToPlays[me].slice(-1)[0];
			const myBoard = state.emailToBoards[me].slice(-1)[0];
			console.log(`Yes! ${JSON.stringify(myPlay)}`);
			let legal = true;
			legal = legal && dictionary.contains(myPlay.mainWord);
			myPlay.sideWords.forEach((w) => (legal &&= dictionary.contains(w)));
			displayBoard = [];
			for (let row = 0; row < boardState.board.length; ++row) {
				const r: (string | undefined)[] = [];
				displayBoard.push(r);
				for (let col = 0; col < boardState.board[row].length; ++col) {
					if (boardState.board[row][col] !== undefined) {
						r.push(boardState.board[row][col]);
					} else if (myBoard[row][col] !== undefined) {
						r.push(myBoard[row][col] + `|${legal}`);
					} else {
						r.push(undefined);
					}
				}
			}
			console.log('board', displayBoard);
		} else {
			if (state.emailToPlays[me]?.length > state.plays.length) {
				previewMove();
			}
		}
	}

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
		const midR = Math.floor(numRows / 2);
		const midC = Math.floor(numCols / 2);
		for (let row = 0; row < numRows; ++row) {
			squareTypes[row] = [];
			for (let col = 0; col < numCols; ++col) {
				const lmult = letterMultipliers[row * numCols + col];
				const wmult = wordMultipliers[row * numCols + col];
				if (lmult === 2) squareTypes[row].push('dls');
				else if (lmult === 3) squareTypes[row].push('tls');
				else if (wmult === 2) squareTypes[row].push('dws');
				else if (wmult === 3) squareTypes[row].push('tws');
				else if (row === midR && col === midC) squareTypes[row].push('start');
				else squareTypes[row].push('nil');
			}
		}
	}
	const content: { [k: string]: string } = {
		dls: 'DOUBLE LETTER SCORE',
		tls: 'TRIPLE LETTER SCORE',
		dws: 'DOUBLE WORD SCORE',
		tws: 'TRIPLE WORD SCORE',
		start: 'START HERE PLEASE',
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
	$: rack = remainingRack || state.rack;
	let remainingRack = '';
	let wordSoFar = '';
	let score = 0;
	async function previewMove() {
		const move = play({
			x: selectedCol,
			y: selectedRow,
			isVertical: goVertical,
			letters: wordSoFar,
			player: me,
			allowIllegalMoves: true
		});
		console.log(`preview ${JSON.stringify(move)}`);
		state = duplicate(boardState, move);
		if (state.emailToPlays[me]?.length > state.plays.length) {
			console.log({ plays: state.emailToPlays[me] });
			const myPlay = state.emailToPlays[me].slice(-1)[0];
			score = myPlay.score;
			remainingRack = myPlay.remainingRack;
			displayBoard = state.emailToBoards[me].slice(-1)[0];
		} else {
			state = boardState;
			wordSoFar = wordSoFar.slice(0, -1);
		}
	}
	function handleLetter(letter: string) {
		if (letter.length === 1 && letter >= 'a' && letter <= 'z') {
			pendingPlay = true;
			wordSoFar += letter;
			previewMove();
		} else if (letter === 'enter') {
			pendingPlay = false;
			const move = play({
				x: selectedCol,
				y: selectedRow,
				isVertical: goVertical,
				letters: wordSoFar,
				player: me
			});
			console.log('submit move', move);
			state = duplicate(boardState, move);
			if (state.emailToPlays[me]?.length > state.plays.length) {
				state = boardState;
				dispatchToTable(tableId, move);
			} else {
				console.log('Not your turn / illegal move?', { rack, srack: state.rack });
				state = boardState;
			}
			remainingRack = '';
			wordSoFar = '';
		} else if (letter === 'escape') {
			wordSoFar = '';
			state = boardState;
		} else if (letter === 'backspace') {
			wordSoFar = wordSoFar.slice(0, -1);
			previewMove();
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
	let dictionary = generateDictionary(ospd);
	$: myIndex = $store.words.players.indexOf(me);
	let lastPlayWasntMine = false;
	$: if ($store.words.plays.length > 0) {
		const lastPlay = $store.words.plays.slice(-1)[0];
		lastPlayWasntMine = lastPlay.playerIndex !== myIndex;
	}

	function letter(s: string) {
		return s[0];
	}
	function style(s: string) {
		const fields = s.split('|');
		if (fields.length > 1) {
			if (fields[1] === 'true') {
				return 'legal';
			}
			return 'illegal';
		}
	}

	function nextTurn() {
		dispatchToTable(tableId, submit());
	}

	function hasTurnReady(email: string) {
		return state.emailToPlays[email]?.length > state.plays.length;
	}
	$: ready = Object.keys($store.duplicate.emailToPlays).filter(hasTurnReady);

	$: if (displayBoard) {
		console.log(`Board changed ${JSON.stringify(displayBoard)}`);
	}
</script>

<div class="boardcontainer" bind:clientWidth={w} bind:clientHeight={h}>
	{#if displayBoard && displayBoard.length && displayBoard[0] && displayBoard[0].length}
		<div class="board" style="--wd:{boardWidth};--ht:{boardHeight}">
			{#each squareTypes as row, r}<div class="row">
					{#each row as square, c}{#if displayBoard && displayBoard[r] && displayBoard[r][c]}<div
								style="--wd:{tileWidth};--ht:{tileHeight}"
								class="tile boardCell {tileToValue[letter(displayBoard[r][c])] === 0
									? 'blank'
									: ''} {style(displayBoard[r][c])}"
							>
								{letter(displayBoard[r][c])}<span>{tileToValue[letter(displayBoard[r][c])]}</span>
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
		{/if}
	</div>
	<div class="turncontrols">
		{#each ready as email}
			<Avatar player={email} />
		{/each}
		<Button on:click={nextTurn}>Start Next Round</Button>
	</div>
</div>

<svelte:window on:keydown|preventDefault={onKeyDown} />

<style>
	.turncontrols {
		border: 1px solid green;
		margin: 1em;
		padding: 1em;
	}
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
	.legal {
		color: yellowgreen;
	}
	.illegal {
		color: orange;
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
	.start {
		background-color: #33aa33;
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
