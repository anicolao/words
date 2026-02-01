import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
// Upper case letter is blank.
export interface DuplicateState {
	board: string[][];
	width: number;
	height: number;
	drawPile: string;
	rack: string;
	// List of players for order.
	players: string[];
	letterm: string;
	wordm: string;
	gameOver: boolean;
	scores: number[];
	finalScoreAdjustment: number[];
	plays: TurnRecord[];
	emailToPlays: { [k: string]: TurnRecord[] };
	emailToBoards: { [k: string]: (string[][])[] };
	letterToValue: { [k: string]: number };
	lmTable: number[];
	wmTable: number[];
}

export const RACK_LENGTH = 8;

export interface TurnRecord {
	playerIndex: number;
	mainWord: string;
	sideWords: string[];
	letters: string;
	score: number;
	positions: { x: number; y: number }[];
	remainingRack: string;
}

export interface DuplicateMove {
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

export const play = createAction<DuplicateMove>('play_d');
export const initial_tiles = createAction<{
	draw_pile: string;
	tiles: string;
	values: string;
	letterm: string;
	wordm: string;
	num_rows: number;
	num_cols: number;
}>('initial_tiles_d');
export const draw_tiles = createAction('draw_tiles_d');
export const submit = createAction('submit_d');
export const join_game = createAction<string>('join_game_d');
export const leave_game = createAction<string>('leave_game_d');

export const initialDuplicateState = {
	board: [],
	width: 0,
	height: 0,
	drawPile: '',
	rack: '',
	players: [],
	letterm: '',
	wordm: '',
	gameOver: false,
	scores: [],
	finalScoreAdjustment: [],
	plays: [],
	emailToPlays: {},
	emailToBoards: {},
	letterToValue: {},
	lmTable: [],
	wmTable: []
} as DuplicateState;

export const duplicate = createReducer(initialDuplicateState, (r) => {
	function hasAdjacentTile(board: string[][], x: number, y: number) {
		return (
			isOccupied(board, x, y + 1) ||
			isOccupied(board, x, y - 1) ||
			isOccupied(board, x + 1, y) ||
			isOccupied(board, x - 1, y)
		);
	}

	// Will return false if out of bounds.
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
		const rack: string = state.rack;
		const remainingRack = extractLettersFromRack(letters, rack);
		const playerIndex = state.players.indexOf(payload.player);
		let mainWord = '';
		let score = 0;
		let mainWordScore = 0;
		let mainWordMultiplier = 1;
		const sideWords: string[] = [];
		if (remainingRack === undefined) {
            console.log('no such letters ', letters, rack)
            return state;
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
					if (!board[y][x]) {
                        return undefined;
                    }
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
			legalPlay = legalPlay || payload?.allowIllegalMoves || false;
		}
		if (!legalPlay) {
            console.log(`illegal play`)
            return state;
        }
		score += mainWordScore * mainWordMultiplier;
		score *= mainWord.length;
		if (state.emailToPlays[payload.player] === undefined) {
			state.emailToPlays[payload.player] = [...state.plays];
			state.emailToBoards[payload.player] = [];
		}
		const plays = state.emailToPlays[payload.player];
		const boards = state.emailToBoards[payload.player];
		const move = {
			playerIndex,
			mainWord,
			sideWords,
			score,
			letters,
			positions,
			remainingRack
		};
		if (plays.length === state.plays.length) {
			plays.push(move);
            boards.push(newBoard);
		} else {
			plays[plays.length - 1] = move;
            boards[boards.length - 1] = newBoard;
		}
		//state.rack = remainingRack;
		//state.scores[playerIndex] += score;
		//state.board = newBoard;
		return state;
	});

	r.addCase(join_game, (state, { payload }) => {
		state.players.push(payload);
		state.scores.push(0);
		state.finalScoreAdjustment.push(0);
		state.rack = '';
		return state;
	});
	r.addCase(leave_game, (state, { payload }) => {
		state.players = state.players.filter((x) => x !== payload);
		return state;
	});
	r.addCase(submit, (state) => {
		console.log(`SUBMIT`)
		const plays = Object.keys(state.emailToPlays);
		let bestPlay: TurnRecord | undefined = undefined;
		let bestBoard: string[][] | undefined = undefined;
		for (let i = 0; i < plays.length; ++i) {
			const playList = state.emailToPlays[plays[i]];
			const boardList = state.emailToBoards[plays[i]];
			const play = playList[playList.length-1];
			if (bestPlay === undefined || play?.score > bestPlay.score) {
				bestPlay = play;
				bestBoard = state.emailToBoards[plays[i]][playList.length-1];
			}
		}
		if (bestPlay && bestBoard) {
		console.log("COMMIT TILES")
			state.rack = bestPlay.remainingRack;
			state.board = bestBoard;
			state.plays.push(bestPlay);
			const numNeeded = RACK_LENGTH - state.rack.length;
			const drawn = state.drawPile.slice(0, numNeeded);
			state.drawPile = state.drawPile.slice(numNeeded);
			state.rack = state.rack + drawn;
		console.log("board after commit ", state.board, state.board.length, state.board[0].length)
			return state;
		}
		return state;
	});
	function draw(state: DuplicateState) {
		console.log("DRAW TILES")
		const rack = state.rack;
		const numNeeded = RACK_LENGTH - rack.length;
		const drawn = state.drawPile.slice(0, numNeeded);
		state.drawPile = state.drawPile.slice(numNeeded);
		state.rack = rack + drawn;
		if (state.drawPile.length === 0 && state.rack.length === 0) {
			state.gameOver = true;
		}
		return state;
	};
	r.addCase(draw_tiles, (state) => draw(state));
	r.addCase(initial_tiles, (state, { payload }) => {
		return {
			...initialDuplicateState,
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
});
