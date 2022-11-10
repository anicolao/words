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

	it('shuffle cards', () => {
		const startState = alchemists(
			initialState,
			initial_setup({
				gameType: 'golem',
				ingredientPile: [0, 1, 0, 1, 7, 0, 1, 2, 3],
				levelI: [0, 1, 2, 3, 4, 5],
				levelII: [0, 1, 2, 3, 4, 5],
				levelIII: [0, 1, 2, 3, 4, 5],
				favoursPile: [7, 2]
			})
		);
		expect(startState.gameType).to.equal('golem');
		expect(startState.ingredientPile.length).to.equal(4);
		expect(startState.favoursPile.length).to.equal(2);
	});

	it('joins player correctly', () => {
		let state = initialState;
		state = alchemists(
			state,
			initial_setup({
				gameType: 'golem',
				ingredientPile: [0, 1, 0, 1, 2],
				favoursPile: [7, 2],
				levelI: [0, 1, 2, 3, 4, 5],
				levelII: [0, 1, 2, 3, 4, 5],
				levelIII: [0, 1, 2, 3, 4, 5]
			})
		);
		state = alchemists(state, join_game('alex@gmail.com'));
		expect(state.gameType).to.equal('golem');
		expect(state.ingredientPile.length).to.equal(0);
		expect(state.favoursPile.length).to.equal(2);
		expect(state.players.length).to.equal(1);
		expect(state.players[0]).to.equal('alex@gmail.com');
		expect(state.emailToPlayerState[state.players[0]].coins).to.equal(2);
		expect(state.emailToPlayerState[state.players[0]].ingredients.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].seals.length).to.equal(11);
	});

	it('draws ingredients correctly', () => {
		let state = initialState;
		state = alchemists(
			state,
			initial_setup({
				gameType: 'golem',
				ingredientPile: [0, 1, 0, 1, 7, 0, 1, 4, 3],
				levelI: [0, 1, 2, 3, 4, 5],
				levelII: [0, 1, 2, 3, 4, 5],
				levelIII: [0, 1, 2, 3, 4, 5],
				favoursPile: [7, 2]
			})
		);
		state = alchemists(state, join_game('alex@gmail.com'));
		expect(state.gameType).to.equal('golem');
		expect(state.ingredientPile.length).to.equal(4);
		expect(state.favoursPile.length).to.equal(2);
		expect(state.players.length).to.equal(1);
		expect(state.players[0]).to.equal('alex@gmail.com');
		expect(state.emailToPlayerState[state.players[0]].coins).to.equal(2);
		expect(state.emailToPlayerState[state.players[0]].ingredients.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].seals.length).to.equal(11);
		state = alchemists(state, draw_ingredient('alex@gmail.com'));
		expect(state.ingredientPile.length).to.equal(3);
		expect(state.ingredientPile[0]).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].ingredients.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].ingredients[0]).to.equal(0);
	});

	it('draws favours correctly', () => {
		let state = initialState;
		state = alchemists(
			state,
			initial_setup({
				gameType: 'golem',
				ingredientPile: [0, 1, 0, 1, 2],
				favoursPile: [7, 2],
				levelI: [0, 1, 2, 3, 4, 5],
				levelII: [0, 1, 2, 3, 4, 5],
				levelIII: [0, 1, 2, 3, 4, 5]
			})
		);
		state = alchemists(state, join_game('alex@gmail.com'));
		expect(state.gameType).to.equal('golem');
		expect(state.ingredientPile.length).to.equal(0);
		expect(state.favoursPile.length).to.equal(2);
		expect(state.players.length).to.equal(1);
		expect(state.players[0]).to.equal('alex@gmail.com');
		expect(state.emailToPlayerState[state.players[0]].coins).to.equal(2);
		expect(state.emailToPlayerState[state.players[0]].ingredients.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].seals.length).to.equal(11);
		state = alchemists(state, draw_favour('alex@gmail.com'));
		expect(state.favoursPile.length).to.equal(1);
		expect(state.favoursPile[0]).to.equal(2);
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].favours[0]).to.equal(7);
	});

	it('discards favours correctly', () => {
		let state = initialState;
		state = alchemists(
			state,
			initial_setup({
				gameType: 'golem',
				ingredientPile: [0, 1, 0, 1, 2, 2, 3],
				levelI: [0, 1, 2, 3, 4, 5],
				levelII: [0, 1, 2, 3, 4, 5],
				levelIII: [0, 1, 2, 3, 4, 5],
				favoursPile: [7, 2]
			})
		);
		state = alchemists(state, join_game('alex@gmail.com'));
		expect(state.gameType).to.equal('golem');
		expect(state.ingredientPile.length).to.equal(2);
		expect(state.favoursPile.length).to.equal(2);
		expect(state.players.length).to.equal(1);
		expect(state.players[0]).to.equal('alex@gmail.com');
		expect(state.emailToPlayerState[state.players[0]].coins).to.equal(2);
		expect(state.emailToPlayerState[state.players[0]].ingredients.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].seals.length).to.equal(11);
		state = alchemists(state, draw_favour('alex@gmail.com'));
		expect(state.favoursPile.length).to.equal(1);
		expect(state.favoursPile[0]).to.equal(2);
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].favours[0]).to.equal(7);
		expect(state.emailToPlayerState[state.players[0]].required.length).to.equal(2);

		const discard = discard_favour({ player: 'alex@gmail.com', index: 0 });
		state = alchemists(state, queue_pending({ player: 'alex@gmail.com', action: discard }));
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].favours[0]).to.equal(7);
		expect(state.emailToPlayerState[state.players[0]].pending.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].required.length).to.equal(2);

		state = alchemists(state, commit({ player: 'alex@gmail.com' }));
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].pending.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].required.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].required[0]).to.equal('turn_order');
	});

	it('undo/redo/commit operates correctly', () => {
		let state = initialState;
		state = alchemists(
			state,
			initial_setup({
				gameType: 'golem',
				ingredientPile: [0, 1, 0, 1, 2, 2],
				favoursPile: [7, 2],
				levelI: [0, 1, 2, 3, 4, 5],
				levelII: [0, 1, 2, 3, 4, 5],
				levelIII: [0, 1, 2, 3, 4, 5]
			})
		);
		state = alchemists(state, join_game('alex@gmail.com'));
		expect(state.gameType).to.equal('golem');
		expect(state.ingredientPile.length).to.equal(1);
		expect(state.faceupIngredients.length).to.equal(5);
		expect(state.favoursPile.length).to.equal(2);
		expect(state.players.length).to.equal(1);
		expect(state.players[0]).to.equal('alex@gmail.com');
		expect(state.emailToPlayerState[state.players[0]].coins).to.equal(2);
		expect(state.emailToPlayerState[state.players[0]].ingredients.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(0);
		expect(state.emailToPlayerState[state.players[0]].seals.length).to.equal(11);
		state = alchemists(state, draw_favour('alex@gmail.com'));
		expect(state.favoursPile.length).to.equal(1);
		expect(state.favoursPile[0]).to.equal(2);
		expect(state.emailToPlayerState[state.players[0]].favours.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].favours[0]).to.equal(7);
		expect(state.emailToPlayerState[state.players[0]].required.length).to.equal(2);

		const discard = discard_favour({ player: 'alex@gmail.com', index: 0 });
		state = alchemists(state, queue_pending({ player: 'alex@gmail.com', action: discard }));
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
