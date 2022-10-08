import { expect } from 'chai';
import { describe, it } from 'vitest';

import {
	things,
	initialThingsState,
	join_game,
	leave_game,
	set_category,
	answer_category,
	guesses
} from '$lib/components/things';
import { set_current_player } from '$lib/components/words';

describe('things', () => {
	it('initial state', () => {
		expect(initialThingsState.players.length).to.equal(0);
		expect(initialThingsState.scores.length).to.equal(0);
	});

	it('player can join and leave the game', () => {
		let nextState = things(initialThingsState, join_game('alex@gmail.com'));
		expect(nextState.players.length).to.equal(1);
		expect(nextState.players[0]).to.equal('alex@gmail.com');
		nextState = things(nextState, leave_game('alex@gmail.com'));
		expect(nextState.players.length).to.equal(0);
	});

	it('can set the current player', () => {
		let nextState = things(initialThingsState, join_game('alex@gmail.com'));
		expect(nextState.players.length).to.equal(1);
		expect(nextState.players[0]).to.equal('alex@gmail.com');
		nextState = things(nextState, join_game('bob@gmail.com'));
		expect(nextState.players.length).to.equal(2);
		expect(nextState.currentPlayerIndex).to.equal(0);
		nextState = things(nextState, set_current_player(1));
		expect(nextState.currentPlayerIndex).to.equal(1);
	});

	it('can set the current category', () => {
		const nextState = things(initialThingsState, set_category("you don't want to eat"));
		expect(nextState.currentCategory).to.equal("you don't want to eat");
	});

	it('can answer the current category', () => {
		const nextState = things(
			initialThingsState,
			answer_category({ answer: 'silly answer', player: 'alex@gmail.com' })
		);
		expect(nextState.playerToAnswer['alex@gmail.com']).to.equal('silly answer');
	});

	it('can play and score a round', () => {
		let nextState = things(initialThingsState, join_game('alex@gmail.com'));
		expect(nextState.players.length).to.equal(1);
		expect(nextState.players[0]).to.equal('alex@gmail.com');
		nextState = things(nextState, join_game('bob@gmail.com'));
		nextState = things(nextState, join_game('alice@gmail.com'));
		nextState = things(nextState, set_category('category 1'));
		expect(nextState.currentPlayerIndex).to.equal(0);
		nextState = things(
			nextState,
			answer_category({ player: 'alice@gmail.com', answer: 'alice answered' })
		);
		expect(nextState.roundReady).to.be.false;
		nextState = things(
			nextState,
			answer_category({ player: 'bob@gmail.com', answer: 'bob answered' })
		);
		expect(nextState.roundReady).to.be.false;
		nextState = things(
			nextState,
			answer_category({ player: 'alex@gmail.com', answer: 'alex answered' })
		);
		expect(nextState.roundReady).to.be.true;
		expect(nextState.scores[0]).to.equal(0);
		expect(nextState.scores[1]).to.equal(0);
		expect(nextState.scores[2]).to.equal(0);
		expect(nextState.alive[0]).to.be.true;
		expect(nextState.alive[1]).to.be.true;
		expect(nextState.alive[2]).to.be.true;
		nextState = things(
			nextState,
			guesses({ player: 'alex@gmail.com', dead_player: 'bob@gmail.com' })
		);
		expect(nextState.alive[0]).to.be.true;
		expect(nextState.alive[1]).to.be.false;
		expect(nextState.alive[2]).to.be.true;
		expect(nextState.scores[0]).to.equal(1);
		expect(nextState.scores[1]).to.equal(0);
		expect(nextState.scores[2]).to.equal(0);
		expect(nextState.roundOver).to.be.false;
		nextState = things(
			nextState,
			guesses({ player: 'alex@gmail.com', dead_player: 'alice@gmail.com' })
		);
		expect(nextState.alive[0]).to.be.true;
		expect(nextState.alive[1]).to.be.false;
		expect(nextState.alive[2]).to.be.false;
		expect(nextState.scores[0]).to.equal(3);
		expect(nextState.scores[1]).to.equal(0);
		expect(nextState.scores[2]).to.equal(0);
		expect(nextState.roundOver).to.be.true;

		// next round
		nextState = things(nextState, set_category('category 2'));
		expect(nextState.currentPlayerIndex).to.equal(1);
		expect(nextState.scores[0]).to.equal(3);
		expect(nextState.scores[1]).to.equal(0);
		expect(nextState.scores[2]).to.equal(0);
		expect(nextState.alive[0]).to.be.true;
		expect(nextState.alive[1]).to.be.true;
		expect(nextState.alive[2]).to.be.true;
		expect(nextState.roundOver).to.be.false;
		expect(nextState.roundReady).to.be.false;
	});
});
