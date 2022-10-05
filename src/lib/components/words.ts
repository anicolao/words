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
	// List of players for order.
	players: string[];
	currentPlayerIndex: number;
}

export interface WordsMove {
	x: number;
	y: number;
	isVertical: boolean;
	letters: string;
	player: string;
	allowIllegalMoves?: boolean;
}

export const play = createAction<WordsMove>('play');
export const initial_tiles = createAction<string>('initial_tiles');
export const draw_tiles = createAction<string>('draw_tiles');
export const join_game = createAction<string>('join_game');
export const set_current_player = createAction<number>('set_current_player');

export const initialWordsState = {
	board: new Array(15).fill('').map((x) => new Array(15)),
	width: 15,
	height: 15,
	drawPile: '',
	emailToRack: {},
	players: [],
	currentPlayerIndex: 0
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
		const { letters, isVertical } = payload;
		const newBoard = state.board.map((x) => [...x]);
		let legalPlay = payload?.allowIllegalMoves || false;
		const rack: string = state.emailToRack[payload.player] || '';
		const remainingRack = extractLettersFromRack(letters, rack);
		if (remainingRack === undefined) return state;
		for (const l of letters) {
			while (newBoard[y][x]) {
				isVertical ? y++ : x++;
				if (x >= state.width || y >= state.height) {
					console.error('Out of bounds play', payload);
					return state;
				}
			}
			if (x === 7 && y === 7) legalPlay = true;
			newBoard[y][x] = l;
			legalPlay = legalPlay || hasAdjacentTile(state.board, x, y);
		}
		if (legalPlay) {
			legalPlay = payload.player === state.players[state.currentPlayerIndex];
			legalPlay = legalPlay || payload?.allowIllegalMoves || false;
		}
		if (!legalPlay) return state;
		state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
		state.emailToRack[payload.player] = remainingRack;
		state.board = newBoard;
		return state;
	});

	r.addCase(join_game, (state, { payload }) => {
		state.players.push(payload);
		state.emailToRack[payload] = '';
		return state;
	});
	r.addCase(draw_tiles, (state, { payload }) => {
		const rack = state.emailToRack[payload];
		const numNeeded = 7 - rack.length;
		const drawn = state.drawPile.slice(0, numNeeded);
		state.drawPile = state.drawPile.slice(numNeeded);
		state.emailToRack[payload] = rack + drawn;
		return state;
	});
	r.addCase(initial_tiles, (state, { payload }) => {
		return { ...initialWordsState, drawPile: payload };
	});

	r.addCase(set_current_player, (state, { payload }) => {
		state.currentPlayerIndex = payload % state.players.length;
	});
});
