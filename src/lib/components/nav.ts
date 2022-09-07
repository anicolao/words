import * as toolkitRaw from '@reduxjs/toolkit';
const { createAction, createReducer, } = ((toolkitRaw as any).default ?? toolkitRaw) as typeof toolkitRaw;
export interface NavState {
	active: string;
}

export const navigate_to = createAction<string>('navigate_to');

const initialState = {
	active: "unknown",
} as NavState;

export const nav = createReducer(initialState, (r) => {
	r.addCase(navigate_to, (state, action) => {
		state.active = action.payload || "bluetooth";
		return state;
	})
});
