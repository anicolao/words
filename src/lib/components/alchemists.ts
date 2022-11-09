import type { AnyAction } from '@reduxjs/toolkit';
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
	required: string[];
	pending: AnyAction[];
	undone: AnyAction[];
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
	],
	required: ['discard_favour'],
	pending: [],
	undone: []
};

export interface AlchemistsState {
	gameType: string;
	ingredientPile: Ingredients[];
	faceupIngredients: Ingredients[];
	favoursPile: Favours[];
	players: string[];
	scores: number[];
	finalScoreAdjustment: number[];
	emailToPlayerState: { [k: string]: PlayerState };
	turnOrderToPlayerEmail: { [k: string]: string };
	currentPlayerIndex: number;
	round: number;
}

export const initial_setup = createAction<{
	gameType: 'base' | 'golem';
	ingredientPile: Ingredients[];
	favoursPile: Favours[];
}>('initial_setup');
export const join_game = createAction<string>('join_game');
export const queue_pending = createAction<{ player: string; action: AnyAction }>('queue_pending');
export const undo_pending = createAction<{ player: string }>('undo_pending');
export const redo_pending = createAction<{ player: string }>('redo_pending');
export const discard_favour = createAction<{ player: string; index: number }>('discard_favour');
export const commit = createAction<{ player: string }>('commit');
export const draw_ingredient = createAction<string>('draw_ingredient');
export const draw_favour = createAction<string>('draw_favour');
export const turn_order = createAction<{ player: string; order: string }>('turn_order');

export const initialState: AlchemistsState = {
	gameType: 'base',
	ingredientPile: [],
	faceupIngredients: [],
	favoursPile: [],
	players: [],
	scores: [],
	finalScoreAdjustment: [],
	turnOrderToPlayerEmail: {},
	emailToPlayerState: {},
	currentPlayerIndex: 0,
	round: 0
};

export const alchemists = createReducer(initialState, (r) => {
	r.addCase(initial_setup, (state, { payload }) => {
		let ret = { ...initialState, ...payload };
		ret.faceupIngredients = ret.ingredientPile.slice(0, 5);
		ret.ingredientPile = ret.ingredientPile.slice(5);
		return { ...ret };
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
	r.addCase(queue_pending, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		playerState.pending = [...playerState.pending, payload.action];
		playerState.undone = []; // clear the redo queue if we take a new action
		state.emailToPlayerState[payload.player] = playerState;
	});
	r.addCase(undo_pending, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		const undone = playerState.pending.splice(playerState.pending.length - 1, 1);
		playerState.pending = [...playerState.pending];
		playerState.undone = [...undone, ...playerState.undone];
		state.emailToPlayerState[payload.player] = playerState;
	});

	r.addCase(redo_pending, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		const redone = playerState.undone.splice(0, 1);
		playerState.undone = [...playerState.undone];
		playerState.pending = [...playerState.pending, ...redone];
		state.emailToPlayerState[payload.player] = playerState;
	});

	r.addCase(discard_favour, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		playerState.favours.splice(payload.index, 1);
		playerState.required = [...playerState.required, 'turn_order'];
	});
	r.addCase(commit, (state, { payload }) => {
		let playerState = state.emailToPlayerState[payload.player];
		const actions = playerState.pending;
		actions.forEach((a) => (state = alchemists(state, a)));
		playerState = state.emailToPlayerState[payload.player];
		playerState.pending = [];
		state.emailToPlayerState[payload.player] = playerState;
	});

	r.addCase(turn_order, (state, { payload }) => {
		console.log(payload);
		if (state.turnOrderToPlayerEmail[payload.order] === undefined) {
			state.turnOrderToPlayerEmail[payload.order] = payload.player;
			state.currentPlayerIndex++;
			if (state.currentPlayerIndex === state.players.length) {
				state.currentPlayerIndex %= state.players.length;
				const turns = Object.keys(state.turnOrderToPlayerEmail).sort();
				const playerOrder = [];
				for (let i = turns.length - 1; i >= 0; --i) {
					const email = state.turnOrderToPlayerEmail[turns[i]];
					playerOrder.push(email);
					const playerState = state.emailToPlayerState[email];
					playerState.required = [...playerState.required, 'place_cube'];
					playerState.required = [...playerState.required, 'place_cube'];
					playerState.required = [...playerState.required, 'place_cube'];
					if (state.round > 0) {
						playerState.required = [...playerState.required, 'place_cube'];
						if (state.players.length < 4) {
							playerState.required = [...playerState.required, 'place_cube'];
							if (state.players.length < 3) {
								playerState.required = [...playerState.required, 'place_cube'];
							}
						}
					}
				}
				state.players = playerOrder;
			}
		} else {
			throw 'move conflict for turn order';
		}
	});

	r.addMatcher(
		() => true,
		(state, action) => {
			const payload = action.payload;
			if (payload && payload.player) {
				const playerState = state.emailToPlayerState[payload.player];
				if (playerState) {
					const requiredIndex = playerState.required.indexOf(action.type);
					if (requiredIndex !== -1) {
						playerState.required.splice(requiredIndex, 1);
					}
					state.emailToPlayerState[payload.player] = playerState;
				}
			}
		}
	);
});
