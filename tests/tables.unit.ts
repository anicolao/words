import { expect } from 'chai';
import { describe, it } from 'vitest';

import {
	tables,
	initialTablesState,
	create_table,
	join_table,
	start_table
} from '$lib/components/tables';

describe('table creation and joining', () => {
	it('initial state', () => {
		expect(initialTablesState.tableIds.length).to.equals(0);
	});

	it('create a word game table and join it', () => {
		const crosswordTable = {
			tableid: '0xABCD0123',
			gameid: '0xDeadBeef',
			owner: 'alex@boardgamescafe.org'
		};
		const nextState = tables(initialTablesState, create_table(crosswordTable));
		expect(nextState.tableIds.length).to.be.equal(1);
		expect(nextState.tableIds[0]).to.equal(crosswordTable.tableid);
		let table = nextState.tableIdToTable[nextState.tableIds[0]];
		expect(table.gameid).to.equal(crosswordTable.gameid);
		expect(table.players.length).to.equal(1);
		expect(table.players[0]).to.equal(crosswordTable.owner);

		const joinTable = {
			tableid: crosswordTable.tableid,
			player: 'ian@boardgamescafe.org'
		};
		const secondPlayer = tables(nextState, join_table(joinTable));
		table = secondPlayer.tableIdToTable[secondPlayer.tableIds[0]];
		expect(table.players.length).to.equal(2);
		expect(table.players[0]).to.equal(crosswordTable.owner);
		expect(table.players[1]).to.equal(joinTable.player);
		expect(table.started).to.be.false;

		const started = tables(secondPlayer, start_table(joinTable));
		table = started.tableIdToTable[started.tableIds[0]];
		expect(table.players.length).to.equal(2);
		expect(table.started).to.be.true;
	});
});
