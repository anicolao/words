import { expect } from 'chai';

import {
	alchemists,
	commit,
	discard_favour,
	draw_favour,
	draw_ingredient,
	initialState,
	initial_setup,
	join_game,
	place_cube,
	queue_pending,
	redo_pending,
	turn_order,
	undo_pending
} from '$lib/components/alchemists';

import { describe, it } from 'vitest';

describe('alchemists', () => {
	it('initial state', () => {
		expect(initialState.gameType).to.equal('base');
		expect(initialState.ingredientPile.length).to.equal(0);
		expect(initialState.favoursPile.length).to.equal(0);
	});

	const startState = alchemists(
		initialState,
		initial_setup({
			gameType: 'golem',
			ingredientPile: [0, 1, 0, 1, 7, 0, 1, 2, 3],
			levelI: [0, 1, 2, 3, 4, 5],
			levelII: [0, 2, 1, 3, 4, 5],
			levelIII: [0, 1, 2, 3, 4, 5],
			favoursPile: [7, 2]
		})
	);

	it('accepts shuffled cards for game setup', () => {
		expect(startState.gameType).to.equal('golem');

		expect(startState.ingredientPile.length).to.equal(4);
		expect(startState.favoursPile.length).to.equal(2);
		expect(startState.levelI.length).to.equal(6);
		expect(startState.levelII.length).to.equal(6);
		expect(startState.levelIII.length).to.equal(6);
		expect(startState.shop.length).to.equal(3);
	});

	it('dealt piles based on the shuffles given', () => {
		/* check dealing */
		expect(startState.shop[0].length).to.equal(3);
		expect(startState.shop[1].length).to.equal(3);
		expect(startState.shop[2].length).to.equal(3);
		expect(startState.shop[0].every((v, i) => v === startState.levelI[i])).is.true;
		expect(startState.shop[1].every((v, i) => v === startState.levelII[i])).is.true;
		expect(startState.shop[2].every((v, i) => v === startState.levelIII[i])).is.true;

		expect(startState.faceupIngredients.length).to.equal(5);
		expect(startState.faceupIngredients.every((v, i) => v === [0, 1, 0, 1, 7][i])).is.true;
		expect(startState.ingredientPile.every((v, i) => v === [0, 1, 2, 3][i])).is.true;
	});

	const state1 = alchemists(startState, join_game('alex@gmail.com'));

	it('joins player correctly', () => {
		expect(state1.gameType).to.equal('golem');
		expect(state1.ingredientPile.length).to.equal(4);
		expect(state1.favoursPile.length).to.equal(2);
		expect(state1.players.length).to.equal(1);
		expect(state1.players[0]).to.equal('alex@gmail.com');
		expect(state1.emailToPlayerState[state1.players[0]].coins).to.equal(2);
		expect(state1.emailToPlayerState[state1.players[0]].ingredients.length).to.equal(0);
		expect(state1.emailToPlayerState[state1.players[0]].favours.length).to.equal(0);
		expect(state1.emailToPlayerState[state1.players[0]].seals.length).to.equal(11);
	});

	const state2 = alchemists(state1, draw_ingredient('alex@gmail.com'));
	it('can draw an ingredient card', () => {
		expect(state2.ingredientPile.length).to.equal(3);
		expect(state2.ingredientPile[0]).to.equal(1);
		expect(state2.emailToPlayerState[state2.players[0]].ingredients.length).to.equal(1);
		expect(state2.emailToPlayerState[state2.players[0]].ingredients[0]).to.equal(0);
	});

	const state3 = alchemists(state2, draw_favour('alex@gmail.com'));
	it('draws favours correctly', () => {
		expect(state3.favoursPile.length).to.equal(1);
		expect(state3.favoursPile[0]).to.equal(2);
		expect(state3.emailToPlayerState[state3.players[0]].favours.length).to.equal(1);
		expect(state3.emailToPlayerState[state3.players[0]].favours[0]).to.equal(7);
	});

	const discard = discard_favour({ player: 'alex@gmail.com', index: 0 });
	const state4 = alchemists(state3, queue_pending({ player: 'alex@gmail.com', action: discard }));
	it('discards favours correctly', () => {
		expect(state4.emailToPlayerState[state4.players[0]].favours.length).to.equal(1);
		expect(state4.emailToPlayerState[state4.players[0]].favours[0]).to.equal(7);
		expect(state4.emailToPlayerState[state4.players[0]].pending.length).to.equal(1);
		expect(state4.emailToPlayerState[state4.players[0]].required.length).to.equal(2);
	});

	const state4a = alchemists(state4, commit({ player: 'alex@gmail.com' }));
	it('discards favours correctly pt II', () => {
		expect(state4a.emailToPlayerState[state4a.players[0]].favours.length).to.equal(0);
		expect(state4a.emailToPlayerState[state4a.players[0]].pending.length).to.equal(0);
		expect(state4a.emailToPlayerState[state4a.players[0]].required.length).to.equal(1);
		expect(state4a.emailToPlayerState[state4a.players[0]].required[0]).to.equal('turn_order');
	});

	const state5 = alchemists(state3, queue_pending({ player: 'alex@gmail.com', action: discard }));
	it('undo/redo/commit operates correctly', () => {
		let state = state5;
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].pending.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].required.length).to.equal(2);

		const previewPending = state.emailToPlayerState[state.players[0]].pending[0];
		const previewState = alchemists(state, previewPending);
		expect(previewState.emailToPlayerState[state.players[0]].favours.length).to.equal(0);
		expect(previewState.emailToPlayerState[state.players[0]].required.length).to.equal(2);
		expect(previewState.emailToPlayerState[state.players[0]].required[0]).to.equal('commit');
		expect(previewState.emailToPlayerState[state.players[0]].required[1]).to.equal('turn_order');

		state = alchemists(state, undo_pending({ player: 'alex@gmail.com' }));
		expect(state.emailToPlayerState[state.players[0]].pending.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].undone.length).to.equal(1);

		state = alchemists(state, redo_pending({ player: 'alex@gmail.com' }));
		expect(state.emailToPlayerState[state.players[0]].pending.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].undone.length).to.equal(0);
	});

	const state6 = alchemists(state4a, join_game('anna@gmail.com'));
	it('second player can join the game', () => {
		expect(state6.players.length).to.equal(2);
		expect(state6.players[1]).to.equal('anna@gmail.com');
		expect(state6.currentPlayerIndex).to.equal(0);
	});

	const state7 = alchemists(state6, turn_order({ player: 'alex@gmail.com', order: 'turn4' }));
	it('player can choose turn order', () => {
		expect(state7.turnOrderToPlayerEmail['turn4']).to.equal('alex@gmail.com');
	});
	it('player conflicts throw exceptions', () => {
		try {
			alchemists(state7, turn_order({ player: 'anna@gmail.com', order: 'turn4' }));
		} catch (err) {
			return;
		}
		expect(false).to.be.true;
	});

	const discard2 = discard_favour({ player: 'anna@gmail.com', index: 0 });
	const state8 = alchemists(state7, queue_pending({ player: 'anna@gmail.com', action: discard2 }));
	it('second player can queue action', () => {
		const p2State = state8.emailToPlayerState['anna@gmail.com'];
		expect(p2State.pending.length).to.equal(1);
	});
	const state9 = alchemists(state8, commit({ player: 'anna@gmail.com' }));
	const state10 = alchemists(state9, turn_order({ player: 'anna@gmail.com', order: 'turn5' }));

	it('queues up action cubes for the players', () => {
		const p1State = state10.emailToPlayerState['alex@gmail.com'];
		expect(p1State.required.length).to.equal(4);
		expect(p1State.required.toString()).to.equal('place_cube,place_cube,place_cube,commit');
		const p2State = state10.emailToPlayerState['anna@gmail.com'];
		expect(p2State.required.length).to.equal(5);
		expect(p2State.required.toString()).to.equal('commit,place_cube,place_cube,place_cube,commit');

		expect(state10.round).to.equal(1);
		expect(state10.players[0]).to.equal('anna@gmail.com');
		expect(state10.players[1]).to.equal('alex@gmail.com');
	});

	const alex = 'alex@gmail.com';
	const anna = 'anna@gmail.com';
	let actions = state10;
	actions = alchemists(actions, place_cube({ player: alex, cube: 'cube_forage_11' }));
	actions = alchemists(actions, place_cube({ player: alex, cube: 'cube_forage_21' }));
	actions = alchemists(actions, place_cube({ player: alex, cube: 'cube_student_11' }));
	actions = alchemists(actions, commit({ player: alex }));
	actions = alchemists(actions, commit({ player: anna }));
	actions = alchemists(actions, place_cube({ player: anna, cube: 'cube_forage_12' }));
	actions = alchemists(actions, place_cube({ player: anna, cube: 'cube_forage_22' }));
	actions = alchemists(actions, place_cube({ player: anna, cube: 'cube_student_12' }));
	const state11 = alchemists(actions, commit({ player: anna }));

	it('lets the users place cubes', () => {
		const p1State = state11.emailToPlayerState['alex@gmail.com'];
		expect(p1State.required.length).to.equal(3);
		expect(p1State.required.toString()).to.equal('forage,forage,commit');

		const p2State = state11.emailToPlayerState['anna@gmail.com'];
		expect(p2State.required.length).to.equal(3);
		expect(p2State.required.toString()).to.equal('forage,forage,commit');

		const forageCubes = state11.cubeActionToPlayerEmails['forage'];
		expect(forageCubes.toString()).to.equal([alex, alex, anna, anna].toString());
		const testCubes = state11.cubeActionToPlayerEmails['student'];
		expect(testCubes.toString()).to.equal([alex, anna].toString());
	});
});
