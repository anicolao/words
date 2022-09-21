import { expect } from 'chai';
import { it } from 'vitest';

import { CubieCube, Move, MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
import { CubeUtil } from '$lib/third_party/onionhoney/CubeLib';
import { centers_coord, corners_coord, edges_coord, Face } from '$lib/third_party/onionhoney/Defs';

it('loads and prints cube state successfully', () => {
	const cubie = new CubieCube().apply('R U R');
	//let cube = FaceletCube.from_cubie(cubie)
	// console.log(FaceletCube.to_unfolded_cube_str(cube))
	cubie.apply("R'U'R'");
	// let cube = FaceletCube.from_cubie(cubie)
	//console.log(FaceletCube.to_unfolded_cube_str(cube))

	const moves = new MoveSeq("R U2 R'");
	const inv_moves = moves.inv();

	//console.log(moves, inv_moves)
	console.assert(moves.toString() === inv_moves.toString());
});

it('should find all pairs in a solved cube', () => {
	const cube = new CubieCube();
	const pairs = CubeUtil.find_pairs(cube);
	console.assert(pairs.length === 24);
	//console.log("pairs found ", pairs)
});

it('should change basis on a solved cube', () => {
	const cube = new CubieCube();
	const cube_y = cube.changeBasis(new MoveSeq('y'));

	expect(CubeUtil.is_cube_solved(cube_y)).to.equal(true);
});

it('should change basis on an unsolved cube', () => {
	const cube = new CubieCube().apply('R');
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const pp = (cube: CubieCube) =>
		cube
			._to_facelet_mapping(corners_coord, edges_coord, centers_coord)
			.map((x: Face[][]) => x.map((y: Face[]) => y?.map((z: Face) => Face[z])));
	//console.log(pp(cube))
	const cube_y = cube.changeBasis(new MoveSeq('y'));
	//console.log(pp(cube_y))

	const cube_y_u = cube_y.apply("F'");
	//console.log(cube_y)
	//console.log(cube_y_u)

	expect(CubeUtil.is_cube_solved(cube_y_u)).to.equal(true);
});

it('should parse correctly', () => {
	const moves = "  B T F' // M U2 // \n R";
	const parsed = new MoveSeq(moves).toString();
	expect(parsed).to.equal("B F' R ");

	console.log(
		new MoveSeq(`
        x y // inspection 
r' u' // 1st square 
U2 R' U2' F' // 1st block 
U' r' U' R' U M' U2' D r' U' r // 2nd square 
U2' M U2' r U' r' // 2nd block 
U2' R U2' R2' F R F' U2 R' F R F' // CMLL 
U' M U M // EO 
U' M2' U' // UL/UR 
E2' M E2' M' // EP
    `).toString()
	);
});

it('should generate apply func correctly', () => {
	const u_func = CubieCube.generate_apply_func(Move.all.U);
	let cube = new CubieCube();
	for (let i = 0; i < 4; i++) {
		cube = u_func(cube);
		expect(CubeUtil.is_cube_solved(cube)).to.equal(i === 3);
	}
	const mp_func = CubieCube.generate_apply_func(Move.all["M'"]);
	cube = new CubieCube();
	for (let i = 0; i < 4; i++) {
		cube = mp_func(cube);
		expect(CubeUtil.is_cube_solved(cube)).to.equal(i === 3);
	}
});
