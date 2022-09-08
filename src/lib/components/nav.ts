import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
export interface NavState {
	active: string;
}

export const navigate_to = createAction<string>('navigate_to');

export const initialState = {
	active: 'unknown'
} as NavState;

export const nav = createReducer(initialState, (r) => {
	r.addCase(navigate_to, (state, action) => {
		state.active = action.payload || 'bluetooth';
		return state;
	});
});
