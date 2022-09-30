import { expect } from 'chai';
import { describe, it } from 'vitest';

import { Alg, Move } from 'cubing/alg';
import {
	experimentalAppendMove,
	type ExperimentalCollapseOptions
} from '$lib/cubing/alg/operation';

function testAppendMoveTransform({
	test,
	start,
	move,
	result,
	options
}: {
	test: string;
	start: string;
	move: string;
	result: string;
	options: ExperimentalCollapseOptions;
}) {
	it(`${test} experimentalAppendMove of ${start} + ${move} => ${result}`, () =>
		expect(experimentalAppendMove(new Alg(start), new Move(move), options).toString()).to.equal(
			result
		));
}

function tests({
	test,
	options,
	tests
}: {
	test: string;
	tests: string[];
	options: ExperimentalCollapseOptions;
}): void {
	tests.map((s) => {
		const parts = s.split(/[+=]/).map((x) => x.trim() as string);
		expect(parts.length).to.equal(3);
		testAppendMoveTransform({
			test,
			start: parts[0].trim(),
			move: parts[1].trim(),
			result: parts[2].trim(),
			options
		});
	});
}

describe('operation', () => {
	tests({
		test: 'can append moves',
		options: {},
		tests: ["R U R' + U2 = R U R' U2", "R U R' + R2' = R U R' R2'", "R U R' + R = R U R' R"]
	});

	tests({
		test: 'can coalesce appended moves',
		options: { sameDirection: true, oppositeDirection: true },
		tests: ["R U R' + U2 = R U R' U2", "R U R' + R2' = R U R3'", "R U R' + R = R U", 'r + r = r2']
	});

	tests({
		test: 'mod 4 works as expected',
		options: {
			sameDirection: true,
			oppositeDirection: true,
			quantumMoveOrder: 4
		},
		tests: ['L3 + L = ', 'L3 + L3 = L2', 'L3 + L6 = L']
	});
	tests({
		test: 'mod 3 works as expected',
		options: {
			sameDirection: true,
			oppositeDirection: true,
			quantumMoveOrder: 3
		},
		tests: ["L + L = L'", 'L3 + L3 = ', 'L3 + L6 = ']
	});

	tests({
		test: 'wide moves not processed by default',
		options: {},
		tests: ['L + x = L x']
	});
	tests({
		test: 'wide moves',
		options: { wideMoves333: true },
		tests: [
			'L + x = r',
			"L' + x' = r'",
			"R + x' = l",
			'R + x = R x',
			"R' + x = l'",
			"R' R + x = R' R x",
			'L2 + x2 = r2',
			'x + L = x L',
			'r L + x = r r'
		]
	});
	tests({
		test: 'wide moves with sameDirection',
		options: { wideMoves333: true, sameDirection: true },
		tests: ['L + x = r', 'r + L = r L', 'r L + x = r2']
	});
	tests({
		test: 'slice moves',
		options: { wideMoves333: true, sliceMoves333: true },
		tests: [
			"R' R + x = R' R x",
			"L' R + x' = M",
			"L R' + x = M'",
			"L' R + x = L' R x",
			"R L' + x' = M",
			"U' D + y = E'",
			"U D' + y' = E",
			"F B' + z' = S'",
			"F' B + z = S",
			"L R' + x' = L R' x'",
			"U' D + y' = U' D y'",
			"U D' + y = U D' y",
			"F B' + z = F B' z",
			"F' B + z' = F' B z'",
			'x L + R = x L R',
			"L2' R2 + x2' = M2"
		]
	});
	tests({
		test: 'slice moves only',
		options: { sliceMoves333: true },
		tests: ['R + x = R x', "R x + L' = R x L'", "L2' R2 + x2' = M2", "F B' + z' = S'"]
	});
});
