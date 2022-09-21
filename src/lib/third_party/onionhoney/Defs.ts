export enum Face {
	U = 0,
	D,
	F,
	B,
	L,
	R,
	X
}

const U = Face.U;
const D = Face.D;
const F = Face.F;
const B = Face.B;
const L = Face.L;
const R = Face.R;
export { U, D, F, B, L, R };

export enum Typ {
	C = 0,
	E,
	T
}
const C = Typ.C;
const E = Typ.E;
const T = Typ.T;
export { C, E, T };

export type CubieT = {
	co: Array<number>;
	cp: Array<number>;
	eo: Array<number>;
	ep: Array<number>;
	tp: Array<number>;
};

export type FaceletCube = Array<string>;

export type CornerCoord = [Face, Face, Face];
const corners_coord: Array<CornerCoord> = [
	[U, F, L],
	[U, L, B],
	[U, B, R],
	[U, R, F],
	[D, L, F],
	[D, B, L],
	[D, R, B],
	[D, F, R]
];

export type EdgeCoord = [Face, Face];
const edges_coord: Array<EdgeCoord> = [
	[U, F],
	[U, L],
	[U, B],
	[U, R],
	[D, F],
	[D, L],
	[D, B],
	[D, R],
	[F, L],
	[B, L],
	[B, R],
	[F, R]
];
export type CenterCoord = [Face];
const centers_coord: Array<CenterCoord> = [[U], [D], [F], [B], [L], [R]];

const cstimer_corners_coord: Array<CornerCoord> = [
	[U, R, F],
	[U, F, L],
	[U, L, B],
	[U, B, R],
	[D, F, R],
	[D, L, F],
	[D, B, L],
	[D, R, B]
];

const cstimer_edges_coord: Array<EdgeCoord> = [
	[U, R],
	[U, F],
	[U, L],
	[U, B],
	[D, R],
	[D, F],
	[D, L],
	[D, B],
	[F, R],
	[F, L],
	[B, L],
	[B, R]
];

const kcenters_coord: Array<CenterCoord> = [[U], [L], [F], [R], [B], [D]];
const kcorners_coord: Array<CornerCoord> = [
	[U, F, R],
	[U, R, B],
	[U, B, L],
	[U, L, F],
	[D, R, F],
	[D, F, L],
	[D, L, B],
	[D, B, R]
];
const kedges_coord: Array<EdgeCoord> = [
	[U, F],
	[U, R],
	[U, B],
	[U, L],
	[D, F],
	[D, R],
	[D, B],
	[D, L],
	[F, R],
	[F, L],
	[B, R],
	[B, L]
];

export {
	kcenters_coord,
	kcorners_coord,
	kedges_coord,
	corners_coord,
	edges_coord,
	centers_coord,
	cstimer_corners_coord,
	cstimer_edges_coord
};

export type FaceletMapping = [Face[], Face[]][];

export type PermChg = [number, number];
export type OriChg = number;

export type MoveT = {
	cpc: Array<PermChg>;
	coc: Array<OriChg>;
	epc: Array<PermChg>;
	eoc: Array<OriChg>;
	tpc: Array<PermChg>;
	name: string;
};

const u: MoveT = {
	cpc: [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 0]
	],
	coc: [0, 0, 0, 0],
	epc: [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 0]
	],
	eoc: [0, 0, 0, 0],
	tpc: [],
	name: 'U'
};

const f: MoveT = {
	cpc: [
		[0, 3],
		[3, 7],
		[7, 4],
		[4, 0]
	],
	coc: [1, 2, 1, 2],
	epc: [
		[0, 11],
		[11, 4],
		[4, 8],
		[8, 0]
	],
	eoc: [1, 1, 1, 1],
	tpc: [],
	name: 'F'
};

const r: MoveT = {
	cpc: [
		[3, 2],
		[2, 6],
		[6, 7],
		[7, 3]
	],
	coc: [1, 2, 1, 2],
	epc: [
		[3, 10],
		[10, 7],
		[7, 11],
		[11, 3]
	],
	eoc: [0, 0, 0, 0],
	tpc: [],
	name: 'R'
};

const l: MoveT = {
	cpc: [
		[0, 4],
		[4, 5],
		[5, 1],
		[1, 0]
	],
	coc: [2, 1, 2, 1],
	epc: [
		[1, 8],
		[8, 5],
		[5, 9],
		[9, 1]
	],
	eoc: [0, 0, 0, 0],
	tpc: [],
	name: 'L'
};

const d: MoveT = {
	cpc: [
		[4, 7],
		[7, 6],
		[6, 5],
		[5, 4]
	],
	coc: [0, 0, 0, 0],
	epc: [
		[4, 7],
		[7, 6],
		[6, 5],
		[5, 4]
	],
	eoc: [0, 0, 0, 0],
	tpc: [],
	name: 'D'
};

const b: MoveT = {
	cpc: [
		[1, 5],
		[5, 6],
		[6, 2],
		[2, 1]
	],
	coc: [2, 1, 2, 1],
	epc: [
		[2, 9],
		[9, 6],
		[6, 10],
		[10, 2]
	],
	eoc: [1, 1, 1, 1],
	tpc: [],
	name: 'B'
};

const m: MoveT = {
	cpc: [],
	coc: [],
	epc: [
		[0, 4],
		[4, 6],
		[6, 2],
		[2, 0]
	],
	eoc: [1, 1, 1, 1],
	tpc: [
		[0, 2],
		[2, 1],
		[1, 3],
		[3, 0]
	],
	name: 'M'
};

const e: MoveT = {
	cpc: [],
	coc: [],
	epc: [
		[8, 11],
		[11, 10],
		[10, 9],
		[9, 8]
	],
	eoc: [1, 1, 1, 1],
	tpc: [
		[2, 5],
		[5, 3],
		[3, 4],
		[4, 2]
	],
	name: 'E'
};

const s: MoveT = {
	cpc: [],
	coc: [],
	epc: [
		[1, 3],
		[3, 7],
		[7, 5],
		[5, 1]
	],
	eoc: [1, 1, 1, 1],
	tpc: [
		[0, 5],
		[5, 1],
		[1, 4],
		[4, 0]
	],
	name: 'S'
};

export { u, d, f, b, l, r, m, e, s };

export type StickerT = [number, number, Typ];
export type StickerExtT = [number, number, Typ, Face];
export type FaceletT = Array<StickerT>;

const u_face: FaceletT = [
	[1, 0, C],
	[2, 0, E],
	[2, 0, C],
	[1, 0, E],
	[0, 0, T],
	[3, 0, E],
	[0, 0, C],
	[0, 0, E],
	[3, 0, C]
];

const f_face: FaceletT = [
	[0, 1, C],
	[0, 1, E],
	[3, 2, C],
	[8, 0, E],
	[2, 0, T],
	[11, 0, E],
	[4, 2, C],
	[4, 1, E],
	[7, 1, C]
];

export { u_face, f_face };

// for solved back-FS, ignore CP=5 and C=(1,0)
// for solved front-FS, ignore CP=4 and C=(0,0)
const FBpairPosBackFS: [number, number, number, number][] = [
	[0, 0, 8, 1],
	[0, 1, 1, 0],
	[0, 2, 0, 1],
	// [1, 0, 9, 1],
	[1, 1, 2, 0],
	[1, 2, 1, 1],
	[2, 0, 10, 1],
	[2, 1, 3, 0],
	[2, 2, 2, 1],
	[3, 0, 11, 0],
	[3, 1, 0, 0],
	[3, 2, 3, 1],
	//[4, 0, 8, 0],
	[4, 1, 4, 0],
	// [5, 0, 9, 0], [5, 2, 6, 0],
	[6, 0, 10, 0],
	[6, 1, 6, 0],
	[6, 2, 7, 1],
	[7, 0, 11, 1],
	[7, 1, 7, 0],
	[7, 2, 4, 1]
];
// Reason for failing: sampling the solved state would crash our solver, which refuses to expand solution on solved state
const FBpairPosFrontFS: [number, number, number, number][] = [
	//[0, 0, 8, 0],
	[0, 1, 1, 1],
	[0, 2, 0, 0],
	[1, 0, 9, 1],
	[1, 1, 2, 1],
	[1, 2, 1, 0],
	[2, 0, 10, 0],
	[2, 1, 3, 1],
	[2, 2, 2, 0],
	[3, 0, 11, 1],
	[3, 1, 0, 1],
	[3, 2, 3, 0],
	//[4, 0, 8, 1], [4, 1, 4, 1],
	//[5, 0, 9, 0],
	[5, 2, 6, 0],
	[6, 0, 10, 1],
	[6, 1, 6, 1],
	[6, 2, 7, 0],
	[7, 0, 11, 0],
	[7, 1, 7, 1],
	[7, 2, 4, 0]
];

export { FBpairPosBackFS, FBpairPosFrontFS };

export type FaceletCubeT = Array<Array<Face>>;

// A Cube can be in two representations: cubieCube or faceletCube

const color_map = `\
   UUU
   UUU
   UUU
LLLFFFRRRBBB
LLLFFFRRRBBB
LLLFFFRRRBBB
   DDD
   DDD
   DDD`;

export { color_map };
