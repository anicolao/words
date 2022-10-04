import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
// Upper case letter is blank.
export interface GameDefsState {
	games: GameDefinition[];
}

export interface GameDefinition {
	id: string;
	properties: { [k: string]: string };
}

export const define_game = createAction<GameDefinition>('define_game');

export const initialGameDefsState = {
	games: []
} as GameDefsState;

export const gamedefs = createReducer(initialGameDefsState, (r) => {
	r.addCase(define_game, (state, { payload }) => {
		state.games.push(payload);
	});
});
