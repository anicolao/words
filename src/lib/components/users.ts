import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
// Upper case letter is blank.
export interface UsersState {
	userEmails: string[];
	emailToUser: { [k: string]: User };
}

export interface User {
	name: string;
	email: string;
	photo: string;
}

export const create_user = createAction<User>('create_user');

export const initialUsersState = {
	userEmails: [],
	emailToUser: {}
} as UsersState;

export const users = createReducer(initialUsersState, (r) => {
	r.addCase(create_user, (state, { payload }) => {
		state.userEmails.push(payload.email);
		state.emailToUser[payload.email] = payload;
	});
});
