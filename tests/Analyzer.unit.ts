import { expect } from 'chai';
import { describe, it } from 'vitest';

import { CubieCube, FaceletCube, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
import { analyze_roux_solve, get_roux_stages } from '$lib/third_party/onionhoney/Analyzer';

import { Alg } from 'cubing/alg';
import { cube3x3x3 } from 'cubing/puzzles';

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
        expect(result[4].solution.toString()).to.equal("M L' R B L R' U M' M L' R B R L' D2 R L' x U M R L' B' R L' D2 L' R "); // lse 
		console.log(result.map((s) => [s.solution.toString(), s.stage]));
		expect(result.length).to.equal(5);
		console.log('solve analyzed in ', Date.now() - t, ' ms');
	});
});
