import * as toolkitRaw from '@reduxjs/toolkit';
import { play } from './words';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;

export enum Seals {
	hedgeRed,
	hedgeGreen,
	hedgeBlue,
	threePoints,
	fivePoints
}
export enum Favours {
	assistant,
	associate,
	barmaid,
	custodian,
	herbalist,
	merchant,
	shopkeeper,
	sage
}
export enum Ingredients {
	toadstool,
	fern,
	toad,
	claw,
	flower,
	mandrake,
	scorpion,
	feather
}
export interface PlayerState {
	coins: number;
	ingredients: Ingredients[];
	favours: Favours[];
	seals: Seals[];
}
const initialPlayerState = {
	coins: 2,
	ingredients: [],
	favours: [],
	seals: [
		Seals.hedgeRed,
		Seals.hedgeRed,
		Seals.hedgeGreen,
		Seals.hedgeGreen,
		Seals.hedgeBlue,
		Seals.hedgeBlue,
		Seals.threePoints,
		Seals.threePoints,
		Seals.threePoints,
		Seals.fivePoints,
		Seals.fivePoints
	]
};

export interface AlchemistsState {
	gameType: string;
	ingredientPile: Ingredients[];
	favoursPile: Favours[];
	players: string[];
	scores: number[];
	finalScoreAdjustment: number[];
	emailToPlayerState: { [k: string]: PlayerState };
}

export const initial_setup = createAction<{
	gameType: 'base' | 'golem';
	ingredientPile: Ingredients[];
	favoursPile: Favours[];
}>('initial_setup');
export const join_game = createAction<string>('join_game');
export const draw_ingredient = createAction<string>('draw_ingredient');
export const draw_favour = createAction<string>('draw_favour');

export const initialState: AlchemistsState = {
	gameType: 'base',
	ingredientPile: [],
	favoursPile: [],
	players: [],
	scores: [],
	finalScoreAdjustment: [],
	emailToPlayerState: {}
};

export const alchemists = createReducer(initialState, (r) => {
	r.addCase(initial_setup, (state, { payload }) => {
		return { ...initialState, ...payload };
	});
	r.addCase(join_game, (state, { payload }) => {
		state.players.push(payload);
		state.scores.push(10);
		state.finalScoreAdjustment.push(0);
		state.emailToPlayerState[payload] = { ...initialPlayerState };
		return state;
	});
	r.addCase(draw_ingredient, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload];
		playerState.ingredients = [...playerState.ingredients, ...state.ingredientPile.splice(0, 1)];
		state.emailToPlayerState[payload] = playerState;
	});
	r.addCase(draw_favour, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload];
		playerState.favours = [...playerState.favours, ...state.favoursPile.splice(0, 1)];
		state.emailToPlayerState[payload] = playerState;
	});
});
