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
	queue_pending,
	redo_pending,
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

		let state = alchemists(state4, commit({ player: 'alex@gmail.com' }));
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].pending.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].required.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].required[0]).to.equal('turn_order');
	});

	const state5 = alchemists(state3, queue_pending({ player: 'alex@gmail.com', action: discard }));
	it('undo/redo/commit operates correctly', () => {
		let state = state5;
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].pending.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].required.length).to.equal(2);

		const previewPending = state.emailToPlayerState[state.players[0]].pending[0];
		let previewState = alchemists(state, previewPending);
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
});
