import { makeOptimizedData, movesToString, visualize } from '$lib/optimizer/optimizer';
import {
	analyze,
	get_oris,
	is_fb_solved,
	prerotate_solves
} from '$lib/third_party/onionhoney/Analyzer';
import type { AnalyzerState, SolutionDesc } from '$lib/third_party/onionhoney/Analyzer';
import { CubeUtil, CubieCube, Mask, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { CachedSolver } from '$lib/third_party/onionhoney/CachedSolver';

describe('optimizer can find helpful shorter solutions', () => {
	function makeSolutionDesc(userSolution: {
		stage: string;
		orientation: string;
		solution: string;
	}): SolutionDesc {
		const stage = userSolution.stage;
		const orientation = userSolution.orientation;
		const moves = new MoveSeq(userSolution.solution);
		const ret: SolutionDesc = { stage, orientation, solution: moves, premove: '', score: 0 };
		return ret;
	}
	it('can find shorter first block', () => {
		const scramble = "D2' U2 B R2 D2' R2 B' R2 B' F2 D2' U L L2' B2' F2 D F L L2' D' D2 U'";
		const orientation = "y' x2 ";
		const userFB = { stage: 'fb', orientation, solution: "B' x2 y U' L2 D' L y' u2 f' F U S U2 R" };
		const solutionArray = [makeSolutionDesc(userFB)];
		const optimized = makeOptimizedData(scramble, solutionArray);
		console.log({ optimized });
		const computedSolution =
			orientation + optimized[0][0].premove + ' ' + movesToString(optimized[0][0].solution);
		expect(computedSolution).to.equal("y' x2 x2 R' B' R' M' B' R D2");
		const spin = new MoveSeq(orientation);
		const cube = new CubieCube()
			.apply(scramble)
			.apply(new MoveSeq(computedSolution))
			.changeBasis(spin)
			.apply(spin.inv());
		const v = visualize(cube);
		console.log(v);
		expect(CubeUtil.is_solved(cube, Mask.fb_mask)).to.be.true;
		const solvedScramble = scramble + ' ' + computedSolution + orientation;
		console.log(solvedScramble);
		const preSolved = makeOptimizedData(solvedScramble, solutionArray);
		expect(movesToString(preSolved[0][0].solution)).to.equal('');
		expect(preSolved[0][0].solution.moves.length).to.equal(0);
	});

	it('analyze can solve a scramble', () => {
		const scramble = "D2' U2 B R2 D2' R2 B' R2 B' F2 D2' U L L2' B2' F2 D F L L2' D' D2 U'";
		const n = 3;
		const state: AnalyzerState = {
			scramble,
			post_scramble: '',
			full_solution: [],
			stage: 'fb',
			pre_orientation: '',
			num_solution: n,
			show_mode: '',
			orientation: 'x2y'
		};
		let solutions = analyze(state);
		expect(state.full_solution.length).to.equal(0);
		expect(solutions.length).to.equal(n * 8);
		expect(solutions[0].premove).to.equal('');
		state.post_scramble = "U F' R D2 R D' R2 B' ";
		expect(solutions[0].solution.toString()).to.equal(state.post_scramble);

		state.full_solution.push(solutions[0]);
		state.stage = 'ss';
		console.log(state);
		solutions = analyze(state);
		expect(solutions.length).to.equal(n * 2);
		const ss = "r U2 R U' R M U' R2 ";
		state.post_scramble += ss;
		expect(solutions[0].solution.toString()).to.equal(ss);

		state.full_solution.push(solutions[0]);
		state.stage = 'sp';
		console.log(state);
		solutions = analyze(state);
		expect(solutions.length).to.equal(n);
		const sp = "U r' U R U' R' U' R ";
		state.post_scramble += sp;
		expect(solutions[0].solution.toString()).to.equal(sp);
	});

	it('analyze can solve a forced orientation scramble', () => {
		const scramble = "D2' U2 B R2 D2' R2 B' R2 B' F2 D2' U L L2' B2' F2 D F L L2' D' D2 U'";
		const n = 3;
		const state: AnalyzerState = {
			scramble,
			post_scramble: '',
			full_solution: [],
			stage: 'fb',
			pre_orientation: '',
			num_solution: n,
			show_mode: '',
			orientation: "y' x2"
		};
		let solutions = analyze(state);
		expect(state.full_solution.length).to.equal(0);
		expect(solutions.length).to.equal(n);
		expect(solutions[0].orientation).to.equal("y' x2");
		expect(solutions[0].premove).to.equal('x2');
		const fb = "R' B' R' M' B' R D2 ";
		state.post_scramble = solutions[0].premove + ' ' + fb;
		expect(solutions[0].solution.toString()).to.equal(fb);

		state.full_solution.push(solutions[0]);
		state.stage = 'ss';
		console.log(state);
		solutions = analyze(state);
		expect(solutions.length).to.equal(n * 2);
		const ss = "U R' M' U R U' R2 ";
		state.post_scramble += ' ' + ss;
		expect(solutions[0].premove).to.equal('');
		expect(solutions[0].solution.toString()).to.equal(ss);

		state.full_solution.push(solutions[0]);
		state.stage = 'sp';
		console.log(state);
		solutions = analyze(state);
		expect(solutions.length).to.equal(n);
		const sp = "R' M' U2 r U' r' U R ";
		state.post_scramble += sp;
		expect(solutions[0].premove).to.equal('');
		expect(solutions[0].solution.toString()).to.equal(sp);
	});

	it('can solve ss', () => {
		const scramble = "D2' U2 B R2 D2' R2 B' R2 B' F2 D2' U L L2' B2' F2 D F L L2' D' D2 U'";
		const n = 3;
		const orientation = "y' x2 ";
		const state: AnalyzerState = {
			scramble,
			post_scramble: '',
			full_solution: [],
			stage: 'fb',
			pre_orientation: '',
			num_solution: n,
			show_mode: '',
			orientation
		};
		// solve it manually first.
		let solutions = analyze(state);
		expect(state.full_solution.length).to.equal(0);
		expect(solutions.length).to.equal(n);
		expect(solutions[0].orientation).to.equal("y' x2 ");
		expect(solutions[0].premove).to.equal('x2');
		const fb = "R' B' R' M' B' R D2 ";
		state.post_scramble = solutions[0].premove + ' ' + fb;
		expect(solutions[0].solution.toString()).to.equal(fb);

		const userFB = { stage: 'fb', orientation, solution: "B' x2 y U' L2 D' L y' u2 f' F U S U2 R" };
		let fbcube = new CubieCube().apply(scramble).apply(new MoveSeq(userFB.solution));
		const allOries = get_oris('cn').map((m) => new MoveSeq(m));
		const fbOrientation = is_fb_solved(fbcube, allOries);
		expect(!!fbOrientation).to.be.true;
		if (!fbOrientation) {
			expect(false).to.be.true;
			return;
		}
		expect(fbOrientation.toString()).to.equal('x2 y ');
		fbcube = fbcube.changeBasis(fbOrientation).apply(fbOrientation.inv());
		const rotationMove = prerotate_solves(fbcube, Mask.fb_mask, allOries);
		console.log(rotationMove?.toString());

		let vUser = visualize(fbcube);
		console.log(vUser);

		const userFBMoves = userFB.solution + ' ' + rotationMove;

		state.post_scramble = userFBMoves;
		solutions[0].premove = '';
		solutions[0].solution = new MoveSeq(userFB.solution + ' ' + rotationMove);
		state.full_solution.push(solutions[0]);
		state.stage = 'ss';
		console.log(state);
		solutions = analyze(state);
		expect(solutions.length).to.equal(n * 2);
		const ss = '';
		state.post_scramble += ss;
		expect(solutions[0].premove).to.equal('');
		expect(solutions[0].solution.toString()).to.equal("R U' R' U R U' R2 ");

		userFB.solution = userFBMoves;
		console.log({ uo: userFB.orientation, orientation });
		fbcube = new CubieCube().apply(scramble).apply(new MoveSeq(userFB.solution));

		vUser = visualize(fbcube);
		console.log(vUser);

		const userSS = {
			stage: 'ss',
			orientation: orientation,
			solution: "B' x2 y U' L2 D' L y' u2 f' F U S U2 R"
		};
		const solutionArray = [makeSolutionDesc(userFB), makeSolutionDesc(userSS)];
		const optimized = makeOptimizedData(scramble, solutionArray);
		const computedSolution =
			userFB.solution + optimized[1][0].premove + ' ' + movesToString(optimized[1][0].solution);
		expect(computedSolution).to.equal("B' x2 y U' L2 D' L y' u2 f' F U S U2 R y'  R U' R' U R U' R2");
		const spin = new MoveSeq(orientation);
		const cube = new CubieCube()
			.apply(scramble)
			.apply(new MoveSeq(computedSolution))
			.changeBasis(spin)
			.apply(spin.inv());
		const v = visualize(cube);
		console.log(v);
		expect(CubeUtil.is_solved(cube, Mask.fb_mask)).to.be.true;
		expect(CubeUtil.is_solved(cube, Mask.ss_front_mask)).to.be.true;

		const fbSolver = CachedSolver.get('fb');
		expect(fbSolver.is_solved(cube)).to.be.true;

		const ssSolver = CachedSolver.get('ss-front');
		expect(ssSolver.is_solved(cube)).to.be.true;
	});
});
