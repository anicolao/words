import * as toolkitRaw from '@reduxjs/toolkit';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createAction, createReducer } = ((toolkitRaw as any).default ??
	toolkitRaw) as typeof toolkitRaw;
// Upper case letter is blank.
export interface TablesState {
	tableIds: string[];
	tableIdToTable: { [k: string]: Table };
}

export interface Table {
	tableid: string;
	gameid: string;
	owner: string;
	players: string[];
	started: boolean;
}

export const create_table = createAction<{ tableid: string; gameid: string; owner: string }>(
	'create_table'
);
export const join_table = createAction<{ tableid: string; player: string }>('join_table');
export const start_table = createAction<{ tableid: string }>('start_table');

export const initialTablesState = {
	tableIds: [],
	tableIdToTable: {}
} as TablesState;

export const tables = createReducer(initialTablesState, (r) => {
	r.addCase(create_table, (state, { payload }) => {
		const table = { ...payload, players: [payload.owner], started: false };
		state.tableIdToTable[payload.tableid] = table;
		state.tableIds.push(payload.tableid);
	});

	r.addCase(join_table, (state, { payload }) => {
		const players = [...state.tableIdToTable[payload.tableid].players, payload.player];
		state.tableIdToTable[payload.tableid] = { ...state.tableIdToTable[payload.tableid], players };
		return state;
	});

	r.addCase(start_table, (state, { payload }) => {
		state.tableIdToTable[payload.tableid].started = true;
	});
});
