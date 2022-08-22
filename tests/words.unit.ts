import { expect } from 'chai';

import {
	words,
	play,
	initialWordsState,
	type WordsState,
	type WordsMove,
	initial_tiles,
	draw_tiles,
	join_game
} from '$lib/components/words';
import { describe, it } from 'vitest';

describe('words', () => {
	it('initial state', () => {
		expect(initialWordsState.board.length).to.equals(15);
		expect(initialWordsState.board[0].length).to.equals(15);
	});

	function makeGameStartState() {
		let nextState = words({...initialWordsState}, initial_tiles('hellowogodbyesrldherearesomeletters'));
		nextState = words(nextState, join_game("Alex@gmail.com"));
		expect(nextState.players.length).to.equal(1);
		nextState = words(nextState, join_game("Bob@gmail.com"));
		expect(nextState.players[0]).to.equal("Alex@gmail.com");
		nextState = words(nextState, draw_tiles("Alex@gmail.com"));
		nextState = words(nextState, draw_tiles("Bob@gmail.com"));
		expect(nextState.emailToRack["Alex@gmail.com"]).to.equal('hellowo');
		expect(nextState.drawPile).to.equal('rldherearesomeletters');
		return nextState;
	}

	it('play horizontal move', () => {
		const move: WordsMove = {
			x: 7,
			y: 7,
			isVertical: false,
			letters: 'hello',
			player: 'Alex@gmail.com',
		};
		const nextState = words(makeGameStartState(), play(move));
		expect(nextState.board[7].join('')).to.be.equal('hello');
	});

	function transpose(array: any[][]) {
		return array.map((_, colIndex) => array.map((row) => row[colIndex]));
	}

	it('play vertical move', () => {
		const move: WordsMove = {
			x: 7,
			y: 7,
			isVertical: true,
			letters: 'hello',
			player: "Alex@gmail.com"
		};
		const nextState = words(
			makeGameStartState(),
			play(move)
		);
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[7].join('')).to.be.equal('hello');
	});

	it('play vertical move after horizontal move', () => {
		const horizontal: WordsMove = {
			x: 7,
			y: 7,
			isVertical: false,
			letters: 'hello',
			player: 'Alex@gmail.com',
		};
		const firstState = words(
			makeGameStartState(),
			play(horizontal)
		);
		const vertical: WordsMove = {
			x: 11,
			y: 6,
			isVertical: true,
			letters: 'godbye',
			player: 'Bob@gmail.com',
		};
		const nextState = words(firstState, play(vertical));

		expect(nextState.board[7].join('')).to.be.equal('hello');
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[11].join('')).to.be.equal('goodbye');
	});

	it('play out of bound horizontal move', () => {
		const move: WordsMove = {
			x: 14,
			y: 7,
			isVertical: false,
			letters: 'hello',
			player: 'Alex@gmail.com',
		};
		const nextState = words(
			makeGameStartState(),
			play(move)
		);
		expect(nextState.board[7].join('')).to.be.equal('');
	});

	it('play wrong initial horizontal move', () => {
		const move: WordsMove = {
			x: 0,
			y: 7,
			isVertical: false,
			letters: 'hello',
			player: 'Alex@gmail.com',
		};
		const nextState = words(
			makeGameStartState(),
			play(move)
		);
		expect(nextState.board[7].join('')).to.be.equal('');
	});

	it('play wrong initial move where we are lacking letters', () => {
		const move: WordsMove = {
			x: 7,
			y: 7,
			isVertical: false,
			letters: 'lovely',
			player: 'Alex@gmail.com',
		};
		const nextState = words(
			makeGameStartState(),
			play(move)
		);
		expect(nextState.board[7].join('')).to.be.equal('');
	});

	it('play wrong vertical move after horizontal move', () => {
		const horizontal: WordsMove = {
			x: 7,
			y: 7,
			isVertical: false,
			letters: 'hello',
			player: 'Alex@gmail.com',
		};
		const firstState = words(
			makeGameStartState(),
			play(horizontal)
		);
		const vertical: WordsMove = {
			x: 0,
			y: 6,
			isVertical: true,
			letters: 'godbye',
			player: 'Alex@gmail.com',
		};
		const nextState = words(firstState, play(vertical));

		expect(nextState.board[7].join('')).to.be.equal('hello');
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[0].join('')).to.be.equal('');
	});

	it('play legal vertical move with existing adjacent tiles', () => {
		const horizontal: WordsMove = {
			x: 7,
			y: 7,
			isVertical: false,
			letters: 'he',
			player: 'Alex@gmail.com',
		};
		const firstState = words(
			makeGameStartState(),
			play(horizontal)
		);
		const vertical: WordsMove = {
			x: 6,
			y: 6,
			isVertical: false,
			letters: 'lol',
			player: 'Alex@gmail.com',
		};
		const nextState = words(firstState, play(vertical));

		expect(nextState.board[7].join('')).to.be.equal('he');
		expect(nextState.board[6].join('')).to.be.equal('lol');
	});

	it('initialize draw pile', () => {
		const nextState = words(
			{
				...initialWordsState
			},
			initial_tiles('foo')
		);
		expect(nextState.drawPile).to.be.equal('foo');
	});

	it('allows the player to draw tiles from the draw pile', () => {
		let nextState = words({...initialWordsState}, initial_tiles('helloworldherearesomeletters'));
		nextState = words(nextState, join_game("Alex@gmail.com"));
		expect(nextState.players.length).to.equal(1);
		expect(nextState.players[0]).to.equal("Alex@gmail.com");
		nextState = words(nextState, draw_tiles("Alex@gmail.com"));
		expect(nextState.emailToRack["Alex@gmail.com"]).to.equal('hellowo');
		expect(nextState.drawPile).to.equal('rldherearesomeletters');
	});

	it('handles end of bag correctly', () => {
		let nextState = words({...initialWordsState}, initial_tiles('hel'));
		nextState = words(nextState, join_game("Alex@gmail.com"));
		expect(nextState.players.length).to.equal(1);
		expect(nextState.players[0]).to.equal("Alex@gmail.com");
		nextState = words(nextState, draw_tiles("Alex@gmail.com"));
		expect(nextState.emailToRack["Alex@gmail.com"]).to.equal('hel');
		expect(nextState.drawPile).to.equal('');
	});
});
