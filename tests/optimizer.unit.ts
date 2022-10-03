import { makeOptimizedData, movesToString, visualize } from '$lib/optimizer/optimizer';
import {
	analyze,
	get_oris,
	get_roux_stages,
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
		original_solution?: string;
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
		let preprocessed = '';
		if (userSolution.original_solution) {
			validateViaStages(userSolution.scramble, userSolution.original_solution);
			preprocessed = ' (preprocessed)';
		}
		it(`validates${preprocessed} ${userSolution.scramble} and its improved stages`, () => {
			const solArray = userSolutionToSolutionArray(userSolution);
			const optimized = makeOptimizedData(userSolution.scramble, solArray);
			const spin = new MoveSeq(userSolution.orientation);
			let cube = new CubieCube().apply(userSolution.scramble).apply(spin);
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

	function validateViaStages(scramble: string, solution: string) {
		const stages = get_roux_stages(scramble, solution);
		let fb = '';
		if (stages[0].view) {
			fb += stages[0].view.inv() + ' ';
		}
		fb += stages[0].rotatedSolution.toString();
		validateUserSolution({
			scramble,
			orientation: new MoveSeq(stages[0].orientation || '').toString(),
			fb,
			ss: stages[1].rotatedSolution.toString(),
			lp: stages[2].rotatedSolution.toString(),
			cmll: stages[3].rotatedSolution.toString(),
			lse: stages[4].rotatedSolution.toString()
		});
	}
	validateUserSolution({
		scramble: "F' D2' B2' U F R D F R' F2 U2 F2 R F2 B2' R F2 R2 F2 L L2' D",
		original_solution:
			"D' U' L' U F R F' D2 B3' B2 R B U B L F2 B' U2 S2' U' B S' L2 B' U' F U F B' R' S S' R2 S2' R2' F' R2 B' D' B2 b' F R' B' D' R F D F' D' R' R F D F' D' R' D F D F' R' F D F' D' F' R F2 D' F' F B' L' B F' D2 S D S D S2' D S2' D'",
		orientation: "y' ",
		fb: "  D' U' F' U R B R' D2 ",
		ss: "r r2 U r U r U R2 r' U2 M2 U' r M U2 r' U' R U R r' U' M' M U2 M2 U2 R' U2 r' U' r2 R' ",
		lp: "R U' r' ",
		cmll: "U' F R U R' U' F' F R U R' U' F' U R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "R r' U' r R' U2 M' U M' U M2 U M2 U' "
	});

	validateUserSolution({
		scramble: "B' U' F' L U2 F' R L2' U B' L2' U2 B' U2 F' L2' U2 L2' B2' R2 B2'",
		original_solution:
			"F D U R2 D U' R' F' F B' U' F R' F B' D F' L' D' L' F' M2 R' F R M' F2 M2' L D L' F' D R F R' F' D' F' R F R' D' R F R' F' R' D R2 F' R' F L R' D R L' F2 M' F M' R L' M' U U' U M2 U' M2' U M' U2 M3",
		orientation: 'x2 ',
		fb: "x  D B F R2 B F' R' D' D U' F' D R' D U' B D' ",
		ss: "r' U' r' U' M2 R' U R ",
		lp: "M' U2 M2 r U r' ",
		cmll: "U' F R U R' U' F' U' R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "U r R' U R r' U2 M' U M' R r' M' U U' U M2 U' M2 U M' U2 M3 "
	});

	validateUserSolution({
		scramble: "R L2' D R U U2' F U2 B' U2 R F2 D2' R B2' U2 B2' L2' F2 R' L2' B'",
		original_solution:
			"U R L2 F2 L' S L2 S' L4 U D2' F' F L' F' B F' F D F' S' D2 S' R B' L B D B' S' B' U' B2' D F D' B' S' L' F' L' S2' L2 F L' B' U F U F' U' U F U' F' U L F' L' F U F U' F' U3 L F U F' U' L' U2 F U F' L' F U F' U' F' L F2 U' F' S2 U' S U S' U S2 U2 S2 U' S U2 S2' U2 S",
		orientation: "y' ",
		fb: "x2  D F B2 R2 B' M' B2 M D U2 R' R B' R' L R' R U R' M U2 M F ",
		ss: "r' U r U r' M r' U' r2 U R U' r' M U' R' ",
		lp: "U' M2 U2 R U' r' ",
		cmll: "U R U R' U' U R U' R' U F R' F' R U R U' R' U' F R U R' U' F' U2 R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "M2 U' M' U M U M2 U2 M2 U' M' U2 M2 U2 M' "
	});

	validateUserSolution({
		scramble: "D2' R2 D2' B2' F D2' B2' R2 U2 L2' R2 F' U' R' B2' U' R2 F' D D2'",
		original_solution:
			"F' E2 R F2 R2 L2 B F' D' B' D' B F B' S2' B F' B3' D2 S L F2 U F' B F' D2 S2 B' D2' F L F2' R2 F D B D B' D B D2 B' D2 B D B' L' B D B' D' B' L B2 D' B' S3' D' S D S D' S D2 S' D S' D2 S' D2 S2 D2",
		orientation: 'x2 y ',
		fb: "y2  L' E2 B L2 B2 F2 R L' U' R' U' R L R' M2 R L' R U2 M F ",
		ss: "r2 U r' R r' U2 M2 R' U2 r U r2 U2 r ",
		lp: 'U ',
		cmll: "R U R' U R U2 R' U2 R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "M U' M U M U' M U2 M' U M' U2 M' U2 M2 U2 "
	});

	// Blue-Yellow solve
	validateUserSolution({
		scramble: "F' B D2' F2 R' D' F' L2' U F2 R U2 D2' R D2' R F2 L D2' B2'",
		original_solution:
			"D' B2 L R B' R2' E F L3' M2 B R U2 L2 L' B R B L U L' B R' B' L U L' B2' R' B L2 R' F2' M L' U' L F' R F R' F' R' D R D' R F R' D' R F R' F' R' D R2 F' R' F' M' F M F2 M' F M' F M' F2 L R' D M2' D' M' D2 M2 D2 M'",
		orientation: "y' ",
		fb: "x2 y'  U' F2 L R F' R2 E' B L M2 F R D2 ",
		ss: "r2 r' U R U r U r' U R' U' r U r' ",
		lp: "U2 R' U r2 R' U2 M r' U' r ",
		cmll: "U' R U R' U' R' F R F' R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "U' M' U M U2 M' U M' U M' U2 r R' U M2 U' M' U2 M2 U2 M' "
	});
	// Blue-White solve
	validateUserSolution({
		scramble: "U B' L' D R' D' B2' R' F' D2' R2 U L2' F2 U2 D' F2 B2' D' L2'",
		original_solution:
			"D' B U' D' S D' F D F2' L' B R B U B2' D S D' F D2' F' D2' F' D S2 F D2 B' L' B D2 F D F' D' F' R F R' D2 F D F' R' F D F' D' F' R F2 D' F' S' D' S D2 S D S D2 S D2 S' D S D2 S",
		orientation: 'x2 y ',
		fb: "  U' L D' U' M' U' R U R2 B' ",
		ss: "r U r U r2 U M' U' R U2 R' ",
		lp: "U2 R' U M2 R U2 r' U' r ",
		cmll: "U2 R U R' U' R' F R F' U2 R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "M U' M' U2 M' U M' U2 M' U2 M U M' U2 M' "
	});
	// Orange-Yellow
	validateUserSolution({
		scramble: "U2 L D' B' R' B' R2 L' L2 D R2 F2 R2 L2' F' U2 L2' B U2 R2 B2'",
		original_solution:
			"D B2 L B2 D' M L D' L' R' D' R2 D' R' M' D M D2 L' D L D R' D R2 D L' F' M' R F' L' R' U R U2 L' B' L F R U R' U' R U R' U' F' U R U R' F' R U R' U' R' F R2 U' R' M' U M' U M2 U' R L' B2 M' B' M' B2 M' B2 M2 B'",
		orientation: ' ',
		fb: "x  F D2 L D2 F' M L F' L' R' F' R2 F' R' M' F M F2 L' F ",
		ss: "r U R' U R2 U r' U' M' R U' r' ",
		lp: "R' U R U2 r' U' r ",
		cmll: "F R U R' U' R U R' U' F' U R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "M' U M' U M2 U' R r' U2 M' U' M' U2 M' U2 M2 U' "
	});
	// Orange-White
	validateUserSolution({
		scramble: "F U2 L2' B R2 U2 F' R2 F' D2' L2' F L U2 R B2' U2 B' U L'",
		original_solution:
			"U R' D R D2 L D L' R' R D' L' F L D D' L R' B M L' B' L2 U' R2' U2 L' M' B2 M2' B L' D2 L U R' U' R B R B' R' R B R' U' R B R' B' R' U R2 B' R' M2' B M B2 M' B M' B M2 B2 M2 B M' B2 M B2 M2 B",
		orientation: 'x2 ',
		fb: "  D R' U R U2 L U L' R' R U' L' B L U U' L R' F M L' F' ",
		ss: "r2 U' R2 U2 r' ",
		lp: "M' U2 M2 U r' U2 r ",
		cmll: "F R' F' R U R U' R' R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "M2 U M U2 M' U M' U M2 U2 M2 U M' U2 M U2 M2 U "
	});
	// Green-Yellow
	validateUserSolution({
		scramble: "R2 B' L U D' L' D2' B' B2 U U2' F' D2' B2' U F2 R2 F2 B2' D' F2 D2' R2",
		original_solution:
			"U' R' U2 F2 R' S2 U' B2' D R S' B' R' B F' U' L U L' U' S' F F' U2 B U S' U F' L' F U F' L' B' L' B L' B' L2' B L B L B' U' B L B' L' B' U B2 L' B' S3' L S L2 S' L S L' S L2 S L' S2 L S2",
		orientation: 'y ',
		fb: "x  B' U' B2 L2 U' M2 B' R2 F ",
		ss: "U M' R' U' R r' U' B U B' ",
		lp: "U' M' r r' U2 R U M' U r' U' r U r' ",
		cmll: "U' R' U' R U' R' U2 R U R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "M U M U2 M' U M U' M U2 M U' M2 U M2 "
	});
	// Green-White
	validateUserSolution({
		scramble: "U' D' R D' B D' B' U U2' F' B2' L F2 B2' L F2 R L D2' B2' U2 F2",
		original_solution:
			"U' L2 B2 D S D2 S2 B L D' B D S' D2 R B F' R2 S2 R' B R F' U' B2 U' B' U' S2 U' B U2 F' L U B L B' L' U' L2 B L B' U' B L B' L' B' U B2 L' B' S' L' B F' D S S' D2 S' D' S' D2 S2 D2 S'",
		orientation: "x2 y' ",
		fb: "  D' F2 R2 U M U2 M2 R F U' R U M' U2 B ",
		ss: "R r' U2 M2 U' R U r' U' R2 U' R' ",
		lp: "U' M2 U' R U2 r' ",
		cmll: "U F R U R' U' F' U2 R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "M' U' R r' U M M' U2 M' U' M' U2 M2 U2 M' "
	});
	// Red-Yellow
	validateUserSolution({
		scramble: "B' U' D B' D2' F2 R R2' F' D U2 F R2 B R2 B2' D2' F2 U2 B D2'",
		original_solution:
			"F2 D U2' R' U R2 B L2' B M U' B' R2 F' M L F' R' D' L R' B' M B U B U' B D L' D' L B L B' L' D B' L' L B D' L B L' D' L B L' B' L' D L2 B' L' B L B L' D' L B L' B' L' D L2 B' L' B L R' U M L R' F2 M' F M' L R' D M' D2 M' D2 M' L R' B'",
		orientation: 'y2 ',
		fb: "x  D2 F B2 L' B L2 U R2 U M' B' ",
		ss: "U' r2 U' M' R U' r' ",
		lp: "U' R r' U' M' U B U B' ",
		cmll: "U F R' F' R U R U' R' F U' R' R U F' R U R' F' R U R' U' R' F R2 U' R' U R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "U R r' U M' R r' U2 M U M R r' U M U2 M U2 M R r' U' "
	});
	// Red-White
	validateUserSolution({
		scramble: "F B U L' L2 U U2' D' D2 B2' R B' D' B2' D R2 D' R2 F2 L2' B2' D2'",
		original_solution:
			"U F D B2' L B M U' B M L' D B R' U' R' F' M R U R' F2 M2 F2 R' D' R U L F L' F' L F L' F' U' F M F2 M' F2 L R' D M' D' L R' B2 M B' M' B2 M2 B2 M' B'",
		orientation: 'x2 y2 ',
		fb: "x'  B D F U2 R U M' B' U M' R' F ",
		ss: "U r' U' r' U' M' r U r' ",
		lp: "U2 M2 U2 r' U' r ",
		cmll: "F R U R' U' R U R' U' F' ",
		lse: "U M' U2 M U2 R r' U M U' R r' U2 M' U' M U2 M2 U2 M U' "
	});
	// Blue-Red
	validateUserSolution({
		scramble: "U2 L2 U2 F' R2 B' L' B' L D' L2' U L2' D2' R2 F2 U2 F2 R2 R2' L2' D",
		original_solution:
			"B2' L2 B' L2 R' F R F2 S R2 B F' R' U2 F U F2 U' F' F B' R2' F' R' S2' R' B U' B' R' S2' R' B U B' R' B F U F' U F U2 F' U F U F' L' F U F' U' F' L F2 U' F' U S U2 S' U2 S' U S U' S U2 S U S2 U' S' U2 S' U2 S2' U2",
		orientation: "z y' ",
		fb: "x'  L2 F2 L' F2 B' R B R2 M' B2 L R' B' ",
		ss: "U2 R U R2 U' R' ",
		lp: "R r' U2 R' U' M2 U' r U' r' U' M2 U' r U r' U' r ",
		cmll: "R U R' U R U2 R' U R U R' F' R U R' U' R' F R2 U' R' ",
		lse: "U M' U2 M U2 M U M' U' M' U2 M' U M2 U' M U2 M U2 M2 U2 "
	});
});
