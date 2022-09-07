import { createAction, createReducer, } from '@reduxjs/toolkit';
export interface NavState {
	active: string;
}

export const navigate_to = createAction<string>('navigate_to');

const initialState = {
	active: "login",
} as NavState;

export const nav = createReducer(initialState, (r) => {
	r.addCase(navigate_to, (state, action) => {
		state.active = action.payload;
		return state;
	})
});
