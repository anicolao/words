import { expect } from 'chai';

import {
	ttr,
	draw_wagon,
	initialState,
	initial_setup,
	join_game,
	Wagons
} from '$lib/components/ttr/ttr';

import { describe, it } from 'vitest';

describe('alchemists', () => {
	it('initial state', () => {
		expect(initialState.gameType).to.equal('swiss');
		expect(initialState.wagonsPile.length).to.equal(0);
	});

	it('joins player correctly', () => {
		let state = initialState;
		state = ttr(
			state,
			initial_setup({ gameType: 'swiss', wagonsPile: [Wagons.blue, Wagons.tunnel] })
		);
		state = ttr(state, join_game('alex@gmail.com'));
		expect(state.gameType).to.equal('swiss');
		expect(state.wagonsPile.length).to.equal(2);
		expect(state.players.length).to.equal(1);
		expect(state.players[0]).to.equal('alex@gmail.com');
		expect(state.emailToPlayerState[state.players[0]].wagons.length).to.equal(0);
	});

	it('draws wagons correctly', () => {
		let state = initialState;
		state = ttr(
			state,
			initial_setup({ gameType: 'swiss', wagonsPile: [Wagons.blue, Wagons.tunnel] })
		);
		state = ttr(state, join_game('alex@gmail.com'));
		expect(state.gameType).to.equal('swiss');
		expect(state.wagonsPile.length).to.equal(2);
		expect(state.players.length).to.equal(1);
		expect(state.players[0]).to.equal('alex@gmail.com');
		expect(state.emailToPlayerState[state.players[0]].wagons.length).to.equal(0);
		state = ttr(state, draw_wagon('alex@gmail.com'));
		expect(state.wagonsPile.length).to.equal(1);
		expect(state.wagonsPile[0]).to.equal(Wagons.tunnel);
		expect(state.emailToPlayerState[state.players[0]].wagons.length).to.equal(1);
		expect(state.emailToPlayerState[state.players[0]].wagons[0]).to.equal(Wagons.blue);
	});
});
