import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
export interface AuthState {
	name?: string | null;
	email?: string | null;
	photo?: string | null;
	signedIn?: boolean;
	authMessage?: string;
}

export const waiting = createAction('waiting');
export const unknown = createAction('unknown');
export const error = createAction<string>('error');
export const signed_in = createAction<AuthState>('signed_in');
export const signed_out = createAction('signed_out');

const initialAuthState = {
	name: undefined,
	email: undefined,
	photo: undefined,
	signedIn: undefined,
	authMessage: undefined
} as AuthState;

export const auth = createReducer(initialAuthState, (r) => {
	r.addCase(waiting, () => {
		return { authMessage: 'Waiting...', signedIn: false };
	})
		.addCase(unknown, () => {
			return { authMessage: 'Unknown sign in state', signedIn: false };
		})
		.addCase(error, (_state, action) => {
			return { authMessage: action.payload, signedIn: false };
		})
		.addCase(signed_in, (state, action) => {
			return { ...state, ...action.payload, signedIn: true };
		})
		.addCase(signed_out, () => {
			return { authMessage: 'Signed out.', signedIn: false };
		});
});
