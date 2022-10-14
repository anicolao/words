import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
// Upper case letter is blank.
export interface WordsState {
	board: string[][];
	width: number;
	height: number;
	drawPile: string;
	// Map player email to their rack.
	emailToRack: { [k: string]: string };
	emailToPass: { [k: string]: boolean };
	// List of players for order.
	players: string[];
	currentPlayerIndex: number;
	letterm: string;
	wordm: string;
	gameOver: boolean;
	scores: number[];
	finalScoreAdjustment: number[];
	plays: TurnRecord[];
	letterToValue: { [k: string]: number };
	lmTable: number[];
	wmTable: number[];
}

export interface TurnRecord {
	playerIndex: number;
	mainWord: string;
	sideWords: string[];
	letters: string;
	score: number;
	positions: { x: number; y: number }[];
	challenged: boolean;
}

export interface WordsMove {
	x: number;
	y: number;
	isVertical: boolean;
	letters: string;
	player: string;
	allowIllegalMoves?: boolean;
}

export function makeValues(values: string) {
	return values.split('').map((x) => parseInt(x, 16));
}
export function makeLetterToValueMap(tiles: string, values: string) {
	const tileToValue: { [letter: string]: number } = {};
	const tArray = tiles.split('');
	const vArray = makeValues(values);
	tArray.forEach((letter, i) => (tileToValue[letter] = vArray[i]));
	tArray.forEach((letter) => (tileToValue[letter.toUpperCase()] = tileToValue['_']));
	return tileToValue;
}

export const play = createAction<WordsMove>('play');
export const challenge = createAction<string>('challenge');
export const fail_challenge = createAction<string>('fail_challenge');
export const pass = createAction<string>('pass');
export const initial_tiles = createAction<{
	draw_pile: string;
	tiles: string;
	values: string;
	letterm: string;
	wordm: string;
	num_rows: number;
	num_cols: number;
}>('initial_tiles');
export const draw_tiles = createAction<string>('draw_tiles');
export const dump = createAction<{
	player: string;
	newRack: string;
	reshuffledDrawPile: string;
	numDumped: number;
	letters: string;
}>('dump');
export const join_game = createAction<string>('join_game');
export const leave_game = createAction<string>('leave_game');
export const set_current_player = createAction<number>('set_current_player');

export const initialWordsState = {
	board: [],
	width: 0,
	height: 0,
	drawPile: '',
	emailToRack: {},
	emailToPass: {},
	players: [],
	currentPlayerIndex: 0,
	letterm: '',
	wordm: '',
	gameOver: false,
	scores: [],
	finalScoreAdjustment: [],
	plays: [],
	letterToValue: {},
	lmTable: [],
	wmTable: []
} as WordsState;

export const words = createReducer(initialWordsState, (r) => {
	function hasAdjacentTile(board: string[][], x: number, y: number) {
		return (
			isOccupied(board, x, y + 1) ||
			isOccupied(board, x, y - 1) ||
			isOccupied(board, x + 1, y) ||
			isOccupied(board, x - 1, y)
		);
	}

	// Will return false if out of bound.
	function isOccupied(board: string[][], x: number, y: number) {
		if (x < 0 || x > board[0].length - 1 || y < 0 || y > board.length - 1) {
			return false;
		}
		return board[y][x] != undefined;
	}

	function extractLettersFromRack(letters: string, rack: string): string | undefined {
		for (const l of letters) {
			let newRack = rack.replace(l, '');
			if (l.toUpperCase() === l) {
				newRack = rack.replace('_', '');
			}
			if (newRack.length === rack.length) return undefined;
			rack = newRack;
		}
		return rack;
	}

	r.addCase(play, (state, { payload }) => {
		let { x, y } = payload;
		const { letters } = payload;
		let { isVertical } = payload;
		const newBoard = state.board.map((x) => [...x]);
		const positions = [];
		let legalPlay = payload?.allowIllegalMoves || false;
		const rack: string = state.emailToRack[payload.player] || '';
		const remainingRack = extractLettersFromRack(letters, rack);
		const playerIndex = state.players.indexOf(payload.player);
		let mainWord = '';
		let score = 0;
		let mainWordScore = 0;
		let mainWordMultiplier = 1;
		const sideWords: string[] = [];
		if (remainingRack === undefined) return state;
		if (!payload?.allowIllegalMoves) {
			if (state.emailToPass[payload.player]) return state;
		}
		let placedTile = false;
		function findSideWord(x: number, y: number, xoff: number, yoff: number) {
			const board = newBoard;
			if (isOccupied(board, x + xoff, y + yoff) || isOccupied(board, x - xoff, y - yoff)) {
				let sideWord = '';
				while (isOccupied(board, x + xoff, y + yoff)) {
					x += xoff;
					y += yoff;
				}
				xoff *= -1;
				yoff *= -1;
				do {
					if (!board[y][x]) return undefined;
					sideWord += board[y][x];
					x += xoff;
					y += yoff;
				} while (isOccupied(board, x, y));
				return sideWord;
			}
			return undefined;
		}
		let prefix = findSideWord(x, y, isVertical ? 0 : -1, isVertical ? -1 : 0);
		if (!prefix && letters.length === 1) {
			// check for wrong play direction
			const suffix = findSideWord(x, y, isVertical ? 0 : 1, isVertical ? 1 : 0);
			if (!suffix) {
				isVertical = !isVertical;
				prefix = findSideWord(x, y, isVertical ? 0 : -1, isVertical ? -1 : 0);
			}
		}
		if (prefix) {
			mainWord = prefix;
			prefix.split('').forEach((x) => (mainWordScore += state.letterToValue[x]));
		}
		for (const l of letters) {
			while (newBoard[y][x]) {
				if (!placedTile) {
					const addedLetter = newBoard[y][x];
					mainWord += addedLetter;
					mainWordScore += state.letterToValue[addedLetter];
				}
				placedTile = false;
				isVertical ? y++ : x++;
				if (x >= state.width || y >= state.height) {
					console.error('Out of bounds play', payload);
					return state;
				}
			}
			if (x === Math.floor(state.width / 2) && y === Math.floor(state.height / 2)) legalPlay = true;
			newBoard[y][x] = l;
			positions.push({ x, y });
			mainWord += l;
			const letterMultiplier = state.lmTable[y * state.width + x];
			mainWordMultiplier *= state.wmTable[y * state.width + x];
			mainWordScore += state.letterToValue[l] * letterMultiplier;
			placedTile = true;
			const potentialSideWord = findSideWord(x, y, isVertical ? -1 : 0, isVertical ? 0 : -1);
			if (potentialSideWord) {
				let swScore = 0;
				potentialSideWord.split('').forEach((x) => (swScore += state.letterToValue[x]));
				swScore -= state.letterToValue[l];
				const letterMultiplier = state.lmTable[y * state.width + x];
				const wordMultiplier = state.wmTable[y * state.width + x];
				swScore += state.letterToValue[l] * letterMultiplier;
				score += wordMultiplier * swScore;
				sideWords.push(potentialSideWord);
			}
			legalPlay = legalPlay || hasAdjacentTile(state.board, x, y);
			while (newBoard[y][x]) {
				if (!placedTile) {
					const addedLetter = newBoard[y][x];
					mainWord += addedLetter;
					mainWordScore += state.letterToValue[addedLetter];
				}
				placedTile = false;
				isVertical ? y++ : x++;
				if (x >= state.width || y >= state.height) {
					break;
				}
			}
		}
		if (legalPlay) {
			legalPlay = payload.player === state.players[state.currentPlayerIndex];
			legalPlay = legalPlay || payload?.allowIllegalMoves || false;
		}
		if (!legalPlay) return state;
		score += mainWordScore * mainWordMultiplier;
		if (letters.length === 7) {
			score += 50;
		}
		state.plays.push({
			playerIndex,
			mainWord,
			sideWords,
			score,
			letters,
			positions,
			challenged: false
		});
		state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
		state.emailToRack[payload.player] = remainingRack;
		state.scores[playerIndex] += score;
		state.board = newBoard;
		return state;
	});
	r.addCase(dump, (state, { payload }) => {
		if (state.emailToPass[payload.player]) return state;
		const playerIndex = state.players.indexOf(payload.player);
		const mainWord = payload.numDumped ? `Dump ${payload.numDumped}` : 'Dump Tiles';
		state.plays.push({
			playerIndex,
			mainWord,
			sideWords: [],
			score: 0,
			letters: payload.letters,
			positions: [],
			challenged: false
		});
		state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
		state.emailToRack[payload.player] = payload.newRack;
		state.drawPile = payload.reshuffledDrawPile;
		return state;
	});

	r.addCase(join_game, (state, { payload }) => {
		state.players.push(payload);
		state.scores.push(0);
		state.finalScoreAdjustment.push(0);
		state.emailToRack[payload] = '';
		return state;
	});
	r.addCase(leave_game, (state, { payload }) => {
		state.players = state.players.filter((x) => x !== payload);
		delete state.emailToRack[payload];
		return state;
	});
	r.addCase(draw_tiles, (state, { payload }) => {
		const rack = state.emailToRack[payload];
		const numNeeded = 7 - rack.length;
		const drawn = state.drawPile.slice(0, numNeeded);
		state.drawPile = state.drawPile.slice(numNeeded);
		state.emailToRack[payload] = rack + drawn;
		if (state.drawPile.length === 0 && state.emailToRack[payload].length === 0) {
			state.gameOver = true;
			let bonusScore = 0;
			state.players.forEach((player, i) => {
				const rack = state.emailToRack[player];
				let scoreRack = 0;
				rack.split('').forEach((x) => (scoreRack += state.letterToValue[x]));
				bonusScore += scoreRack;
				state.finalScoreAdjustment[i] = -scoreRack;
			});
			const playerIndex = state.players.indexOf(payload);
			state.finalScoreAdjustment[playerIndex] += bonusScore;
			state.finalScoreAdjustment.forEach((adjust, i) => (state.scores[i] += adjust));
		}
		return state;
	});
	r.addCase(initial_tiles, (state, { payload }) => {
		return {
			...initialWordsState,
			drawPile: payload.draw_pile,
			tiles: payload.tiles,
			values: payload.values,
			letterm: payload.letterm,
			wordm: payload.wordm,
			width: payload.num_cols,
			height: payload.num_rows,
			letterToValue: makeLetterToValueMap(payload.tiles, payload.values),
			lmTable: makeValues(payload.letterm),
			wmTable: makeValues(payload.wordm),
			board: new Array(payload.num_rows).fill('').map(() => new Array(payload.num_cols))
		};
	});
	r.addCase(pass, (state, { payload }) => {
		const playerIndex = state.players.indexOf(payload);
		if (playerIndex === state.currentPlayerIndex) {
			const forced = state.emailToPass[payload];
			state.emailToPass[payload] = false;
			state.plays.push({
				playerIndex,
				mainWord: forced ? 'Failed Challenge' : 'PASS',
				sideWords: [],
				score: 0,
				letters: '',
				positions: [],
				challenged: false
			});
			state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
		}
	});
	r.addCase(challenge, (state, { payload }) => {
		state.drawPile = payload;
		const checkChallenge = { ...state.plays.slice(-1)[0] };
		if (checkChallenge.challenged === false) {
			const lastTurn = { ...checkChallenge, challenged: true };
			state.plays[state.plays.length - 1] = lastTurn;
			const numDrawn = lastTurn.letters.length;
			const challengedPlayer = state.players[lastTurn.playerIndex];
			const length = state.emailToRack[challengedPlayer].length;
			const challengedRack =
				state.emailToRack[challengedPlayer].slice(0, length - numDrawn) + lastTurn.letters;
			state.emailToRack[challengedPlayer] = challengedRack;
			state.scores[lastTurn.playerIndex] -= lastTurn.score;
			for (let i = 0; i < lastTurn.positions.length; ++i) {
				const { x, y } = lastTurn.positions[i];
				state.board[y][x] = '';
			}
		}
	});
	r.addCase(fail_challenge, (state, { payload }) => {
		state.emailToPass[payload] = true;
	});

	r.addCase(set_current_player, (state, { payload }) => {
		state.currentPlayerIndex = payload % state.players.length;
	});
});
