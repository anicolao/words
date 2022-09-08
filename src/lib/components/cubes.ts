import * as toolkitRaw from '@reduxjs/toolkit';
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
export interface CubesState {
	bluetoothSupported: boolean;
	autoReconnectSupported: boolean;
	overrideUsingCubes: boolean;
	knownCubes: [string, string, boolean][];
}

export const bluetooth_supported = createAction<boolean>('bluetooth_supported');
export const reconnect_supported = createAction<boolean>('reconnect_supported');
export const known_cubes = createAction<[string, string, boolean][]>('known_cubes');
export const connect = createAction<[string, boolean]>('connect');
export const override = createAction<boolean>('override');

const initialState = {
	bluetoothSupported: false,
	autoReconnectSupported: false,
	overrideUsingCubes: false,
	knownCubes: []
} as CubesState;

export const cubes = createReducer(initialState, (r) => {
	r.addCase(known_cubes, (state, action) => {
		state.knownCubes = [...action.payload];
		return state;
	})
		.addCase(connect, (state, action) => {
			let cubeId = action.payload[0];
			let connectedState = action.payload[1];
			let otherCubes = state.knownCubes.filter((x) => x[0] !== cubeId);
			let thisCube = state.knownCubes.filter((x) => x[0] === cubeId)[0];
			state.knownCubes = [...otherCubes, [thisCube[0], thisCube[1], connectedState]];
			return state;
		})
		.addCase(bluetooth_supported, (state, action) => {
			console.log(action);
			state.bluetoothSupported = action.payload;
			return state;
		})
		.addCase(reconnect_supported, (state, action) => {
			state.autoReconnectSupported = action.payload;
			return state;
		})
		.addCase(override, (state, action) => {
			state.overrideUsingCubes = action.payload;
			return state;
		});
});
