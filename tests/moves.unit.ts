import { Move, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
import { expect } from 'chai';
import { describe, it } from 'vitest';

describe('CubeLib.Move has useful functionality', () => {
	it('serializes moves as expected', () => {
		const R = Move.all['R'];
		expect(R.serialize()).to.equal(
			'{"cpc":[[3,2],[2,6],[6,7],[7,3]],"coc":[1,2,1,2],"epc":[[3,10],[10,7],[7,11],[11,3]],"eoc":[0,0,0,0],"tpc":[]}'
		);
	});

	it('composes moves as expected', () => {
		const R = Move.all['R'];
		const y = Move.all['y'];
		const F = Move.all['F'];
		const Ry = new Move().from_moves([R, y], 'Ry');
		const yF = new Move().from_moves([y, F], 'yF');
		expect(Ry.serialize()).to.equal(yF.serialize());
	});

	it('can push back a move through a sequence', () => {
		const alg = new MoveSeq('L');
		const R = Move.all['R'];
		const combined = alg.pushBack(R);
		expect(combined.toString()).to.equal('R L ');
	});

	it('can push back a move through a sequence II', () => {
		const alg = new MoveSeq('D L');
		const R = Move.all['R'];
		const combined = alg.pushBack(R);
		expect(combined.toString()).to.equal('D R L ');
	});

	it('can modify a move sequence by pushing a rotation', () => {
		const alg = new MoveSeq('D L');
		const R = Move.all['x'];
		const combined = alg.pushBack(R);
		expect(combined.toString()).to.equal('x F L ');
	});

	it('can modify a move sequence by pushing a rotation II', () => {
		const alg = new MoveSeq("D r'");
		const R = Move.all['y'];
		const combined = alg.pushBack(R);
		expect(combined.toString()).to.equal("y D f' ");
	});

	it('pushes rotations through each other', () => {
		const alg = new MoveSeq('z z');
		const R = Move.all["y'"];
		const combined = alg.pushBack(R);
		expect(combined.toString()).to.equal("y' x x ");
	});

	it('pushes rotations through each other II', () => {
		const alg = new MoveSeq("R L' x");
		const R = Move.all["y'"];
		const combined = alg.pushBack(R);
		expect(combined.toString()).to.equal("y' B F' z' ");
	});

	it('pushes rotations through each other III', () => {
		const alg = new MoveSeq("F' B z");
		const R = new MoveSeq('x2 y');
		const combined = alg.pushBackAll(R);
		expect(combined.toString()).to.equal("y z2 R' L x ");
	});

	it('can push back multiple moves', () => {
		const alg = new MoveSeq('U L F R D B');
		const I = new MoveSeq('y y y y');
		const combined = alg.pushBackAll(I);
		expect(combined.toString()).to.equal('y y y y U L F R D B ');
	});
});
