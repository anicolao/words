import { CubeUtil, CubieCube, Mask, Move, MoveSeq } from './CubeLib';
import { CachedSolver } from './CachedSolver';
import { getEvaluator } from './Evaluator';

export type AnalyzerState = {
    scramble: string,
    post_scramble: string, // the part of solution leading up to the stage under analysis
    full_solution: SolutionDesc[],
    stage: string,
    orientation: string,
    pre_orientation: string,
    num_solution: number,
    show_mode: string //"foreach" | "combined"
}
export const initialState : AnalyzerState = {
    scramble: "",
    post_scramble: "",
    full_solution: [],
    stage: "fb",
    orientation: "x2y",
    pre_orientation: "",
    num_solution: 1,
    show_mode: "foreach"
}

export type SolverConfig = {
    premoves?: string[],
    num_solution: number,
    upper_limit: number,
    lower_limit?: number,
    evaluator?: string
  }
  
export type SolutionDesc = {
    solution: MoveSeq,
    premove: string,
    score: number,
    orientation?: string,
    stage: string
}
  
function is_fb_solved(cube: CubieCube, oris: MoveSeq[]) {
    for (const ori of oris) {
        const cube1 = cube.changeBasis(ori).apply(ori.inv())
        if (CubeUtil.is_solved(cube1, Mask.fb_mask)) return ori  
    }
    return null
}



export function analyze_roux_solve(cube: CubieCube, solve: MoveSeq) {
    //todo: break up half turns to detect cancellation in between stages
    const oris = get_oris("cn").map(m => new MoveSeq(m))
    const defaultSolution = {
        solution: [], premove: "", orientation: "", stage: "", score: 0
    }
    // figure out which fb gets solved first
    const stages = ["fb", "ss", "sp", "cmll", "lse"]
    const solution : SolutionDesc[] = [];
    let current_moves : Move[] = []
    let stage_idx = 0
    const getMasksForStage = (s: string) => {
        switch (s) {
            case "ss": return [Mask.ss_front_mask, Mask.ss_back_mask]
            case "sp": return [Mask.sb_mask]
            case "cmll": return [Mask.cmll_mask]
            case "lse": return [Mask.solved_mask]
            default: return [Mask.solved_mask]
        }
    }

    const moves = [ Move.all["id"], ...solve.moves]
    for (const move of moves) {
        cube = cube.apply(move)
        if (move.name !== "id") current_moves.push(move)

        if (stage_idx === 0) {
            const res = is_fb_solved(cube, oris)
            if (res !== null) {
                const orientation = res
                solution.push({ ...defaultSolution,
                    solution: new MoveSeq(current_moves),
                    orientation: orientation.moves.join(""),
                    stage: "fb"
                })
                stage_idx++
                current_moves = []
                cube = cube.changeBasis(orientation).apply(orientation.inv())
            }
        }
        else if (stage_idx !== 3) {
            const stage = stages[stage_idx]
            const masks = getMasksForStage(stage)
            if (masks.some(mask => CubeUtil.is_solved(cube, mask))) {
                solution.push({ ...defaultSolution, 
                    solution: new MoveSeq(current_moves),
                    stage
                })
                stage_idx++
                current_moves = []
            }
        } else {
            if (CubeUtil.is_cmll_solved(cube)) {
                solution.push({ ...defaultSolution, 
                    solution: new MoveSeq(current_moves),
                    stage: "cmll"
                })
                stage_idx++
                current_moves = []
            }
        }
        if (stage_idx >= stages.length) break
    }
    if (current_moves.length > 0) {
        solution.push({ ...defaultSolution, 
            solution: new MoveSeq(current_moves),
            stage: "unknown"
        })
    }
    return solution
}

function solve(solver_str: string, cube: CubieCube, config: SolverConfig) {
    const solver = CachedSolver.get(solver_str)
    const { premoves, num_solution, upper_limit } = config
    const ev = getEvaluator(config.evaluator || "sequential")
    const solver_num_solution = (num_solution < 10) ? 10 : num_solution
    const solutions = (premoves || [""]).map(pm => 
        solver.solve(cube.apply(pm), 0, upper_limit, solver_num_solution)
            .map((x: MoveSeq) => ({premove: pm, solution: x, score: ev.evaluate(x)}))
    ).flat()
    return solutions.sort( (x, y) => x.score - y.score).slice(0, num_solution) 
}

const get_oris = (ori: string, preori?: string) => {
    let oris : string[] = []
    if (ori === "x2y") {
        oris = (preori === "") ? ["", "y", "y'", "y2", "x2", "x2y", "x2y'", "x2y2"] :
        (preori === "x") ? ["x", "xy", "xy'", "xy2", "x'", "x'y", "x'y'", "x'y2"] :
        ["z", "zy", "zy'", "zy2", "z'", "z'y", "z'y'", "z'y2"]
    
    } else if (ori === "cn") {
        oris = ["", "y", "y'", "y2", "x2", "x2y", "x2y'", "x2y2",
                "x", "xy", "xy'", "xy2", "x'", "x'y", "x'y'", "x'y2",
                "z", "zy", "zy'", "zy2", "z'", "z'y", "z'y'", "z'y2"]
    }
    return oris
}
function analyze_fb(state: AnalyzerState, cube: CubieCube): SolutionDesc[] {
    const config : SolverConfig = {
        premoves: ["", "x", "x'", "x2"],
        num_solution: state.num_solution,
        upper_limit: 9
    }
    const oris = get_oris(state.orientation, state.pre_orientation)

    const solutions = oris.map(ori => solve("fb", cube.changeBasis(new MoveSeq(ori)), config).map(sol => ({
    ...sol, orientation: ori, stage: "fb"
    })).sort( (x, y) => x.score - y.score)).flat()

    return solutions
}

function analyze_ss(state: AnalyzerState, cube: CubieCube): SolutionDesc[] {
    const config : SolverConfig = {
        num_solution: state.num_solution,
        upper_limit: 15
    }
    const solutions = ["ss-front", "ss-back"].map(name => solve(name, cube, config).map(sol => ({
        ...sol, stage: name
    })).sort( (x, y) => x.score - y.score)).flat()
    return solutions
}

function analyze_sp(state: AnalyzerState, cube: CubieCube): SolutionDesc[] {
    const config : SolverConfig = {
        num_solution: state.num_solution,
        upper_limit: 10
    }
    const solutions = solve("sb", cube, config).map(sol => ({
        ...sol, stage: "sp"
    })).sort( (x, y) => x.score - y.score)

    return solutions
}

function analyze_lse(state: AnalyzerState, cube: CubieCube): SolutionDesc[] {
    const config : SolverConfig = {
        num_solution: state.num_solution,
        upper_limit: 20
    }
    const solutions = solve("lse", cube, config).map(sol => ({
        ...sol, stage: "lse"
    })).sort( (x, y) => x.score - y.score)

    return solutions
}


export function analyze(state: AnalyzerState) {
    let cube = new CubieCube().apply(state.scramble).apply(state.post_scramble)
    if (state.stage === "fb") return analyze_fb(state, cube)
    else {
        const ori = new MoveSeq((state.full_solution[0]?.orientation) || "")
        cube = cube.changeBasis(ori).apply(ori.inv())
        if (state.stage === "ss") return analyze_ss(state, cube)
        else if (state.stage === "sp") return analyze_sp(state, cube)
        else if (state.stage === "lse") return analyze_lse(state, cube)
    }
    return []
}