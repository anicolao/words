import type { AnyAction } from '@reduxjs/toolkit';
import * as toolkitRaw from '@reduxjs/toolkit';
import type { WritableDraft } from 'immer/dist/internal';
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
export const favourToPhase: string[] = [
	'place_cube',
	'place_cube',
	'sell',
	'place_cube',
	'immediate',
	'sell',
	'shop',
	'transmute'
];
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
export enum Alchemicals {
	BlueMinus,
	BluePlus,
	GreenMinus,
	GreenPlus,
	RedMinus,
	RedPlus,
	Minus,
	Plus,
	Soup
}
export const MixesTable: { [k: number]: Alchemicals } = {};
MixesTable[Alchemicals.BlueMinus * 10 + Alchemicals.Minus] = Alchemicals.RedMinus;
MixesTable[Alchemicals.BlueMinus * 10 + Alchemicals.Plus] = Alchemicals.GreenPlus;
MixesTable[Alchemicals.BluePlus * 10 + Alchemicals.Minus] = Alchemicals.GreenMinus;
MixesTable[Alchemicals.BluePlus * 10 + Alchemicals.Plus] = Alchemicals.RedPlus;
MixesTable[Alchemicals.BlueMinus * 10 + Alchemicals.BluePlus] = Alchemicals.Soup;

MixesTable[Alchemicals.GreenMinus * 10 + Alchemicals.Minus] = Alchemicals.BlueMinus;
MixesTable[Alchemicals.GreenMinus * 10 + Alchemicals.Plus] = Alchemicals.RedPlus;
MixesTable[Alchemicals.GreenPlus * 10 + Alchemicals.Minus] = Alchemicals.RedMinus;
MixesTable[Alchemicals.GreenPlus * 10 + Alchemicals.Plus] = Alchemicals.BluePlus;
MixesTable[Alchemicals.GreenMinus * 10 + Alchemicals.GreenPlus] = Alchemicals.Soup;

MixesTable[Alchemicals.RedMinus * 10 + Alchemicals.Minus] = Alchemicals.GreenMinus;
MixesTable[Alchemicals.RedMinus * 10 + Alchemicals.Plus] = Alchemicals.BluePlus;
MixesTable[Alchemicals.RedPlus * 10 + Alchemicals.Minus] = Alchemicals.BlueMinus;
MixesTable[Alchemicals.RedPlus * 10 + Alchemicals.Plus] = Alchemicals.GreenPlus;
MixesTable[Alchemicals.RedMinus * 10 + Alchemicals.RedPlus] = Alchemicals.Soup;

MixesTable[Alchemicals.Minus * 10 + Alchemicals.Plus] = Alchemicals.Soup;

MixesTable[Alchemicals.BlueMinus * 10 + Alchemicals.GreenMinus] = Alchemicals.BlueMinus;
MixesTable[Alchemicals.BlueMinus * 10 + Alchemicals.RedPlus] = Alchemicals.BlueMinus;
MixesTable[Alchemicals.BlueMinus * 10 + Alchemicals.RedMinus] = Alchemicals.RedMinus;
MixesTable[Alchemicals.BlueMinus * 10 + Alchemicals.GreenPlus] = Alchemicals.GreenPlus;

MixesTable[Alchemicals.BluePlus * 10 + Alchemicals.GreenMinus] = Alchemicals.GreenMinus;
MixesTable[Alchemicals.BluePlus * 10 + Alchemicals.RedPlus] = Alchemicals.RedPlus;
MixesTable[Alchemicals.BluePlus * 10 + Alchemicals.RedMinus] = Alchemicals.BluePlus;
MixesTable[Alchemicals.BluePlus * 10 + Alchemicals.GreenPlus] = Alchemicals.BluePlus;

MixesTable[Alchemicals.GreenMinus * 10 + Alchemicals.RedPlus] = Alchemicals.RedPlus;
MixesTable[Alchemicals.GreenMinus * 10 + Alchemicals.RedMinus] = Alchemicals.GreenMinus;

MixesTable[Alchemicals.GreenPlus * 10 + Alchemicals.RedPlus] = Alchemicals.GreenPlus;
MixesTable[Alchemicals.GreenPlus * 10 + Alchemicals.RedMinus] = Alchemicals.RedMinus;

export enum Artifacts_I {
	periscope,
	mortar,
	speed,
	discount,
	printingpress,
	respect
}
const Costs_I = [3, 3, 4, 3, 4, 4];

export enum Artifacts_II {
	chalice,
	rhetoric,
	thinking,
	trunk,
	hypnotic,
	authority
}
const Costs_II = [4, 4, 4, 3, 3, 4];

export enum Artifacts_III {
	featherincap,
	cabinet,
	altar,
	wisdom,
	mirror,
	cup
}
const Costs_III = [3, 5, 1, 4, 4, 4];
const Costs = [Costs_I, Costs_II, Costs_III];
export interface BonusInfo {
	coins: number;
	favours: number;
	ingredients: number;
}
export interface PlayerState {
	coins: number;
	ingredients: Ingredients[];
	artifacts: number[];
	favours: Favours[];
	seals: Seals[];
	required: string[];
	currentActionKey: string;
	pending: AnyAction[];
	undone: AnyAction[];
	color: number;
	turnToBonusMap: { [k: string]: BonusInfo };
	hasStartButton: boolean;
	mixes: [Ingredients, Ingredients, Alchemicals][];
	grid: string[];
}
const initialPlayerState = {
	coins: 2,
	ingredients: [],
	artifacts: [],
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
	required: ['discard_favour', 'commit'],
	currentActionKey: 'discard_favour',
	pending: [],
	color: -1,
	hasStartButton: false,
	mixes: [],
	grid: [
		'         ',
		'         ',
		'         ',
		'         ',
		'         ',
		'         ',
		'         ',
		'         '
	],
	turnToBonusMap: {
		turn9_paralyzed: { coins: 0, favours: 1, ingredients: 1 }, // paralyzed
		turn0: { coins: -1, favours: 0, ingredients: 0 }, // pay
		turn1: { coins: 0, favours: 0, ingredients: 0 }, //
		turn2: { coins: 0, favours: 0, ingredients: 1 }, // 1 ingredient
		turn3: { coins: 0, favours: 0, ingredients: 2 }, // two
		turn4: { coins: 0, favours: 1, ingredients: 1 }, // 1 of each
		turn5: { coins: 0, favours: 2, ingredients: 0 }, // two favours
		turn6: { coins: 0, favours: 1, ingredients: 2 } // three player only
	},
	undone: []
};

export const actionToColumnCubeCount: { [k: string]: number[] } = {
	forage: [1, 1, 1],
	custodian: [1],
	transmute: [1, 2],
	sell: [2],
	shop: [1, 2],
	debunk: [1, 1],
	publish: [1, 2],
	student: [1, 1],
	drink: [1, 1],
	exhibit: [1, 1, 1, 1]
};

export interface AlchemistsState {
	gameType: string;
	ingredientPile: Ingredients[];
	faceupIngredients: Ingredients[];
	favoursPile: Favours[];
	shop: [Artifacts_I[], Artifacts_II[], Artifacts_III[]];
	levelI: Artifacts_I[];
	levelII: Artifacts_II[];
	levelIII: Artifacts_III[];
	players: string[];
	scores: number[];
	finalScoreAdjustment: number[];
	emailToPlayerState: { [k: string]: PlayerState };
	turnOrderToPlayerEmail: { [k: string]: string };
	cubeActionToPlayerEmails: { [k: string]: string[] };
	completedCubeActionToPlayerEmails: { [k: string]: string[] };
	currentPlayerIndex: number;
	round: number;
	studentSick: boolean;
	ingredientToAlchemical: Alchemicals[];
}

export const initial_setup = createAction<{
	gameType: 'base' | 'golem';
	ingredientPile: Ingredients[];
	answerKey: Alchemicals[];
	favoursPile: Favours[];
	levelI: Artifacts_I[];
	levelII: Artifacts_II[];
	levelIII: Artifacts_III[];
}>('initial_setup');
export const join_game = createAction<string>('join_game');
export const queue_pending = createAction<{ player: string; action: AnyAction }>('queue_pending');
export const undo_pending = createAction<{ player: string }>('undo_pending');
export const redo_pending = createAction<{ player: string }>('redo_pending');
export const discard_favour = createAction<{ player: string; index: number }>('discard_favour');
export const discard_ingredient = createAction<{ player: string; index: number }>(
	'discard_ingredient'
);
export const play_favour = createAction<{ player: string; index: number }>('play_favour');
export const commit = createAction<{ player: string }>('commit');
export const draw_ingredient = createAction<{ player: string }>('draw_ingredient');
export const forage = createAction<{ player: string; index: number }>('forage');
export const shop = createAction<{ player: string; index: number }>('shop');
export const renounce = createAction<{ player: string; action: string }>('renounce');
export const transmute = createAction<{ player: string; index: number }>('transmute');
export const draw_favour = createAction<string>('draw_favour');
export const turn_order = createAction<{ player: string; order: string }>('turn_order');
export const place_cube = createAction<{ player: string; cube: string }>('place_cube');
export const pass = createAction<{ player: string }>('pass');
export const drink_potion = createAction<{ player: string; i0: number; i1: number }>(
	'drink_potion'
);
export const drink = createAction<{ player: string; i0: number; i1: number }>('drink');
export const test_potion = createAction<{ player: string; i0: number; i1: number }>('test_potion');
export const update_grid = createAction<{
	player: string;
	row: number;
	column: number;
	letter: string;
}>('update_grid');

export const initialState: AlchemistsState = {
	gameType: 'base',
	ingredientPile: [],
	faceupIngredients: [],
	shop: [[], [], []],
	levelI: [],
	levelII: [],
	levelIII: [],
	favoursPile: [],
	players: [],
	scores: [],
	finalScoreAdjustment: [],
	turnOrderToPlayerEmail: {},
	cubeActionToPlayerEmails: {},
	completedCubeActionToPlayerEmails: {},
	emailToPlayerState: {},
	currentPlayerIndex: 0,
	round: 0,
	studentSick: false,
	ingredientToAlchemical: []
};

export const alchemists = createReducer(initialState, (r) => {
	r.addCase(initial_setup, (state, { payload }) => {
		const ret = { ...initialState, ...payload };
		ret.faceupIngredients = ret.ingredientPile.slice(0, 5);
		ret.ingredientPile = ret.ingredientPile.slice(5);
		ret.ingredientToAlchemical = payload.answerKey;
		ret.shop = [ret.levelI.slice(0, 3), ret.levelII.slice(0, 3), ret.levelIII.slice(0, 3)];
		return { ...ret };
	});
	r.addCase(join_game, (state, { payload }) => {
		const color = state.players.length;
		state.players.push(payload);
		state.scores.push(10);
		state.finalScoreAdjustment.push(0);
		state.emailToPlayerState[payload] = {
			...initialPlayerState,
			color,
			hasStartButton: color === 0
		};
		return state;
	});
	r.addCase(draw_ingredient, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		playerState.ingredients = [...playerState.ingredients, ...state.ingredientPile.splice(0, 1)];
		state.emailToPlayerState[payload.player] = playerState;
	});
	r.addCase(forage, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		const newHand = [
			...playerState.ingredients,
			...state.faceupIngredients.splice(payload.index, 1, -1)
		];
		if (newHand.indexOf(-1) !== -1) {
			throw 'card already drawn';
		}
		playerState.ingredients = newHand;
		state.emailToPlayerState[payload.player] = playerState;
	});
	r.addCase(shop, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		// 1 2 3 4 5 6
		// 0 0 0 1 1 2
		const artifactLevel = [0, 0, 0, 1, 1, 2];
		const artifacts = state.shop[artifactLevel[state.round]];
		const newHand = [
			...playerState.artifacts,
			...artifacts
				.splice(payload.index, 1, -1)
				.map((x) => (x >= 0 ? x + 10 * (artifactLevel[state.round] + 1) * 10 : x))
		];
		if (newHand.indexOf(-1) !== -1) {
			throw 'card already drawn';
		}
		state.shop[artifactLevel[state.round]] = artifacts;
		state.shop = [...state.shop];
		playerState.artifacts = newHand;
		console.log({ Costs, l: artifactLevel[state.round], a: newHand[newHand.length - 1] });
		playerState.coins -= Costs[artifactLevel[state.round]][newHand[newHand.length - 1] % 10];
		if (playerState.coins < 0) {
			throw 'not enough money to buy that artifact';
		}
		state.emailToPlayerState[payload.player] = playerState;
	});
	r.addCase(renounce, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		if (playerState.pending.length > 1) {
			throw 'undo actions before renouncing';
		}
		state.emailToPlayerState[payload.player] = playerState;
	});
	r.addCase(draw_favour, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload];
		playerState.favours = [...playerState.favours, ...state.favoursPile.splice(0, 1)];
		if (state.round > 0) {
			const herbalists = playerState.favours.filter(
				(favour) => favourToPhase[favour] === 'immediate'
			);
			playerState.required = [...playerState.required, ...herbalists.map(() => 'play_favour')];
		}
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
		const herbalists = playerState.favours.filter(
			(favour) => favourToPhase[favour] === 'immediate'
		);
		playerState.required = [
			...playerState.required,
			...herbalists.map(() => 'play_favour'),
			'turn_order'
		];
		if (state.round === 0) {
			state.round++;
		}
		playerState.currentActionKey = playerState.required[0];
	});
	r.addCase(discard_ingredient, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		playerState.ingredients.splice(payload.index, 1);
	});
	function mix(
		state: WritableDraft<AlchemistsState>,
		payload: { player: string; i0: number; i1: number }
	) {
		const playerState = state.emailToPlayerState[payload.player];
		const minI = Math.min(payload.i0, payload.i1);
		const maxI = Math.max(payload.i0, payload.i1);
		const i0 = playerState.ingredients.splice(maxI, 1)[0];
		const i1 = playerState.ingredients.splice(minI, 1)[0];
		const a0 = state.ingredientToAlchemical[i0];
		const a1 = state.ingredientToAlchemical[i1];
		const m0 = Math.min(a0, a1);
		const m1 = Math.max(a0, a1);
		const result = MixesTable[m0 * 10 + m1];
		return { i0, i1, result };
	}
	r.addCase(drink_potion, (state, { payload }) => {
		const { i0, i1, result } = mix(state, payload);
		const playerState = state.emailToPlayerState[payload.player];
		playerState.mixes.push([i0, i1, result]);
	});
	r.addCase(drink, (state, { payload }) => {
		const { i0, i1, result } = mix(state, payload);
		const playerState = state.emailToPlayerState[payload.player];
		playerState.mixes.push([i0, i1, result]);
	});
	r.addCase(update_grid, (state, { payload }) => {
		const { row, column, letter } = payload;
		const playerState = state.emailToPlayerState[payload.player];
		const original = playerState.grid[column];
		const now = original.substring(0, row) + letter + original.substring(row + 1);
		playerState.grid[column] = now;
		playerState.grid = [...playerState.grid];
	});
	r.addCase(test_potion, (state, { payload }) => {
		const { i0, i1, result } = mix(state, payload);
		const playerState = state.emailToPlayerState[payload.player];
		if (state.studentSick) {
			playerState.coins -= 1;
			if (playerState.coins < 0) {
				throw 'no money for sick student';
			}
		}
		if (
			result === Alchemicals.BlueMinus ||
			result === Alchemicals.GreenMinus ||
			result === Alchemicals.RedMinus
		) {
			state.studentSick = true;
		}
		playerState.mixes.push([i0, i1, result]);
	});
	r.addCase(play_favour, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		const card: Favours = playerState.favours.splice(payload.index, 1)[0];
		switch (card) {
			case Favours.assistant:
				playerState.required = ['place_cube', ...playerState.required];
				state.emailToPlayerState[payload.player] = playerState;
				break;
			case Favours.herbalist:
				playerState.ingredients = [
					...playerState.ingredients,
					...state.ingredientPile.splice(0, 3)
				];
				playerState.required = [
					'discard_ingredient',
					'discard_ingredient',
					'commit',
					...playerState.required
				];
				state.emailToPlayerState[payload.player] = playerState;
				break;
			case Favours.shopkeeper:
			case Favours.sage:
				playerState.coins += 1;
				break;
			case Favours.custodian:
				placeCube(state, payload.player, 'custodian');
				playerState.required.splice(0, 1);
				state.emailToPlayerState[payload.player] = playerState;
				break;
			default:
				throw 'unrecognized favour';
		}
	});
	r.addCase(transmute, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		playerState.ingredients.splice(payload.index, 1);
		playerState.coins++;
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
		if (payload.order === 'turn6' && state.players.length !== 3) {
			throw 'wrong number of players for turn6 option';
		}
		if (state.turnOrderToPlayerEmail[payload.order] === undefined) {
			const oldTurns = Object.keys(state.turnOrderToPlayerEmail);
			for (let t = 0; t < oldTurns.length; ++t) {
				if (state.turnOrderToPlayerEmail[oldTurns[t]] === payload.player) {
					delete state.turnOrderToPlayerEmail[oldTurns[t]];
					state.currentPlayerIndex--;
				}
			}
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
					if (playerState.required.length > 0) {
						playerState.required = [...playerState.required, 'commit'];
					}
					const bonus = playerState.turnToBonusMap[turns[i]];
					playerState.coins += bonus.coins;
					for (let c = 0; c < bonus.ingredients; ++c) {
						playerState.ingredients = [
							...playerState.ingredients,
							...state.ingredientPile.splice(0, 1)
						];
					}
					for (let c = 0; c < bonus.favours; ++c) {
						playerState.favours = [...playerState.favours, ...state.favoursPile.splice(0, 1)];
					}
					const herbalists = playerState.favours.filter(
						(favour) => favourToPhase[favour] === 'immediate'
					);
					playerState.required = [...playerState.required, ...herbalists.map(() => 'play_favour')];
					playerState.required = [...playerState.required, 'place_cube'];
					playerState.currentActionKey = playerState.required[0];
					playerState.required = [...playerState.required, 'place_cube'];
					playerState.required = [...playerState.required, 'place_cube'];
					if (state.round > 1) {
						playerState.required = [...playerState.required, 'place_cube'];
						if (state.players.length < 4) {
							playerState.required = [...playerState.required, 'place_cube'];
							if (state.players.length < 3) {
								playerState.required = [...playerState.required, 'place_cube'];
							}
						}
					}
					playerState.required = [...playerState.required, 'commit'];
				}
				state.players = playerOrder.reverse();
			}
		} else {
			throw 'move conflict for turn order';
		}
	});

	function placeCube(state: WritableDraft<AlchemistsState>, player: string, action: string) {
		let priors: string[] = [];
		if (state.cubeActionToPlayerEmails[action]) {
			priors = [...state.cubeActionToPlayerEmails[action]];
		}
		state.cubeActionToPlayerEmails[action] = [...priors, player];
		if (!state.cubeActionToPlayerEmails['pass']) {
			state.cubeActionToPlayerEmails['pass'] = [];
		}
		if (state.cubeActionToPlayerEmails['pass'].indexOf(player) === -1) {
			priors = [];
			if (state.cubeActionToPlayerEmails['pass']) {
				priors = [...state.cubeActionToPlayerEmails['pass']];
			}
			state.cubeActionToPlayerEmails['pass'] = [...priors, player];
		}
	}
	r.addCase(place_cube, (state, { payload }) => {
		const player = payload.player;
		const splitSpot = payload.cube.split('_');
		const action = splitSpot[1];
		placeCube(state, player, action);
	});

	r.addCase(pass, (state, { payload }) => {
		const playerState = state.emailToPlayerState[payload.player];
		playerState.required = [...playerState.required, 'turn_order'];
		playerState.currentActionKey = playerState.required[0];
		if (state.completedCubeActionToPlayerEmails['pass']) {
			if (state.completedCubeActionToPlayerEmails['pass'].length === state.players.length - 1) {
				console.log('*** I am the last passer ' + payload.player);
				state.round++;
				state.players = [...state.players.slice(1), state.players[0]];
				state.studentSick = false;
				state.turnOrderToPlayerEmail = {};
				state.cubeActionToPlayerEmails = {};
				state.completedCubeActionToPlayerEmails = {};
			}
		}
	});

	r.addMatcher(
		() => true,
		(state, action) => {
			const payload = action.payload;
			if (payload && payload.player) {
				const playerState = state.emailToPlayerState[payload.player];
				if (playerState) {
					let requiredIndex = playerState.required.indexOf(action.type);
					if (requiredIndex === -1) {
						const alternates: { [k: string]: string } = {};
						alternates['draw_ingredient'] = 'forage';
						alternates['drink_potion'] = 'custodian';
						alternates['test_potion'] = 'student';
						alternates['renounce'] = action.payload.action;
						const alias = alternates[action.type];
						if (alias) {
							requiredIndex = playerState.required.indexOf(alias);
						}
					}
					if (requiredIndex !== -1) {
						const done = playerState.required.splice(requiredIndex, 1)[0];
						if (playerState.required.length > 0) {
							playerState.currentActionKey = playerState.required[0];
						}
						if (state.cubeActionToPlayerEmails[done]) {
							const myCube = state.cubeActionToPlayerEmails[done].indexOf(payload.player);
							if (myCube !== -1) {
								state.cubeActionToPlayerEmails[done].splice(myCube, 1);
								if (state.completedCubeActionToPlayerEmails[done] === undefined) {
									state.completedCubeActionToPlayerEmails[done] = [];
								}
								state.completedCubeActionToPlayerEmails[done] = [
									...state.completedCubeActionToPlayerEmails[done],
									payload.player
								];
							}
						}
						if (action.type === 'place_cube') {
							const splitSpot = payload.cube.split('_');
							const spot = splitSpot[1];
							const cubes = [...state.cubeActionToPlayerEmails[spot]];
							const playerCubes = cubes.filter((x) => x === payload.player);
							const costs = playerCubes.map((_, i) => actionToColumnCubeCount[spot][i]);
							let lastCost = costs[costs.length - 1];
							while (lastCost > 1) {
								lastCost--;
								const ri = playerState.required.indexOf(action.type);
								if (ri === -1) throw 'not enough action cubes';
								playerState.required.splice(ri, 1);
								if (playerState.required.length > 0) {
									playerState.currentActionKey = playerState.required[0];
								}
							}
							if (playerState.required.indexOf('place_cube') === -1) {
								state.currentPlayerIndex++;
								state.currentPlayerIndex %= state.players.length;
							}
						}
					}
					if (playerState.required.length === 0 && playerState.pending.length === 0) {
						const phaseOrder = [
							'forage',
							'transmute',
							'custodian',
							'sell',
							'shop',
							'debunk',
							'publish',
							'student',
							'drink',
							'pass'
						];
						for (let i = 0; i < phaseOrder.length && playerState.required.length === 0; ++i) {
							const myCubes = state.cubeActionToPlayerEmails[phaseOrder[i]]?.filter(
								(x) => x === payload.player
							);
							if (myCubes && myCubes.length > 0) {
								playerState.required = [phaseOrder[i]];
							}
						}
					}
					if (playerState.required.length > 0) {
						playerState.currentActionKey = playerState.required[0];
					}
					state.emailToPlayerState[payload.player] = playerState;
				}
			}
		}
	);
});
