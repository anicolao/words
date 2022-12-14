import { expect } from 'chai';

import {
	words,
	play,
	initialWordsState,
	type WordsMove,
	initial_tiles,
	draw_tiles,
	join_game,
	leave_game,
	pass,
	challenge,
	fail_challenge
} from '$lib/components/words';
import { describe, it } from 'vitest';

describe('words', () => {
	it('initial state', () => {
		expect(initialWordsState.board.length).to.equal(0);
		expect(initialWordsState.board[0]).to.be.undefined;
	});

	function makeGameStartState(draws?: string) {
		const draw_pile = draws || 'hello_ogodbyesrldherearesomeletters';
		const letterm = '11111121211111112121111111212111111';
		let nextState = words(
			{ ...initialWordsState },
			initial_tiles({
				draw_pile,
				tiles: '_abddeeeeeeeeghhllllmoooorrrrsssttyw',
				values: '013221111111124411113111111110001144',
				letterm,
				wordm: '31111121111111111121111111111111113',
				num_rows: 7,
				num_cols: 5
			})
		);
		nextState = words(nextState, join_game('Alex@gmail.com'));
		expect(nextState.players.length).to.equal(1);
		expect(nextState.height).to.equal(7);
		expect(nextState.width).to.equal(5);
		expect(nextState.letterm).to.equal(letterm);
		nextState = words(nextState, join_game('Bob@gmail.com'));
		expect(nextState.players[0]).to.equal('Alex@gmail.com');
		nextState = words(nextState, draw_tiles('Alex@gmail.com'));
		nextState = words(nextState, draw_tiles('Bob@gmail.com'));
		if (!draws) {
			expect(nextState.emailToRack['Alex@gmail.com']).to.equal('hello_o');
			expect(nextState.drawPile).to.equal('rldherearesomeletters');
		}
		return nextState;
	}

	it('play horizontal move', () => {
		const move: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'hello',
			player: 'Alex@gmail.com'
		};
		const nextState = words(makeGameStartState(), play(move));
		expect(nextState.board[3].join('')).to.be.equal('hello');
	});

	it('play horizontal move with a blank', () => {
		const move: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'hellO',
			player: 'Alex@gmail.com'
		};
		const nextState = words(makeGameStartState(), play(move));
		expect(nextState.board[3].join('')).to.be.equal('hellO');
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function transpose(array: any[][]) {
		return array.map((_, colIndex) => array.map((row) => row[colIndex]));
	}

	it('play vertical move', () => {
		const move: WordsMove = {
			x: 2,
			y: 1,
			isVertical: true,
			letters: 'hello',
			player: 'Alex@gmail.com'
		};
		const nextState = words(makeGameStartState(), play(move));
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[2].join('')).to.be.equal('hello');
	});

	it('play vertical move after horizontal move', () => {
		const horizontal: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'hello',
			player: 'Alex@gmail.com'
		};
		const firstState = words(makeGameStartState(), play(horizontal));
		const vertical: WordsMove = {
			x: 4,
			y: 0,
			isVertical: true,
			letters: 'gdobye',
			player: 'Bob@gmail.com'
		};
		const nextState = words(firstState, play(vertical));

		expect(nextState.board[3].join('')).to.be.equal('hello');
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[4].join('')).to.be.equal('gdoobye');
	});

	it('play out of bound horizontal move', () => {
		const move: WordsMove = {
			x: 4,
			y: 3,
			isVertical: false,
			letters: 'hello',
			player: 'Alex@gmail.com'
		};
		const nextState = words(makeGameStartState(), play(move));
		expect(nextState.board[3].join('')).to.be.equal('');
	});

	it('play wrong initial horizontal move', () => {
		const move: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'he',
			player: 'Alex@gmail.com'
		};
		const nextState = words(makeGameStartState(), play(move));
		expect(nextState.board[3].join('')).to.be.equal('');
	});

	it('play wrong initial move where we are lacking letters', () => {
		const move: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'wello',
			player: 'Alex@gmail.com'
		};
		const nextState = words(makeGameStartState(), play(move));
		expect(nextState.board[3].join('')).to.be.equal('');
	});

	it('play wrong vertical move after horizontal move', () => {
		const horizontal: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'hel',
			player: 'Alex@gmail.com'
		};
		const firstState = words(makeGameStartState(), play(horizontal));
		const vertical: WordsMove = {
			x: 0,
			y: 4,
			isVertical: true,
			letters: 'godbye',
			player: 'Alex@gmail.com'
		};
		const nextState = words(firstState, play(vertical));

		expect(nextState.board[3].join('')).to.be.equal('hel');
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[4].join('')).to.be.equal('');
	});

	it('play legal horizontal moves with existing adjacent tiles', () => {
		const horizontal: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'hell',
			player: 'Alex@gmail.com'
		};
		const firstState = words(makeGameStartState(), play(horizontal));
		const vertical: WordsMove = {
			x: 0,
			y: 2,
			isVertical: false,
			letters: 'god',
			player: 'Bob@gmail.com'
		};
		const nextState = words(firstState, play(vertical));
		//'11111 31111
		// 12121 11111
		// 11111 11111 god
		// 12121 11121 hell.

		expect(nextState.board[3].join('')).to.be.equal('hell');
		expect(nextState.board[2].join('')).to.be.equal('god');
		const firstTurn = nextState.plays[0];
		expect(firstTurn.score).to.equal(18);
		const lastTurn = nextState.plays[1];
		expect(lastTurn.playerIndex).to.equal(1);
		expect(lastTurn.mainWord).to.equal('god');
		expect(lastTurn.sideWords.length).to.equal(3);
		expect(lastTurn.sideWords[0]).to.equal('gh');
		expect(lastTurn.sideWords[1]).to.equal('oe');
		expect(lastTurn.sideWords[2]).to.equal('dl');
		expect(lastTurn.score).to.equal(16);
		expect(nextState.scores[0]).to.equal(18);
		expect(nextState.scores[1]).to.equal(16);
	});

	it('scores single letter wrong dir correctly', () => {
		const horizontal: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'hell',
			player: 'Alex@gmail.com'
		};
		const firstState = words(makeGameStartState('hello_ogodbyes'), play(horizontal));

		const vertical: WordsMove = {
			x: 1,
			y: 2,
			isVertical: false,
			letters: 'd',
			player: 'Bob@gmail.com'
		};
		const nextState = words(firstState, play(vertical));
		expect(nextState.board[3].join('')).to.be.equal('hell');
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[1].join('')).to.be.equal('de');
		const singleLetterTurn = nextState.plays[1];
		expect(singleLetterTurn.score).to.equal(3);
		expect(singleLetterTurn.sideWords.length).to.equal(0);
		expect(singleLetterTurn.mainWord).to.equal('de');
	});
	it('scores the triple word score', () => {
		const horizontal: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'hell',
			player: 'Alex@gmail.com'
		};
		const firstState = words(makeGameStartState('hello_ogodbyes'), play(horizontal));

		const vertical: WordsMove = {
			x: 0,
			y: 0,
			isVertical: true,
			letters: 'god',
			player: 'Bob@gmail.com'
		};
		const nextState = words(firstState, play(vertical));
		//'11111 31111 g
		// 12121 12111 o
		// 11111 11111 d
		// 12121 11121 hell.

		expect(nextState.board[3].join('')).to.be.equal('hell');
		const transposedBoard = transpose(nextState.board);
		expect(transposedBoard[0].join('')).to.be.equal('godh');
		const firstTurn = nextState.plays[0];
		expect(firstTurn.score).to.equal(18);
		let lastTurn = nextState.plays[1];
		expect(lastTurn.playerIndex).to.equal(1);
		expect(lastTurn.mainWord).to.equal('godh');
		expect(lastTurn.sideWords.length).to.equal(0);
		expect(lastTurn.score).to.equal(27);

		const twoWaySetup: WordsMove = {
			x: 1,
			y: 0,
			isVertical: false,
			letters: 'oo',
			player: 'Alex@gmail.com'
		};
		const twoDW = words(nextState, play(twoWaySetup));
		lastTurn = twoDW.plays.slice(-1)[0];
		expect(lastTurn.playerIndex).to.equal(0);
		expect(lastTurn.mainWord).to.equal('goo');

		const twoWayDW: WordsMove = {
			x: 1,
			y: 1,
			isVertical: true,
			letters: 'y',
			player: 'Bob@gmail.com'
		};
		const twenty = words(twoDW, play(twoWayDW));
		lastTurn = twenty.plays.slice(-1)[0];
		expect(lastTurn.playerIndex).to.equal(1);
		expect(lastTurn.mainWord).to.equal('oy');
		expect(lastTurn.sideWords.length).to.equal(1);
		expect(lastTurn.sideWords[0]).to.equal('oy');
		expect(lastTurn.score).to.equal(36);
		expect(twenty.scores[0]).to.equal(22);
		expect(twenty.scores[1]).to.equal(63);

		//'11111 31111 goo
		// 12121 12111 oy
		// 11111 11111 d L
		// 12121 11121 hell.
		const lastMove: WordsMove = {
			x: 2,
			y: 2,
			isVertical: false,
			letters: 'L',
			player: 'Alex@gmail.com'
		};
		let gameOver = words(twenty, play(lastMove));
		lastTurn = gameOver.plays.slice(-1)[0];
		expect(lastTurn.playerIndex).to.equal(0);
		expect(lastTurn.mainWord).to.equal('Ll');
		expect(lastTurn.sideWords.length).to.equal(0);
		expect(lastTurn.score).to.equal(1); // the double is already covered
		expect(gameOver.gameOver).to.be.false;
		gameOver = words(gameOver, draw_tiles(lastMove.player));
		console.log(gameOver.emailToRack);
		expect(gameOver.gameOver).to.be.true;
		expect(gameOver.finalScoreAdjustment[0]).to.equal(4);
		expect(gameOver.finalScoreAdjustment[1]).to.equal(-4);
		expect(gameOver.scores[0]).to.equal(23 + 4);
		expect(gameOver.scores[1]).to.equal(63 - 4);
	});

	it('initialize draw pile', () => {
		const nextState = makeGameStartState('12345671234567foo');
		expect(nextState.drawPile).to.be.equal('foo');
	});

	it('allows the player to draw tiles from the draw pile', () => {
		let nextState = makeGameStartState('helloworldherearesomeletters');
		nextState = words(nextState, leave_game('Bob@gmail.com'));
		expect(nextState.players.length).to.equal(1);
		expect(nextState.players[0]).to.equal('Alex@gmail.com');
		nextState = words(nextState, draw_tiles('Alex@gmail.com'));
		expect(nextState.emailToRack['Alex@gmail.com']).to.equal('hellowo');
		expect(nextState.drawPile).to.equal('aresomeletters');
	});

	it('handles end of bag correctly', () => {
		let nextState = makeGameStartState('hel');
		expect(nextState.players.length).to.equal(2);
		expect(nextState.players[0]).to.equal('Alex@gmail.com');
		nextState = words(nextState, draw_tiles('Alex@gmail.com'));
		expect(nextState.emailToRack['Alex@gmail.com']).to.equal('hel');
		expect(nextState.drawPile).to.equal('');
	});

	it('lets the current player pass', () => {
		let nextState = makeGameStartState('hel');
		expect(nextState.players.length).to.equal(2);
		expect(nextState.currentPlayerIndex).to.equal(0);
		nextState = words(nextState, pass('Alex@gmail.com'));
		expect(nextState.currentPlayerIndex).to.equal(1);
	});

	it('reverses a bad word when challenged', () => {
		let nextState = makeGameStartState('helloworldherearesomeletters');
		expect(nextState.players.length).to.equal(2);
		expect(nextState.players[0]).to.equal('Alex@gmail.com');
		expect(nextState.players[1]).to.equal('Bob@gmail.com');
		expect(nextState.scores[0]).to.equal(0);
		expect(nextState.scores[1]).to.equal(0);
		expect(nextState.emailToRack['Alex@gmail.com']).to.equal('hellowo');
		expect(nextState.drawPile).to.equal('aresomeletters');
		expect(nextState.emailToRack['Bob@gmail.com']).to.equal('rldhere');
		const lastMove: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'wolle',
			player: 'Alex@gmail.com'
		};
		expect(nextState.board[3].join('')).to.be.equal('');
		nextState = words(nextState, play(lastMove));
		expect(nextState.scores[0]).to.equal(20);
		nextState = words(nextState, draw_tiles('Alex@gmail.com'));
		expect(nextState.emailToRack['Alex@gmail.com']).to.equal('hoareso');
		expect(nextState.drawPile).to.equal('meletters');
		expect(nextState.board[3].join('')).to.be.equal('wolle');
		expect(nextState.plays[0].challenged).to.equal(false);
		nextState = words(nextState, challenge('melettersareso'));
		expect(nextState.emailToRack['Alex@gmail.com']).to.equal('howolle');
		expect(nextState.drawPile).to.equal('melettersareso');
		expect(nextState.board[3].join('')).to.be.equal('');
		expect(nextState.plays[0].challenged).to.equal(true);
		expect(nextState.scores[0]).to.equal(0);
	});

	it('forces a pass due to bad challenge', () => {
		let nextState = makeGameStartState('helloworldherearesomeletters');
		expect(nextState.players.length).to.equal(2);
		expect(nextState.players[0]).to.equal('Alex@gmail.com');
		expect(nextState.players[1]).to.equal('Bob@gmail.com');
		expect(nextState.emailToRack['Alex@gmail.com']).to.equal('hellowo');
		expect(nextState.drawPile).to.equal('aresomeletters');
		expect(nextState.emailToRack['Bob@gmail.com']).to.equal('rldhere');
		const lastMove: WordsMove = {
			x: 0,
			y: 3,
			isVertical: false,
			letters: 'wolle',
			player: 'Alex@gmail.com'
		};
		nextState = words(nextState, play(lastMove));
		nextState = words(nextState, draw_tiles('Alex@gmail.com'));
		expect(nextState.emailToRack['Alex@gmail.com']).to.equal('hoareso');
		expect(nextState.drawPile).to.equal('meletters');
		nextState = words(nextState, fail_challenge('Bob@gmail.com'));
		expect(nextState.emailToPass['Bob@gmail.com']).to.equal(true);
		nextState = words(nextState, pass('Bob@gmail.com'));
		expect(nextState.emailToPass['Bob@gmail.com']).to.equal(false);
	});
});
