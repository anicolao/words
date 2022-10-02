import { makeOptimizedData, movesToString, visualize } from '$lib/optimizer/optimizer';
import {
	analyze,
	get_oris,
	is_cmll_solved,
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
		const ret: SolutionDesc = {
			stage,
			orientation,
			solution: moves,
			rotatedSolution: moves,
			score: 0
		};
		return ret;
	}
	it('can find shorter first block', () => {
		const scramble = "D2' U2 B R2 D2' R2 B' R2 B' F2 D2' U L L2' B2' F2 D F L L2' D' D2 U'";
		const orientation = "y' x2 ";
		const userFB = { stage: 'fb', orientation, solution: "B' x2 y U' L2 D' L y' u2 f' F U S U2 R" };
		const solutionArray = [makeSolutionDesc(userFB)];
		const optimized = makeOptimizedData(scramble, solutionArray);
		console.log({ optimized });
		const computedSolution = orientation + movesToString(optimized[0][0].solution);
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
		const fb = "x2 R' B' R' M' B' R D2 ";
		state.post_scramble = fb;
		expect(solutions[0].solution.toString()).to.equal(fb);

		state.full_solution.push(solutions[0]);
		state.stage = 'ss';
		console.log(state);
		solutions = analyze(state);
		expect(solutions.length).to.equal(n * 2);
		const ss = "U R' M' U R U' R2 ";
		state.post_scramble += ' ' + ss;
		expect(solutions[0].solution.toString()).to.equal(ss);

		state.full_solution.push(solutions[0]);
		state.stage = 'sp';
		console.log(state);
		solutions = analyze(state);
		expect(solutions.length).to.equal(n);
		const sp = "R' M' U2 r U' r' U R ";
		state.post_scramble += sp;
		expect(solutions[0].solution.toString()).to.equal(sp);
	});

	it.skip('can solve ss', () => {
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
		const fb = "x2 R' B' R' M' B' R D2 ";
		state.post_scramble = fb;
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
		solutions[0].solution = new MoveSeq(userFB.solution + ' ' + rotationMove);
		state.full_solution.push(solutions[0]);
		state.stage = 'ss';
		console.log(state);
		solutions = analyze(state);
		expect(solutions.length).to.equal(n * 2);
		const ss = '';
		state.post_scramble += ss;
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
		const computedSolution = userFB.solution + movesToString(optimized[1][0].solution);
		expect(computedSolution).to.equal(
			"B' x2 y U' L2 D' L y' u2 f' F U S U2 R y'  R U' R' U R U' R2"
			//"B' x2 y U' L2 D' L y' u2 f' F U S U2 R y'  U M' U R' M' U' R2"
		);
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

	type UserSolution = {
		scramble: string;
		orientation: string;
		fb: string;
		ss: string;
		lp: string;
		cmll: string;
		lse: string;
	};
	const stages = ['fb', 'ss', 'lp', 'cmll', 'lse'];
	function userSolutionToSolutionArray(userSolution: UserSolution) {
		return stages.map((stage) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return makeSolutionDesc({
				stage,
				orientation: userSolution.orientation,
				solution: (userSolution as any)[stage]
			});
		});
	}

	it('can improve a complete user solution', () => {
		const userSolution: UserSolution = {
			scramble: "D' F B D' R' U' F' L2' U' F2 D2' F2 L D2' R2 D2' L2' F2 R B2' L",
			orientation: "x2 y'",
			fb: "z y' L' F B' S' U R U D R' L2 D2 R D",
			ss: "r2 U' r U' r2 R' U2 M2 r' U' r",
			lp: "U M U2 R U' r' M U2 r U r'",
			cmll: "R' U' R U' R' U2 R U' R U R' F' R U R' U' R' F R2 U' R'",
			lse: "M' U2 M U M U M U2 M U' M2 U  "
		};
		const solArray = userSolutionToSolutionArray(userSolution);
		const optimized = makeOptimizedData(userSolution.scramble, solArray);
		expect(optimized[0][0].orientation).to.equal("x2 y'");
		expect(optimized[0][0].solution.toString()).to.equal("x2 D' r B2 R' D F' ");
		const spin = new MoveSeq(userSolution.orientation);
		const cube = new CubieCube()
			.apply(userSolution.scramble)
			.apply(new MoveSeq(userSolution.orientation))
			.changeBasis(spin)
			.apply(spin.inv());
		const v = visualize(cube);
		console.log(v);

		const userFBCube = cube.apply(new MoveSeq(userSolution.fb));
		console.log(visualize(userFBCube));

		expect(optimized[1][0].solution.toString()).to.equal("R' U' M' U r U' R2 ");

		expect(optimized[2][0].solution.toString()).to.equal("R U2 R' U R U' R' ");

		expect(optimized[3][0].solution.toString()).to.equal(' ');

		expect(optimized[4][0].solution.toString()).to.equal("M' U M' U2 M' U M' U M U ");
	});

	function validateUserSolution(userSolution: UserSolution) {
		it(`validates ${userSolution.scramble} and its improved stages`, () => {
			const solArray = userSolutionToSolutionArray(userSolution);
			const optimized = makeOptimizedData(userSolution.scramble, solArray);
			const spin = new MoveSeq(userSolution.orientation);
			let cube = new CubieCube()
				.apply(userSolution.scramble)
				.apply(new MoveSeq(userSolution.orientation));
			const userFBCube = cube.apply(new MoveSeq(userSolution.fb));
			const optimizedFBCube = cube.apply(optimized[0][0].solution);
			const allOries = get_oris('cn').map((m) => new MoveSeq(m));
			function validateFB(c: CubieCube) {
				const fbOrientation = is_fb_solved(c, allOries);
				expect(!!fbOrientation).to.be.true;
				if (!fbOrientation) {
					expect(false).to.be.true;
					return;
				}
				expect(fbOrientation.toString()).to.equal(spin.toString());
				c = c.changeBasis(spin).apply(spin.inv());
				expect(is_fb_solved(c, allOries)?.toString()).to.equal(' ');
				expect(CubeUtil.is_solved(c, Mask.fb_mask)).to.be.true;
			}
			validateFB(userFBCube);
			validateFB(optimizedFBCube);
			cube = userFBCube.changeBasis(spin).apply(spin.inv());

			const optimizedSS = cube.apply(optimized[1][0].solution);
			cube = cube.apply(userSolution.ss);
			function validateSS(c: CubieCube) {
				const ssfSolver = CachedSolver.get('ss-front');
				const ssbSolver = CachedSolver.get('ss-back');
				expect(ssfSolver.is_solved(c) || ssbSolver.is_solved(c)).to.be.true;
			}
			validateSS(optimizedSS);
			validateSS(cube);

			const optimizedSB = cube.apply(optimized[2][0].solution);
			cube = cube.apply(userSolution.lp);
			function validateSB(c: CubieCube) {
				const sbSolver = CachedSolver.get('sb');
				expect(sbSolver.is_solved(c)).to.be.true;
			}
			validateSB(optimizedSB);
			validateSB(cube);

			cube = cube.apply(userSolution.cmll);
			expect(is_cmll_solved(cube, allOries)).to.be.true;

			const optimizedLSE = cube.apply(optimized[4][0].solution);
			cube = cube.apply(userSolution.lse);
			expect(CubeUtil.is_cube_solved(cube)).to.be.true;
			expect(CubeUtil.is_cube_solved(optimizedLSE)).to.be.true;
		});
	}
	validateUserSolution({
		scramble: "D' F B D' R' U' F' L2' U' F2 D2' F2 L D2' R2 D2' L2' F2 R B2' L",
		orientation: "x2 y'",
		fb: "z y' L' F B' S' U R U D R' L2 D2 R D",
		ss: "r2 U' r U' r2 R' U2 M2 r' U' r",
		lp: "U M U2 R U' r' M U2 r U r'",
		cmll: "R' U' R U' R' U2 R U' R U R' F' R U R' U' R' F R2 U' R'",
		lse: "M' U2 M U M U M U2 M U' M2 U  "
	});
	validateUserSolution({
		scramble: "D2' R U2 B2' L2' D L2' U' R2 D' D2 F2 L2' D B2' F' L' R D L2' B U",
		orientation: 'x2 y ',
		fb: "z'  F R L2 B F' U' S U M R2 D L B2 L B' ",
		ss: "r M R' U2 M' R U2 r' U' r2 R' ",
		lp: "M' U' R U M' U R' U' r U r' ",
		cmll: "F R U R' U' R U R' U' F' ",
		lse: "U M2 U M U2 M U M2 U2 M' U M2 U2 "
	});

	/*
	validateUserSolution({
		scramble: "F' D2' B2' U F R D F R' F2 U2 F2 R F2 B2' R F2 R2 F2 L L2' D",
		orientation: "y' ",
		fb: "  D' U' F' U R B R' D2 ",
		ss: "R R2 F R U R B r2 R' D2 M2 D' R M' F2 R' D' r F r R' F' M M' F2 M2 F2 r' D2 R' B' R2 r' ",
		lp: "r F' R' ",
		cmll: "D' F r F r' D' F' F r F r' D' F' D r F r' F' r F r' D' r' D r2 F' r' ",
		lse: "r R' D' R r' D2 M D M D M2 D M2 D' "
	});
	*/
});
