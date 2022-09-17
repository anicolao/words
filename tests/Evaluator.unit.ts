import { expect } from 'chai';
import { describe, it } from 'vitest';

import { DPEvaluator } from "$lib/third_party/onionhoney/Evaluator";
import { MoveSeq } from "$lib/third_party/onionhoney/CubeLib";
it('evalutes basic regripless case right', () => {
    const dp_ev = new DPEvaluator()
    console.log(dp_ev.evaluate_with_plan(new MoveSeq("R U R' U'")))
    console.log(dp_ev.evaluate_with_plan(new MoveSeq("R' U R")))
    console.log(dp_ev.evaluate_with_plan(new MoveSeq("R2 D' R U2 R' D R U2 R")))
    console.log(dp_ev.evaluate_with_plan(new MoveSeq("U F R U R' U' F'")))
    console.log(dp_ev.evaluate_with_plan(new MoveSeq("R' F R U F U' R U R' U' F'")))
    console.log(dp_ev.evaluate_with_plan(new MoveSeq("R U R U R U")))
})