import { expect } from 'chai';

import {
	initialState,
	bluetooth_supported,
	cubes,
	known_cubes,
	reconnect_supported,
	connect,
	override
} from './cubes';
import { describe, it } from 'vitest';

describe('cubes', () => {
	it('can set the list of known cubes', () => {
		const nextState = cubes(initialState, known_cubes([['id', 'GANcubename', false]]));
		expect(nextState.knownCubes.length).to.equal(1);
		expect(nextState.knownCubes[0][0]).to.equal('id');
		expect(nextState.knownCubes[0][1]).to.equal('GANcubename');
		expect(nextState.knownCubes[0][2]).to.equal(false);
	});

	it('can connect/disconnect', () => {
		let nextState = cubes(initialState, known_cubes([['id', 'GANcubename', false]]));
		expect(nextState.knownCubes.length).to.equal(1);
		expect(nextState.knownCubes[0][0]).to.equal('id');
		expect(nextState.knownCubes[0][1]).to.equal('GANcubename');
		expect(nextState.knownCubes[0][2]).to.equal(false);
		nextState = cubes(nextState, connect(['id', true]));
		expect(nextState.knownCubes[0][2]).to.equal(true);
		nextState = cubes(nextState, connect(['id', false]));
		expect(nextState.knownCubes[0][2]).to.equal(false);
	});

	it('can set/unset bluetoothSupported', () => {
		let nextState = cubes(initialState, bluetooth_supported(true));
		expect(nextState.bluetoothSupported).to.be.true;
		nextState = cubes(nextState, bluetooth_supported(false));
		expect(nextState.bluetoothSupported).to.be.false;
	});

	it('can set/unset reconnectSupported', () => {
		let nextState = cubes(initialState, reconnect_supported(true));
		expect(nextState.autoReconnectSupported).to.be.true;
		nextState = cubes(nextState, reconnect_supported(false));
		expect(nextState.autoReconnectSupported).to.be.false;
	});

	it('can set/unset overrideUsingCubes', () => {
		let nextState = cubes(initialState, override(true));
		expect(nextState.overrideUsingCubes).to.be.true;
		nextState = cubes(nextState, override(false));
		expect(nextState.overrideUsingCubes).to.be.false;
	});
});
