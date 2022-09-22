import {
	get_oris,
	is_fb_solved,
	solve,
	type SolutionDesc,
	type SolverConfig
} from '$lib/third_party/onionhoney/Analyzer';
import { CubieCube, FaceletCube, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';

export function movesToString(seq: MoveSeq): string {
	return seq.moves.map((x) => x.name).join(' ');
}

export function visualize(cube: CubieCube): string {
	const faceletCube = FaceletCube.from_cubie(cube);
	return FaceletCube.to_unfolded_cube_str(faceletCube);
}

export function makeOptimizedData(scrambleString: string, rstages: SolutionDesc[]) {
	const optimized = [];
	if (rstages && rstages[0] && rstages[0].stage === 'fb') {
		console.log({
			stage: rstages[0].stage,
			orientation: rstages[0].orientation,
			solution: rstages[0].solution.moves.map((x) => x.name).join(' ')
		});

		let cube = new CubieCube().apply(scrambleString);
		console.log(scrambleString);
		let faceletCube = FaceletCube.from_cubie(cube);
		let visual = FaceletCube.to_unfolded_cube_str(faceletCube);
		console.log(visual);
		const ori = rstages[0].orientation || '';
		const config: SolverConfig = {
			premoves: ['', 'x', 'x2', "x'"],
			num_solution: 2,
			upper_limit: 9
		};
		const spin = new MoveSeq(ori);
		optimized.push(
			solve(
				'fb',
				cube.changeBasis(spin), //.changeBasis(spin).apply(spin.inv())/*.apply(spin).changeBasis(spin).apply(spin)*/
				config
			)
				.map((sol) => ({
					...sol,
					orientation: ori,
					stage: 'fb'
				}))
				.sort((x, y) => x.score - y.score)
		);
		const quicker = optimized[0][0].solution.moves.map((x) => x.name).join(' ');
		console.log({ optimized, quicker });
		//cube = cube.apply(new MoveSeq(ori));
		cube = cube.apply(optimized[0][0].premove);
		cube = cube.apply(optimized[0][0].solution.moves);
		faceletCube = FaceletCube.from_cubie(cube);
		visual = FaceletCube.to_unfolded_cube_str(faceletCube);
		console.log(visual);
	}
	for (let i = 1; rstages && i < rstages.length; ++i) {
		if (i == 3) continue; // CMLL
		let ori = rstages[0].orientation || '';
		const spin = new MoveSeq(ori);
		let cube = new CubieCube().apply(scrambleString);
		console.log(scrambleString);
		for (let pre = 0; pre < i; ++pre) {
			console.log({ pre, s: rstages[pre].solution.toString(), p: rstages[pre].premove });
			cube = cube.apply(rstages[pre].solution);
			if (pre === 0) {
				const v = visualize(cube);
				console.log(v);
				const oldOri = ori;
				const oris = get_oris('cn').map((m) => new MoveSeq(m));
				const newOri = is_fb_solved(cube, oris);
				if (newOri) {
					console.log({ oldOri, newOri: newOri.toString() });
				} else {
					console.log('ERROR: Failed to solve');
				}
			}
		}
		cube = cube.changeBasis(spin).apply(spin.inv());
		if (i === 1) {
			const v = visualize(cube);
			console.log(scrambleString);
			console.log(movesToString(rstages[0].solution));
			console.log(v);
		}
		const config: SolverConfig = {
			num_solution: 2,
			upper_limit: 15
		};
		const stageNames = i == 1 ? [ 'ss-front', 'ss-back' ] : i == 2 ? [ 'sb' ] : [ 'lse' ];
		optimized.push(
			stageNames.map(n => solve(n, cube, config)
				.map((sol) => ({
					...sol,
					stage: n
				}))
				.sort((x, y) => x.score - y.score)).flat()
		);
	}
	return optimized;
}
