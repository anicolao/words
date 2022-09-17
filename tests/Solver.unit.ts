import { expect } from 'chai';
import { describe, it } from 'vitest';

import { FbdrSolver } from '$lib/third_party/onionhoney/Solver'
import { CubieCube, FaceletCube } from '$lib/third_party/onionhoney/CubeLib'
import { SeqEvaluator } from "$lib/third_party/onionhoney/Evaluator"
import { CachedSolver } from '$lib/third_party/onionhoney/CachedSolver'
import { cartesianProduct } from '$lib/third_party/onionhoney/Math'
import { corners_coord, edges_coord } from '$lib/third_party/onionhoney/Defs'

it('solves fbdr case', () => {
    //let cube = CubeUtil.get_random_fs()
    const cube = new CubieCube().apply("F")
    const solver = FbdrSolver()
    //const pruner = solver.getPruners()[0]
    //console.log("Pruner estimate = ", pruner.query(cube))

    //console.log("here")
    const solutions = solver.solve(cube, 5, 9, 2);

    console.assert(solutions.length === 2)
    console.assert(solutions[0].moves.length === 5)

    const solved_cube = cube.apply(solutions[0])

    //const fCube = FaceletCube.from_cubie(cube)

    //console.log(FaceletCube.to_unfolded_cube_str(fCube))

    console.assert(solver.is_solved(solved_cube) === true, "Cube expected to be solved but not")
    //console.log(solutions)
})

const corner_desc = (co:number, cp:number) => {
    const faces = "UDFBLR"
    const s = corners_coord[cp].map(i => faces[i]).join("")
    if (co === 0) return s;
    else return s.slice(co) + s.slice(0, co)
}
const edge_desc = (eo:number, ep:number) => {
    const faces = "UDFBLR"
    const s = edges_coord[ep].map(i => faces[i]).join("")
    if (eo === 0) return s;
    else return s.slice(eo) + s.slice(0, eo)
}

it('gens sb wrong slot', () => {
    let cube = new CubieCube();
    // front slot : corner = 7, edge = 11
    // back slot: corner = 6, edge = 10
    // fix corner
    const CORNER = 6, EDGE = 10 // back slot
    const EDGE_LOC = 11, CORNER_LOC = 7
    cube.cp[CORNER_LOC] = CORNER
    cube.cp[CORNER] = CORNER_LOC // move it out of the way
    const eps = [0, 1, 2, 3, 4, 6, 10, 11]

    const result = []
    for (let co = 0; co < 3; co++) {
        for (const ep of eps) {
            for (let eo = 0; eo < 2; eo++) {
                const cc = cube.clone()
                cc.co[CORNER_LOC] = co
                cc.ep[ep] = EDGE
                cc.ep[EDGE] = ep
                cc.eo[ep] = eo
                const sol = CachedSolver.get("ss-back").solve(cc, 1, 13, 10)
                    .map(sol => ({sol, score: new SeqEvaluator().evaluate(sol)}))
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                const sols = sol.map(s => s.sol.toString()).join(" , ")
                result.push(`${sols}, back-slot-corner-wrong, DLB=${corner_desc(co, 7)}, BR=${edge_desc(eo, ep)}`)
            }
        }
    }

    cube = new CubieCube()
    cube.ep[EDGE_LOC] = EDGE
    cube.ep[EDGE] = EDGE_LOC // move it out of the way

    const cps = [0, 1, 2, 3, 6, 7]

    for (let eo = 0; eo < 2; eo++) {
        for (const cp of cps) {
            for (let co = 0; co < 3; co++) {
                const cc = cube.clone()
                cc.eo[EDGE_LOC] = eo
                cc.cp[cp] = CORNER
                cc.cp[CORNER] = cp
                cc.co[cp] = co
                const sol = CachedSolver.get("ss-back").solve(cc, 1, 13, 10)
                    .map(sol => ({sol, score: new SeqEvaluator().evaluate(sol)}))
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                const sols = sol.map(s => s.sol.toString()).join(" , ")
                result.push(`${sols}, back-slot-edge-wrong, DLB=${corner_desc(co, cp)}, BR=${edge_desc(eo, 11)}`)
            }
        }
    }
    console.log(result.join("\n"))
    console.log("Done")
})


it('gens all ss cases', () => {

    const cube = new CubieCube();
    // front slot : corner = 7, edge = 11
    // back slot: corner = 6, edge = 10
    // fix corner
    const eps = [0, 1, 2, 3, 4, 6, 7, 10, 11]
    const cps = [0, 1, 2, 3, 6, 7]

    const perms = cartesianProduct(eps, eps, cps, [0,1], [0,1], [0,1,2]).filter(x => x[0] !== x[1])
    for (const e of eps) cube.ep[e] = -1
    for (const c of cps) cube.cp[c] = -1
    const result = []


    console.log(`Perms length = ${perms.length}`);
    for (const perm of perms) {
        const [ep1, ep2, cp1, eo1, eo2, co1] = perm;
        const [ep1_src, ep2_src, cp1_src] = [7, 11, 7] // front
        const cc = cube.clone()
        cc.ep[ep1] = ep1_src
        cc.eo[ep1] = eo1
        cc.ep[ep2] = ep2_src
        cc.eo[ep2] = eo2
        cc.cp[cp1] = cp1_src
        cc.co[cp1] = co1

        const sol = CachedSolver.get("ss-front").solve(cc, 0, 13, 3)
        sol.push(sol[0].inv())
        const sols = sol.map(s => s.toString()).join(" , ")
        const desc = `${sols}, ss-front, dr=${edge_desc(eo1, ep1)}, `+
            `fr=${edge_desc(eo2, ep2)}, dfr=${corner_desc(co1, cp1)}`
        result.push(desc)
    }

    for (const perm of perms) {
        const [ep1, ep2, cp1, eo1, eo2, co1] = perm;
        const [ep1_src, ep2_src, cp1_src] = [7, 10, 6] // front
        const cc = cube.clone()
        cc.ep[ep1] = ep1_src
        cc.eo[ep1] = eo1
        cc.ep[ep2] = ep2_src
        cc.eo[ep2] = eo2
        cc.cp[cp1] = cp1_src
        cc.co[cp1] = co1

        const sol = CachedSolver.get("ss-back").solve(cc, 0, 13, 3)
        sol.push(sol[0].inv())
        const sols = sol.map(s => s.toString()).join(" , ")
        const desc = `${sols}, ss-back, dr=${edge_desc(eo1, ep1)}, `+
            `fr=${edge_desc(eo2, ep2)}, dfr=${corner_desc(co1, cp1)}`
        result.push(desc)
    }


    console.log(result.join("\n"))
    console.log("Done")
})
