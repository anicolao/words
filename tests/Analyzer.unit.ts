import { expect } from 'chai';
import { describe, it } from 'vitest';

import { CubieCube, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
import { analyze_roux_solve, get_roux_stages } from '$lib/third_party/onionhoney/Analyzer';

describe('Analyzer breaks solves into good phases', () => {
	it('analyzes a roux solve', () => {
		const scramble = "L2 D2 R2 B2 F' D2 U2 L2 B2 F L B' U2 F' D U B L D2";
		const solution = `x y // inspection 
    r' u' // 1st square 
    U2 R' U2' F' // 1st block 
    U' r' U' R' U M' U2' r' U' r // 2nd square 
    U2' M U2' r U' r' // 2nd block 
    U2' R U2' R2' F R F' U2 R' F R F' // CMLL 
    U' M U M // EO 
    U' M2' U' // UL/UR 
    E2' M E2' M' // EP `;
		const t = Date.now();
		const result = analyze_roux_solve(new CubieCube().apply(scramble), new MoveSeq(solution));
		console.log(result.map((s) => [s.solution.toString(), s.stage]));
		expect(result.length).to.equal(5);
		console.log('solve analyzed in ', Date.now() - t, ' ms');
	});

	it('analyzes a my solve', async () => {
		const scramble = "B U' L2' F2 D2' F2 R' B2' D2' L' R' B2' R2 F' D U2 F2 U' R2 F";
		const solution =
			"U' D x2 z' F2 u' x x' l U' L M U2 M F' U U2' L' U' l x L' R D2 L' R L' R2 x' U l' B L' B' L U L U' L' M L' R B L R' U M' M L' R B R L' D2 R L' x U M R L' B' R L' D2 L' R";
		const t = Date.now();
		const result = get_roux_stages(scramble, solution);
		expect(result[0].solution.toString()).to.equal("U' D x2 z' F2 u' x x' l U' L M U2 M F' "); // fb
		expect(result[1].solution.toString()).to.equal("U U2 L' U' l "); // ss
		expect(result[2].solution.toString()).to.equal("x L' R D2 L' R L' R2 x' U l' "); // sp
		expect(result[3].solution.toString()).to.equal("B L' B' L U L U' L' "); // cmll
		expect(result[4].solution.toString()).to.equal(
			"M L' R B L R' U M' M L' R B R L' D2 R L' x U M R L' B' R L' D2 L' R "
		); // lse
		console.log(result.map((s) => [s.solution.toString(), s.stage]));
		expect(result.length).to.equal(5);
		console.log('solve analyzed in ', Date.now() - t, ' ms');
	});

	it('analyzes another solve', async () => {
		const scramble = "F3 D L2' B L D' R' D' B L B2' R U R R' U R' R2 D2' L2' D2' L' D2' R' U2";
		const solution =
			"L x' z L2' x' U' y' M2 y r x' x U U2' R' U M' x x' U2 M2' r' U' R2 M' M x' l' U M' U' r U2 F R' F' R U R U' R' U R U R' F' R U R' U' R' F R2 U' R2' r M' U M U2 M' U M' U2 M U2 M U' M2 U";
		const t = Date.now();
		const result = get_roux_stages(scramble, solution);
		expect(result[0].solution.toString()).to.equal("L x' z L2 x' U' y' M2 "); // first block: 8 moves
		expect(result[1].solution.toString()).to.equal("y r x' x U U2 R' U M' x x' U2 M2 r' U' R2 "); // second square: 16 moves
		expect(result[2].solution.toString()).to.equal("M' M x' l' U M' U' r "); // last pair: 8 moves
		expect(result[3].solution.toString()).to.equal(
			"U2 F R' F' R U R U' R' U R U R' F' R U R' U' R' F R2 U' R2 r "
		); // CMLL: 24 moves
		expect(result[4].solution.toString()).to.equal("M' U M U2 M' U M' U2 M U2 M U' M2 U "); // LSE: 14 moves

		console.log(result.map((s) => [s.solution.toString(), s.stage]));
		expect(result.length).to.equal(5);
		console.log('solve analyzed in ', Date.now() - t, ' ms');
	});

	it('originally failed on this solve', async () => {
		const scramble = "L2 U B' R' B L U L2 F R2 U L2 U' F2 U2 D' B2 U2 F2 R'";
		const solution =
			"F R L' R L' L F2' B2' F2 L' L F' F L F L' B' x' z x' B z' L' U2 L2 x' z2 x y' x2 D U' D' B' B2 U' D x L2 D x' D F2 D' L D' x D B' F x' D F D' L3 D' x D' F B L B' x' L' U' F U F' L' L U L U' F' U L U' L' U' F U2 L' U2' D F F' U' D R2 D' U F2 U D' L U' D F U D' L2 D' U B' x F' B F' B x2 y D R L' F2 R' L D2";
		const t = Date.now();
		const result = get_roux_stages(scramble, solution);
		console.log({ scramble, solution });
		console.log(result.map((s) => [s.solution.toString(), s.stage]));
		expect(result[0].solution.toString()).to.equal(
			"F R L' R L' L F2 B2 F2 L' L F' F L F L' B' x' z x' B z' L' U2 L2 x' z2 x y' x2 D U' D' B' B2 U' D x L2 D "
		); // first block
		expect(result[1].solution.toString()).to.equal("x' D F2 D' L D' x D B' F x' D F D' "); // ss
		expect(result[2].solution.toString()).to.equal("L3 D' x D' F "); // lp
		expect(result[3].solution.toString()).to.equal(
			"B L B' x' L' U' F U F' L' L U L U' F' U L U' L' U' F U2 L' U2 D "
		); // cmll
		expect(result[4].solution.toString()).to.equal(
			"F F' U' D R2 D' U F2 U D' L U' D F U D' L2 D' U B' x F' B F' B x2 y D R L' F2 R' L D2 "
		); // lse

		expect(result.length).to.equal(5);
		console.log('solve analyzed in ', Date.now() - t, ' ms');
	});

	it("handles L3' moves", async () => {
		const scramble = "L2 U B' R' B L3' U L2 F R2 U L2 U' F2 U2 D' B2 U2 F2 R'";
		const solution =
			"F R L' R L' L F2' B2' F2 L' L F' F L F L' B' x' z x' B z' L' U2 L2 x' z2 x y' x2 D U' D' B' B2 U' D x L2 D x' D F2 D' L D' x D B' F x' D F D' L3 D' x D' F B L B' x' L' U' F U F' L' L U L U' F' U L U' L' U' F U2 L' U2' D F F' U' D R2 D' U F2 U D' L U' D F U D' L2 D' U B' x F' B F' B x2 y D R L' F2 R' L D2";
		const t = Date.now();
		const result = get_roux_stages(scramble, solution);
		console.log({ scramble, solution });
		console.log(result.map((s) => [s.solution.toString(), s.stage]));
		expect(result[0].solution.toString()).to.equal(
			"F R L' R L' L F2 B2 F2 L' L F' F L F L' B' x' z x' B z' L' U2 L2 x' z2 x y' x2 D U' D' B' B2 U' D x L2 D "
		); // first block
		expect(result[1].solution.toString()).to.equal("x' D F2 D' L D' x D B' F x' D F D' "); // ss
		expect(result[2].solution.toString()).to.equal("L3 D' x D' F "); // lp
		expect(result[3].solution.toString()).to.equal(
			"B L B' x' L' U' F U F' L' L U L U' F' U L U' L' U' F U2 L' U2 D "
		); // cmll
		expect(result[4].solution.toString()).to.equal(
			"F F' U' D R2 D' U F2 U D' L U' D F U D' L2 D' U B' x F' B F' B x2 y D R L' F2 R' L D2 "
		); // lse

		expect(result.length).to.equal(5);
		console.log('solve analyzed in ', Date.now() - t, ' ms');
	});

	it("handles R5' moves", async () => {
		const scramble = "R' D' R B2' D R2 B' L' D' F' U2 D L2' D' B2' D' L2' B2' R2 U";
		const solution =
			"F2 M' E' R' L B F' x y M' S M2' M x y' B r' B u' x' L' U M R3 M' U2 M' B' R' U R L' B' x' R U R' L F L' U' L F L' L R' F2 L' U L F D R F R' F' D' F' x z R5' F D R' D' R' D R D' F' D R D' R' D' F D F' z' U M' U R L' B2 L R' U M' U2 M U2 R L' B' B2 R L' D2 R L' x U2";
		const t = Date.now();
		const result = get_roux_stages(scramble, solution);
		console.log({ scramble, solution });
		console.log(result.map((s) => [s.solution.toString(), s.stage]));
		expect(result[0].solution.toString()).to.equal(
			"F2 M' E' R' L B F' x y M' S M2 M x y' B r' B u' x' L' U M R3 M' U2 M' B' "
		); // first block: 28 moves
		expect(result[1].solution.toString()).to.equal("R' U R L' B' x' R U R' L F L' U' L F L' "); // ss
		expect(result[2].solution.toString()).to.equal("L R' F2 L' U L "); // lp
		expect(result[3].solution.toString()).to.equal(
			"F D R F R' F' D' F' x z R' F D R' D' R' D R D' F' D R D' R' D' F D F' "
		); // cmll
		expect(result[4].solution.toString()).to.equal(
			"z' U M' U R L' B2 L R' U M' U2 M U2 R L' B' B2 R L' D2 R L' x U2 "
		); // lse

		expect(result.length).to.equal(5);
		console.log('solve analyzed in ', Date.now() - t, ' ms');
	});
});
