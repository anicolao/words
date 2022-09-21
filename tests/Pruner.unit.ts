import { expect } from 'chai';
import { it } from 'vitest';

import { FbdrSolver, LSESolver } from '$lib/third_party/onionhoney/Solver';
import { CubeUtil, CubieCube, Mask } from '$lib/third_party/onionhoney/CubeLib';
import { CachedSolver } from '$lib/third_party/onionhoney/CachedSolver';

it('should solve FBSS cases', () => {
	// let cube = new CubieCube() // CubeUtil.get_random_with_mask(Mask.fs_back_mask)
	// let solver = CachedSolver.get("fbss-front")
	// let seqs = solver.solve(cube, 0, 10, 1)
	// console.log("query result = ", solver.getPruners()[0].query(cube),
	// solver.getPruners()[1].query(cube),)
	// console.log(seqs[0].toString())
});

it('should solve LSE cases', () => {
	const cube = CubeUtil.get_random_lse();
	const solver = LSESolver();
	const solutions = solver.solve(cube, 0, 20, 1);

	console.log(solutions.toString());
	const solved_cube = cube.apply(solutions[0]);

	expect(solver.is_solved(solved_cube)).to.equal(true);
});

it('should solve FBDR cases', () => {
	const cube = CubeUtil.get_random_with_mask(Mask.empty_mask);
	const solver = FbdrSolver();
	const solutions = solver.solve(cube, 0, 11, 1);

	console.log(solutions.toString());
	const solved_cube = cube.apply(solutions[0]);

	expect(solver.is_solved(solved_cube)).to.equal(true);
});

it('should solve FBSS cases', () => {
	const cube = new CubieCube(); // CubeUtil.get_random_with_mask(Mask.empty_mask)
	const solver = CachedSolver.get('fbss-front');
	expect(solver.getPruners().length).to.equal(2);
	const p0 = solver.getPruners()[0];
	const p0enc = p0.encode(cube);

	expect(p0enc < p0.size).to.be.true;
	expect(solver.getPruners()[0].query(cube)).to.equal(0);
	expect(solver.getPruners()[1].query(cube)).to.equal(0);
	expect(solver.is_solved(cube)).to.equal(true);

	const solutions = solver.solve(cube, 0, 11, 1);

	console.log(solutions.toString());
	const solved_cube = cube.apply(solutions[0]);

	expect(solver.is_solved(solved_cube)).to.equal(true);
});
