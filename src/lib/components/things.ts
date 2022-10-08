import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
// Upper case letter is blank.
export interface ThingsState {
	currentCategory: string;
	playerToAnswer: { [k: string]: string };
	roundReady: boolean;
	roundOver: boolean;
	players: string[];
	alive: boolean[];
	currentPlayerIndex: number;
	scores: number[];
}

//export const play = createAction<WordsMove>('play');
export const join_game = createAction<string>('join_game');
export const leave_game = createAction<string>('leave_game');
export const set_current_player = createAction<number>('set_current_player');
export const set_category = createAction<string>('set_category');
export const answer_category = createAction<{ answer: string; player: string }>('answer_category');
export const guesses = createAction<{ player: string; dead_player: string }>('eliminates');

export const initialThingsState = {
	currentCategory: '',
	playerToAnswer: {},
	players: [],
	alive: [],
	roundReady: false,
	roundOver: false,
	currentPlayerIndex: 0,
	scores: []
} as ThingsState;

export const things = createReducer(initialThingsState, (r) => {
	r.addCase(join_game, (state, { payload }) => {
		state.players.push(payload);
		state.scores.push(0);
		state.alive.push(true);
		return state;
	});
	r.addCase(leave_game, (state, { payload }) => {
		state.players = state.players.filter((x) => x !== payload);
		return state;
	});
	r.addCase(set_current_player, (state, { payload }) => {
		state.currentPlayerIndex = payload % state.players.length;
	});
	r.addCase(set_category, (state, { payload }) => {
		state.currentCategory = payload;
		state.alive = state.players.map((x) => true);
		state.playerToAnswer = {};
		state.roundOver = false;
		state.roundReady = false;
	});
	r.addCase(answer_category, (state, { payload }) => {
		const playerIndex = state.players.indexOf(payload.player);
		state.playerToAnswer[payload.player] = payload.answer;
		state.alive[playerIndex] = true;
		let roundReady = true;
		state.players.forEach((player) => {
			roundReady = roundReady && !!state.playerToAnswer[player];
		});
		state.roundReady = roundReady;
	});
	r.addCase(guesses, (state, { payload }) => {
		const deadPlayerIndex = state.players.indexOf(payload.dead_player);
		const playerIndex = state.players.indexOf(payload.player);
		state.alive[deadPlayerIndex] = false;
		state.scores[playerIndex] += 1;
		let numAlive = 0;
		state.alive.forEach((alive) => (alive ? numAlive++ : 0));
		if (numAlive === 1) {
			state.scores[playerIndex] += 1;
			state.roundOver = true;
			state.currentPlayerIndex += 1;
			state.currentPlayerIndex %= state.players.length;
		}
		return state;
	});
});
