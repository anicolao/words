import { CubeUtil, CubieCube, Mask, Move, MoveSeq } from './CubeLib';
import { CachedSolver } from './CachedSolver';
import { getEvaluator } from './Evaluator';

export type AnalyzerState = {
	scramble: string;
	post_scramble: string; // the part of solution leading up to the stage under analysis
	full_solution: SolutionDesc[];
	stage: string;
	orientation: string;
	pre_orientation: string;
	num_solution: number;
	show_mode: string; //"foreach" | "combined"
};
export const initialState: AnalyzerState = {
	scramble: '',
	post_scramble: '',
	full_solution: [],
	stage: 'fb',
	orientation: 'x2y',
	pre_orientation: '',
	num_solution: 1,
	show_mode: 'foreach'
};

export type SolverConfig = {
	premoves?: string[];
	num_solution: number;
	upper_limit: number;
	lower_limit?: number;
	evaluator?: string;
};

export type SolutionDesc = {
	solution: MoveSeq;
	rotatedSolution: MoveSeq;
	premove: string;
	score: number;
	orientation?: string;
	view?: MoveSeq;
	stage: string;
};

function is_cmll_solved(cube: CubieCube, oris: MoveSeq[]) {
	for (const prerotate of oris) {
		const cpre = cube.apply(prerotate);
		if (CubeUtil.is_cmll_solved(cpre)) return true;
	}
}
export function prerotate_solves(cube: CubieCube, mask: Mask, oris: MoveSeq[]) {
	for (const prerotate of oris) {
		const cpre = cube.apply(prerotate);
		if (CubeUtil.is_solved(cpre, mask)) return prerotate;
	}
	return undefined;
}
function is_solved(cube: CubieCube, mask: Mask, oris: MoveSeq[]) {
	return prerotate_solves(cube, mask, oris) !== undefined;
	/*
	for (const prerotate of oris) {
		const cpre = cube.apply(prerotate);
		if (CubeUtil.is_solved(cpre, mask)) return true;
	}
	return false;
	*/
}
export function is_fb_solved(cube: CubieCube, oris: MoveSeq[]) {
	for (const ori of oris) {
		const cube1 = cube.changeBasis(ori).apply(ori.inv()); //? ori
		const prerotate = prerotate_solves(cube1, Mask.fb_mask, oris);
		if (prerotate !== undefined) {
			//const allMoves = new MoveSeq([ ori.moves, prerotate.inv().moves ].flat());
			return ori;
		}
	}
	return null;
}

export function get_roux_stages(scramble: string, solution: string): SolutionDesc[] {
	const scrambledCube = new CubieCube().apply(scramble);
	return analyze_roux_solve(scrambledCube, new MoveSeq(solution));
}

export function analyze_roux_solve(cube: CubieCube, solve: MoveSeq) {
	//todo: break up half turns to detect cancellation in between stages
	const oris = get_oris('cn').map((m) => new MoveSeq(m));
	const defaultSolution = {
		solution: [],
		premove: '',
		orientation: '',
		stage: '',
		score: 0
	};
	// figure out which fb gets solved first
	const stages = ['fb', 'ss', 'sp', 'cmll', 'lse'];
	const solution: SolutionDesc[] = [];
	let current_moves: Move[] = [];
	const accumulated_rots: MoveSeq[] = [];
	let stage_idx = 0;
	const getMasksForStage = (s: string) => {
		switch (s) {
			case 'ss':
				return [Mask.ss_front_mask, Mask.ss_back_mask];
			case 'sp':
				return [Mask.sb_mask];
			case 'cmll':
				return [Mask.cmll_mask];
			case 'lse':
				return [Mask.solved_mask];
			default:
				return [Mask.solved_mask];
		}
	};

	const moves = [Move.all['id'], ...solve.moves];
	for (const move of moves) {
		cube = cube.apply(move);
		if (move.name !== 'id') current_moves.push(move);

		if (stage_idx === 0) {
			const res = is_fb_solved(cube, oris);
			if (res !== null) {
				const orientation = res;
				const cube1 = cube.changeBasis(orientation);
				const prerotate = prerotate_solves(cube1, Mask.fb_mask, oris);
				let prerotate_orientation = new MoveSeq('');
				if (prerotate !== undefined) {
					prerotate_orientation = prerotate.inv();
				}
				solution.push({
					...defaultSolution,
					solution: new MoveSeq(current_moves),
					rotatedSolution: new MoveSeq(current_moves)
						.pushBackAll(orientation)
						.pushBackAll(prerotate_orientation.inv())
						.tail(prerotate_orientation.length() + orientation.length()),
					orientation: orientation.inv().moves.join(''),
					view: prerotate_orientation,
					stage: 'fb'
				});
				stage_idx++;
				current_moves = [];
				cube = cube.changeBasis(orientation).apply(orientation.inv());
			}
		} else if (stage_idx !== 3) {
			const stage = stages[stage_idx];
			const masks = getMasksForStage(stage);
			if (masks.some((mask) => is_solved(cube, mask, oris))) {
				const { sol, rotatedSolution } = rotateSolution();
				solution.push({ ...defaultSolution, solution: sol, rotatedSolution, stage });
				stage_idx++;
				current_moves = [];
			}
		} else {
			if (is_cmll_solved(cube, oris)) {
				const { sol, rotatedSolution } = rotateSolution();
				solution.push({ ...defaultSolution, solution: sol, rotatedSolution, stage: 'cmll' });
				stage_idx++;
				current_moves = [];
			}
		}
		if (stage_idx >= stages.length) break;
	}
	if (current_moves.length > 0) {
		const sol = new MoveSeq(current_moves);
		let rot = new MoveSeq([]);
		if (solution[0].orientation) {
			rot = new MoveSeq(solution[0].orientation);
		}
		const rotatedSolution = sol.pushBackAll(rot).tail(rot.length());
		solution.push({ ...defaultSolution, solution: sol, rotatedSolution, stage: 'unknown' });
	}
	return solution;

	function rotateMoves(seq: Move[]) {
		let rotated = new MoveSeq(seq);
		for (let i = 0; i < accumulated_rots.length; ++i) {
			rotated = rotated.pushBackAll(accumulated_rots[i]).tail(accumulated_rots[i].length());
		}
		return rotated;
	}

	function preferRwide(moves: MoveSeq): MoveSeq {
		for (let i = 0; i < moves.length(); ++i) {
			if (moves.moves[i].name.slice(0, 1) === 'L') {
				const rotation = 'x' + moves.moves[i].name.slice(1);
				const rSeq = new MoveSeq(rotation);
				const wide = 'r' + moves.moves[i].name.slice(1);
				const wSeq = new MoveSeq(wide);
				const prefix = moves.moves.slice(0, i);
				const suffix = preferRwide(
					new MoveSeq(moves.moves.slice(i + 1)).pushBackAll(rSeq).tail(rSeq.length())
				);
				accumulated_rots.push(rSeq);
				return new MoveSeq([prefix, wSeq.moves, suffix.moves].flat());
			}
			if (moves.moves[i].name.slice(0, 1) === 'l') {
				const rotation = 'x' + moves.moves[i].name.slice(1);
				const rSeq = new MoveSeq(rotation);
				const unWide = 'R' + moves.moves[i].name.slice(1);
				const wSeq = new MoveSeq(unWide);
				const prefix = moves.moves.slice(0, i);
				const suffix = preferRwide(
					new MoveSeq(moves.moves.slice(i + 1)).pushBackAll(rSeq).tail(rSeq.length())
				);
				accumulated_rots.push(rSeq);
				return new MoveSeq([prefix, wSeq.moves, suffix.moves].flat());
			}
		}
		return moves;
	}
	function rotateSolution() {
		const sol = new MoveSeq(current_moves);
		let rot = new MoveSeq([]);
		if (solution[0].orientation && solution[0].view) {
			rot = new MoveSeq(solution[0].orientation);
			rot = new MoveSeq([rot.moves, solution[0].view.inv().moves].flat());
		}
		const rotOnly = sol.pushBackAll(rot).tail(rot.length());
		const rotatedSolution = preferRwide(rotateMoves(rotOnly.moves));
		return { sol, rotatedSolution };
	}
}

export function solve(solver_str: string, cube: CubieCube, config: SolverConfig) {
	const solver = CachedSolver.get(solver_str);
	const { premoves, num_solution, upper_limit } = config;
	const ev = getEvaluator(config.evaluator || 'sequential');
	const solver_num_solution = num_solution < 10 ? 10 : num_solution;
	const solutions = (premoves || [''])
		.map((pm) =>
			solver
				.solve(cube.apply(pm), 0, upper_limit, solver_num_solution)
				.map((x: MoveSeq) => ({ premove: pm, solution: x, score: ev.evaluate(x) }))
		)
		.flat();
	const ret = solutions.sort((x, y) => x.score - y.score).slice(0, num_solution);
	//console.log({solver_str, config, v, soln: ret[0].solution.toString()})
	return ret;
}

export const get_oris = (ori: string, preori?: string) => {
	let oris: string[] = [];
	if (ori === 'x2y') {
		oris =
			preori === ''
				? ['', 'y', "y'", 'y2', 'x2', 'x2y', "x2y'", 'x2y2']
				: preori === 'x'
				? ['x', 'xy', "xy'", 'xy2', "x'", "x'y", "x'y'", "x'y2"]
				: ['z', 'zy', "zy'", 'zy2', "z'", "z'y", "z'y'", "z'y2"];
	} else if (ori === 'cn') {
		oris = [
			'',
			'y',
			"y'",
			'y2',
			'x2',
			'x2y',
			"x2y'",
			'x2y2',
			'x',
			'xy',
			"xy'",
			'xy2',
			"x'",
			"x'y",
			"x'y'",
			"x'y2",
			'z',
			'zy',
			"zy'",
			'zy2',
			"z'",
			"z'y",
			"z'y'",
			"z'y2"
		];
	} else {
		oris = [ori];
	}
	return oris;
};
function analyze_fb(state: AnalyzerState, cube: CubieCube): SolutionDesc[] {
	const config: SolverConfig = {
		premoves: ['', 'x', "x'", 'x2'],
		num_solution: state.num_solution,
		upper_limit: 9
	};
	const oris = get_oris(state.orientation, state.pre_orientation);

	const solutions = oris
		.map((ori) =>
			solve('fb', cube.changeBasis(new MoveSeq(ori)), config)
				.map((sol) => ({
					...sol,
					rotatedSolution: sol.solution
						.pushBackAll(new MoveSeq(ori))
						.tail(new MoveSeq(ori).length()),
					orientation: ori,
					stage: 'fb'
				}))
				.sort((x, y) => x.score - y.score)
		)
		.flat();

	return solutions;
}

function analyze_ss(state: AnalyzerState, cube: CubieCube): SolutionDesc[] {
	const config: SolverConfig = {
		num_solution: state.num_solution,
		upper_limit: 15
	};
	let ori = new MoveSeq([]);
	if (state.full_solution[0].orientation) {
		ori = new MoveSeq(state.full_solution[0].orientation).inv();
	}
	const solutions = ['ss-front', 'ss-back']
		.map((name) =>
			solve(name, cube, config)
				.map((sol) => ({
					...sol,
					rotatedSolution: sol.solution.pushBackAll(ori).tail(ori.length()),
					stage: name
				}))
				.sort((x, y) => x.score - y.score)
		)
		.flat();
	return solutions;
}

function analyze_sp(state: AnalyzerState, cube: CubieCube): SolutionDesc[] {
	const config: SolverConfig = {
		num_solution: state.num_solution,
		upper_limit: 10
	};
	const ori = new MoveSeq(state.full_solution[0]?.orientation || '').inv();
	const solutions = solve('sb', cube, config)
		.map((sol) => ({
			...sol,
			rotatedSolution: sol.solution.pushBackAll(ori).tail(ori.length()),
			stage: 'sp'
		}))
		.sort((x, y) => x.score - y.score);

	return solutions;
}

function analyze_lse(state: AnalyzerState, cube: CubieCube): SolutionDesc[] {
	const config: SolverConfig = {
		num_solution: state.num_solution,
		upper_limit: 20
	};
	const ori = new MoveSeq(state.full_solution[0]?.orientation || '').inv();
	const solutions = solve('lse', cube, config)
		.map((sol) => ({
			...sol,
			rotatedSolution: sol.solution.pushBackAll(ori).tail(ori.length()),
			stage: 'lse'
		}))
		.sort((x, y) => x.score - y.score);

	return solutions;
}

export function analyze(state: AnalyzerState) {
	let cube = new CubieCube().apply(state.scramble).apply(state.post_scramble);
	if (state.stage === 'fb') return analyze_fb(state, cube);
	else {
		const ori = new MoveSeq(state.full_solution[0]?.orientation || '');
		cube = cube.changeBasis(ori).apply(ori.inv());
		if (state.stage === 'ss') return analyze_ss(state, cube);
		else if (state.stage === 'sp') return analyze_sp(state, cube);
		else if (state.stage === 'lse') return analyze_lse(state, cube);
	}
	return [];
}
