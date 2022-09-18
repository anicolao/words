module.exports = function (wallaby) {
	return {
		autoDetect: true,
		maxConsoleMessagesPerTest: 100000,
		maxTraceSteps: 4000000,
		tests: [
			'tests/**/*.unit.ts',
			{ pattern: 'tests/**/Solver.unit.ts', instrument: false, load: false, ignore: true },
			{ pattern: 'tests/**/Pruner.unit.ts', instrument: false, load: false, ignore: true }
		]
	};
};
