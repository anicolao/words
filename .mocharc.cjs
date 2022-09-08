'use strict';

module.exports = {
	extension: ['ts'],
	loader: 'ts-node/esm',
	spec: ['src/**/*.unit.ts'],
	require: 'ts-node/register'
}
