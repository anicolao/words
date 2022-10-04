import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
// Upper case letter is blank.
export interface WordsState {
	board: string;
	width: number;
	height: number;
}

export interface WordsMove {
	x: number;
	y: number;
	isVertical: boolean;
	letters: string;
}

export const play = createAction('play');

export const initialWordsState = {
	board: new Array(15 * 15 + 1).join(' '),
	width: 15,
	height: 15,
} as WordsState;

export const words = createReducer(initialWordsState, (r) => {
	r.addCase(play, (state, action) => {
		return state;
	})
});
