import { createAction, createReducer, } from '@reduxjs/toolkit';
export interface CubesState {
	bluetoothSupported: boolean;
	autoReconnectSupported: boolean;
	knownCubes: string[];
}

export const bluetooth_supported = createAction<boolean>('bluetooth_supported');
export const reconnect_supported = createAction<boolean>('reconnect_supported');
export const known_cubes = createAction<string[]>('known_cubes');

const initialState = {
	bluetoothSupported: false,
	autoReconnectSupported: false,
	knownCubes: [],
} as AuthState;

export const cubes = createReducer(initialState, (r) => {
	r.addCase(known_cubes, (state, action) => {
		state.knownCubes = [...action.payload];
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
});
