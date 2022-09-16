import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;

export type MoveInfo = { move: string; timestamp: number };
export interface Solve {
	scramble: string;
	moves: MoveInfo[];
	time: number;
}
export interface SolvesState {
	allScrambles: string[];
	unattempted: string[];
	scrambleToId: { [scramble: string]: string };
	scrambleToSolve: { [scramble: string]: Solve[] };
}

export const add_scramble = createAction<{scramble: string, id: string}>('add_scramble');
export const add_solve = createAction<Solve>('add_solve');

export const initialState = {
	allScrambles: [],
	unattempted: [],
	scrambleToId: {},
	scrambleToSolve: {}
} as SolvesState;

export const solves = createReducer(initialState, (r) => {
	r.addCase(add_scramble, (state, action) => {
		state.allScrambles.push(action.payload.scramble);
		if (!state.scrambleToSolve[action.payload.scramble]) {
			state.unattempted.push(action.payload.scramble);
		}
		state.scrambleToId[action.payload.scramble] = action.payload.id;
		return state;
	}).addCase(add_solve, (state, action) => {
		state.unattempted = state.unattempted.filter((x) => x !== action.payload.scramble);
		if (!state.scrambleToSolve[action.payload.scramble]) {
			state.scrambleToSolve[action.payload.scramble] = [];
		}
		state.scrambleToSolve[action.payload.scramble].push(action.payload);
		return state;
	});
});
