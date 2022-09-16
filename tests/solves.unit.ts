import { expect } from 'chai';
import { describe, it } from 'vitest';

import {
	initialState,
	add_scramble,
	add_solve,
    solves
} from '$lib/components/solves';

describe('scrambles', () => {
    it('can add a scramble', () => {
        const scramble = "L R' L";
        const id = "abcd-ef";
        const nextState = solves(initialState, add_scramble({ scramble, id }));
        expect(nextState.allScrambles.length).to.equal(1);
        expect(nextState.allScrambles[0]).to.equal(scramble);
        expect(nextState.unattempted.length).to.equal(1);
        expect(nextState.unattempted[0]).to.equal(scramble);
        expect(Object.keys(nextState.scrambleToSolve).length).to.equal(0);
    });

    it('can add a scramble after its time is recorded', () => {
        const scramble = "L R' L";
        const id = "abcd-ef";
        const time = 5;
        let nextState = solves(initialState, add_solve({scramble, moves: [], time}));
        nextState = solves(nextState, add_scramble({ scramble, id }));
        expect(nextState.allScrambles.length).to.equal(1);
        expect(nextState.allScrambles[0]).to.equal(scramble);
        expect(nextState.unattempted.length).to.equal(0);
        expect(Object.keys(nextState.scrambleToSolve).length).to.equal(1);
    });

    it('can filter scramble when a new time is recorded', () => {
        const scramble = "L R' L";
        const id = "abcd-ef";
        const time = 5;
        let nextState = solves(initialState, add_scramble({ scramble, id }));
        nextState = solves(nextState, add_solve({scramble, moves: [], time}));
        expect(nextState.allScrambles.length).to.equal(1);
        expect(nextState.allScrambles[0]).to.equal(scramble);
        expect(nextState.unattempted.length).to.equal(0);
        expect(Object.keys(nextState.scrambleToSolve).length).to.equal(1);
    });

});