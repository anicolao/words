/* eslint-disable @typescript-eslint/ban-types */
import { CubieCube, Move, MoveSeq } from './CubeLib';
import { arrayEqual } from './Math';

import { type PrunerT, fbdrPrunerConfig, fbssPrunerConfigs, fsPrunerConfig, sbPrunerConfig, ssPrunerConfig, ssDpPrunerConfig, fbPrunerConfig, lsePrunerConfig, type PrunerConfig, eolrPrunerConfig, lpSbPrunerConfigs } from './Pruner';

import {initialize as min2phase_init, solve as min2phase_solve} from "./min2phase/min2phase-wrapper"
//import { __DEV__ } from '../settings';
const __DEV__ = true;

import { CachedPruner } from './CachedSolver';

type SolverConfig = {
    is_solved: (cube : CubieCube) => boolean,
    moveset: Move[],
    pruners: PrunerT[],
    pruneSeenEncodings?: boolean
}

type Accumulator = {
    solutions: MoveSeq[],
    capacity: number
}

export type SolverT = {
    solve: (cube : CubieCube, l : number, r : number, c : number) => MoveSeq[],
    is_solved: (cube : CubieCube) => boolean,
    getPruners: () => PrunerT[]
}


function Solver(config: SolverConfig) : SolverT{
    const MAX_STATE_COUNT = 3000000
    const { moveset, is_solved, pruners } = config
    let state_count = 0, prune_count = 0;
    let accum : Accumulator
    let max_depth : number
    let min_depth : number

    enum SState {
        CONTINUE,
        STOP
    };

    function solve_depth(cube: CubieCube, min_depth_: number, max_depth_: number, accum_: Accumulator) {
        accum = accum_
        max_depth = max_depth_
        min_depth = min_depth_
        state_count = 0
        prune_count = 0
        search(cube, 0, [])
        return accum
    }

    const nextMoves : {[move: string] : Move[] }= Object.create({})
    function generateNextMoveTable() {
        function getAvailableMove(name : string) {
            switch (name[0]) {
                case "U": return moveset.filter(k => k.name[0] !== "U");
                case "D": return moveset.filter(k => k.name[0] !== "U" && k.name[0] !== "D");
                case "R": {
                    const base = moveset.filter(k => k.name[0] !== "R" && k.name[0] !== "r");
                    // we want to represent all Rr's as RM's. This demands M&r to always be enabled together.
                    if (name === "R") return base.filter(k => k.name !== "M'")
                    if (name === "R'") return base.filter(k => k.name !== "M")
                    if (name === "R2") return base.filter(k => k.name !== "M2")
                    return base
                }
                case "L": return moveset.filter(k => k.name[0] !== "R" && k.name[0] !== "M" && k.name[0] !== "L" && k.name[0] !== "r");
                case "r": return moveset.filter(k => k.name[0] !== "R" && k.name[0] !== "M" && k.name[0] !== "L" && k.name[0] !== "r");
                case "M": return moveset.filter(k => k.name[0] !== "R" && k.name[0] !== "M" && k.name[0] !== "L" && k.name[0] !== "r");
                case "F": return moveset.filter(k => k.name[0] !== "F");
                case "B": return moveset.filter(k => k.name[0] !== "F" && k.name[0] !== "B");

                case "E": return moveset.filter(k => k.name[0] !== "U" && k.name[0] !== "D" && k.name[0] !== "E");
                case "S": return moveset.filter(k => k.name[0] !== "F" && k.name[0] !== "B" && k.name[0] !== "S");
                default: return moveset
            }
        }
        for (const move of moveset) {
            nextMoves[move.name] = getAvailableMove(move.name)
        }
    }
    generateNextMoveTable()

    function expand(cube: CubieCube, depth: number, solution: Move[]) : SState{
        const availableMoves : Move[] = solution.length > 0 ? nextMoves[solution[solution.length - 1].name] : moveset
        let seen_encodings : Set<BigInt|number> | null = null
        const prune = config.pruneSeenEncodings
        if (prune) {
            seen_encodings = new Set()
            if (pruners.length === 1)
                seen_encodings.add(pruners[0].encode(cube))
            else  {
                const n = BigInt(pruners[0].encode(cube)) * BigInt(pruners[1].size) + BigInt(pruners[1].encode(cube))
                seen_encodings.add(n)
            }
        }
        for (const move of availableMoves) {
            const new_cube = cube.apply_one(move)
            const enc = (pruners.length === 1) ? pruners[0].encode(new_cube) :
                BigInt(pruners[0].encode(new_cube)) * BigInt(pruners[1].size) + BigInt(pruners[1].encode(new_cube))

            if (seen_encodings == null || !seen_encodings.has(enc)) {
                seen_encodings?.add(enc)
                solution.push(move)
                const st : SState = search(new_cube, depth + 1, solution)
                solution.pop()
                if (st === SState.STOP) {
                    return SState.STOP
                }
            }
        }
        return SState.CONTINUE
    }

    function try_push(solution: Move[], depth: number) {
        if (depth < min_depth) return SState.CONTINUE
        if (accum.solutions.length < accum.capacity) {
            let flag = true
            for (const sol of accum.solutions) {
                if (arrayEqual(sol.moves, solution)) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                accum.solutions.push(new MoveSeq([...solution]))
            }
        }

        if (accum.solutions.length === accum.capacity) {
            return SState.STOP
        } else {
            return SState.CONTINUE
        }
    }

    function search(cube: CubieCube, depth: number, solution: Move[]) : SState {
        state_count++;
        if (state_count > MAX_STATE_COUNT) {
            return SState.STOP
        }
        if (is_solved(cube)) {
            return try_push(solution, depth)
        } else {
            if (depth >= max_depth) return SState.CONTINUE;
            const d = Math.max(...pruners.map(p => p.query(cube)))
            if (d + depth > max_depth) {
                prune_count++;
                return SState.CONTINUE
            } else {
                return expand(cube, depth, solution)
            }
        }
    }

    function solve(cube: CubieCube, depth_l: number, depth_r: number, capacity: number) {
        let accum : Accumulator = {
            solutions: [],
            capacity
        }
        for (let i = depth_l; i <= depth_r; i++) {
            accum = solve_depth(cube, depth_l, i, accum)
            if (accum.solutions.length === accum.capacity || state_count >= MAX_STATE_COUNT) {
                break;
            }
        }
        if (__DEV__) console.log(`Number of states = ${state_count}, pruned = ${prune_count}`);
        return accum.solutions
    }

    function getPruners() {
        return pruners
    }
    return { solve, is_solved, getPruners }
};

function solverFactory(prunerConfig: PrunerConfig) {
    const pruner = CachedPruner.get(prunerConfig) //Pruner(prunerConfig)
    pruner.init()

    const is_solved = (cube: CubieCube) => pruner.query(cube) === 0;
    
    const config = {
        is_solved,
        moveset: prunerConfig.moveset.map(s => Move.all[s]),
        pruners: [pruner],
        pruneSeenEncodings: true
    }

    const solver = Solver(config)
    return solver
}

export function solverFactory2(prunerConfigs: PrunerConfig[]) {
    const pruners = prunerConfigs.map(pc => {
        return CachedPruner.get(pc)
    })
    pruners.forEach(p => p.init())
    //let solvedEncodings = prunerConfig.solved_states.map(s => prunerConfig.encode(s))
    const is_solved = (cube: CubieCube) => pruners.every(p => p.query(cube) === 0)

    const config : SolverConfig = {
        is_solved,
        moveset: prunerConfigs[0].moveset.map(s => Move.all[s]),
        pruners,
        pruneSeenEncodings: true
    }
    const solver = Solver(config)
    return solver
}

const FbSolver = () => solverFactory(fbPrunerConfig)

const FbdrSolver = () => solverFactory(fbdrPrunerConfig)

const SsSolver = (is_front: boolean) => solverFactory(ssPrunerConfig(is_front))

const SsDpSolver = (is_front: boolean) => solverFactory(ssDpPrunerConfig(is_front))

// hand-crafted encoders are much faster though...
const FbssSolver =  (is_front: boolean) => solverFactory2(fbssPrunerConfigs(is_front))

const LpsbSolver = (is_front: boolean) => solverFactory2(lpSbPrunerConfigs(is_front))
const SbSolver = () => solverFactory(sbPrunerConfig)

const FsSolver = (is_front: boolean) => solverFactory(fsPrunerConfig(is_front))

const LSESolver = () => solverFactory(lsePrunerConfig)

const EOLRSolver = (center_flag: number, barbie_mode?: string) =>
    solverFactory(eolrPrunerConfig(center_flag, barbie_mode))

const Min2PhaseSolver : () => SolverT = function() {
    // polyfill for min2phase

    min2phase_init();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function solve(cube : CubieCube, l : number, r : number, c : number) {
        console.assert(arrayEqual(cube.tp, new CubieCube().tp), "Cube center is not solved: " + cube.tp)
        const transformed_cube = cube.to_cstimer_cube()
        console.assert( transformed_cube.is_solveable(), "Cube must be solveable")
        const solution = min2phase_solve(transformed_cube);
        return [ new MoveSeq(solution).inv() ]
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function is_solved(cube: CubieCube) {
        return true
    }
    function getPruners() {
        return []
    }
    return {
        solve,
        is_solved,
        getPruners
    }
}



export { FbdrSolver, FbSolver, SbSolver, FbssSolver, FsSolver, SsSolver, SsDpSolver, Min2PhaseSolver, LSESolver, EOLRSolver, LpsbSolver }