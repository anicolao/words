import type { Min2PhaseSolver } from './min2phase-solver';

import * as _AsyncWorker from './min2phase.worker';
import type { CubieCube } from '../CubeLib';
export const AsyncWorker = _AsyncWorker;

// TODO: Support multiple workers?
export class OffThreadMin2Phase implements Min2PhaseSolver {
	private asyncWorker: typeof AsyncWorker | undefined;

	private worker(): typeof AsyncWorker {
		if (!this.asyncWorker) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.asyncWorker = (AsyncWorker as any)();
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.asyncWorker!;
	}

	async initialize(): Promise<void> {
		return this.worker().initialize();
	}

	async solve(state: CubieCube): Promise<string> {
		const algJSON = await this.worker().solve(state);
		return algJSON;
	}
}
