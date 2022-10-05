import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
export interface NavState {
	active: string;
	customTitle: string;
}

export const navigate_to = createAction<string>('navigate_to');
export const custom_title = createAction<string>('custom_title');

export const initialState = {
	active: 'account_circle',
	customTitle: ''
} as NavState;

export const nav = createReducer(initialState, (r) => {
	r.addCase(navigate_to, (state, action) => {
		state.active = action.payload || 'account_circle';
		state.customTitle = '';
		return state;
	});

	r.addCase(custom_title, (state, action) => {
		state.customTitle = action.payload;
	});
});
