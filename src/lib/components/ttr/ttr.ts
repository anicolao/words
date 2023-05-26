import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;

export enum Wagons {
	black = "black",
	blue = "blue",
	brown = "brown",
	green = "green",
	loco = "loco",
	purple = "purple",
	red = "red",
	tunnel = "tunnel",
	white = "white",
	yellow = "yellow",
}
export interface PlayerState {
	wagons: Wagons[];
}
const initialPlayerState = {
	wagons: [],
};

export interface TTRState {
	gameType: string;
	wagonsPile: Wagons[];
	players: string[];
	emailToPlayerState: { [k: string]: PlayerState };
}

export const initial_setup = createAction<{
	gameType: 'swiss',
	wagonsPile: Wagons[];
}>('initial_setup');
export const join_game = createAction<string>('join_game');
export const draw_wagon = createAction<string>('draw_wagon');

export const initialState: TTRState = {
	gameType: 'swiss',
	wagonsPile: [],
	players: [],
	emailToPlayerState: {}
};

export const ttr = createReducer(initialState, (r) => {
	r.addCase(initial_setup, (state, { payload }) => {
		return { ...initialState, ...payload };
	});
	r.addCase(join_game, (state, { payload }) => {
		state.players.push(payload);
		state.emailToPlayerState[payload] = { ...initialPlayerState };
		return state;
	});
	r.addCase(draw_wagon, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload];
		playerState.wagons = [...playerState.wagons, ...state.wagonsPile.splice(0, 1)];
		state.emailToPlayerState[payload] = playerState;
	});
});
