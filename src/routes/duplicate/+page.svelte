<script lang="ts">
	import { page } from '$app/stores';
	import DuplicateBoard from '$lib/components/DuplicateBoard.svelte';
	import { custom_title } from '$lib/components/nav';
	import { complete_table } from '$lib/components/tables';
	import type { duplicate, TurnRecord } from '$lib/components/duplicate';
	import firebase from '$lib/firebase';
	import { store } from '$lib/store';
	import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '@smui/button';

	const tableId = $page.url.searchParams.get('slug') || undefined;

	let unsub: Unsubscribe | undefined;
	let subbedTableId = '';
	$: if ($store.auth.signedIn) {
		if ($store.auth.uid && (!unsub || subbedTableId !== tableId)) {
			if (unsub) {
				console.log('unsubscribe from old table: ', { subbedTableId });
				unsub();
			}
			if (tableId) {
				subbedTableId = tableId;
				console.log('subscribe to new table: ', { subbedTableId });
				const gameActions = collection(firebase.firestore, 'tables', tableId, 'actions');
				unsub = onSnapshot(
					query(gameActions, orderBy('timestamp')),
					{ includeMetadataChanges: true },
					(querySnapshot) => {
						querySnapshot.docChanges().forEach((change) => {
							if (change.type === 'added' || (change.type === 'modified' && change.doc)) {
								let doc = change.doc;
								let action = doc.data() as any;
								if (action.timestamp) {
									delete action.timestamp;
									store.dispatch(action);
								}
							}
						});
					},
					(error) => {
						console.log('actions query failing: ');
						console.error(error);
					}
				);
			}
		}
	}

	const me = $store.auth.email || '';
	let rack = '';
	let gameId: string = '';
	let gamedef: any;
	$: if (tableId && $store.tables.tableIdToTable[tableId]) {
		gameId = $store.tables.tableIdToTable[tableId].gameid;
	}
	$: if (gameId && $store.gamedefs.gameIdToGame[gameId]) {
		gamedef = $store.gamedefs.gameIdToGame[gameId].properties;
	}
	let letterm: string;
	let wordm: string;
	let tiles: string;
	let values: string;
	let numRows: number;
	let numCols: number;
	$: if (gamedef) {
		letterm = gamedef.letterm;
		wordm = gamedef.wordm;
		tiles = gamedef.tiles;
		values = gamedef.values;
		numRows = gamedef.numRows;
		numCols = gamedef.numCols;
	}
	$: boardState = $store.duplicate;

	type TurnRecordSummarized = TurnRecord & { totalScore: number };
	let turnRows: TurnRecordSummarized[][] = [];
	$: if (!$store.duplicate.gameOver) {
		let title = [];
		for (let i = 0; i < $store.duplicate.players.length; ++i) {
			const email = $store.duplicate.players[i];
			const name = $store.users.emailToUser[email].name.split(' ')[0];
			title.push(`${name} (${$store.duplicate.scores[i]})`);
		}
		store.dispatch(custom_title(title.join(' vs ')));
	} else {
		let winningScore = 0;
		$store.duplicate.scores.forEach((s) => (winningScore = Math.max(s, winningScore)));
		let winner: string[] = [];
		$store.duplicate.scores.forEach((s, i) => {
			if (s === winningScore) winner.push(playerName($store.duplicate.players[i]));
		});
		let title = `Game Over! ${winner} wins with ${winningScore}!`;
		store.dispatch(custom_title(title));
		if (tableId && !$store.tables.tableIdToTable[tableId].completed) {
			firebase.dispatch(complete_table({ tableid: tableId }));
		}
	}
	$: if ($store.duplicate.plays.length) {
		turnRows = $store.duplicate.plays.map(x => []);
		let totals: number[] = $store.duplicate.players.map(x => 0);
		for (let i = 0; i < $store.duplicate.plays.length; ++i) {
			for (let p = 0; p < $store.duplicate.players.length; ++p) {
				const lastPlay = $store.duplicate.emailToPlays[$store.duplicate.players[p]][i];
				totals[p] += lastPlay.score;
				const data = { ...lastPlay, totalScore: totals[lastPlay.playerIndex] };
				turnRows[i].push(data);
			}
		}
	}
	function lastPlayWords(lastPlay: TurnRecord) {
		return [lastPlay.mainWord, lastPlay.sideWords].flat().map((x) => x.toUpperCase());
	}
	function playerName(email: string) {
		return $store.users.emailToUser[email].name.split(' ')[0];
	}
	function lastPlayName(lastPlay: TurnRecord) {
		const email = $store.duplicate.players[lastPlay.playerIndex];
		return playerName(email);
	}

</script>

<div class="container">
	<p class="titlepadding" />
	<DuplicateBoard
		bind:rack
		{tableId}
		{numRows}
		{numCols}
		{tiles}
		{values}
		{letterm}
		{wordm}
		{boardState}
	/>
	<table border={1} cellspacing="0" style="margin-top: 90px">
		{#each turnRows as turn, i}
			{#if i === 0}
				<tr
					><td>Turn #</td>
					{#each turn as play}
						<td>{lastPlayName(play)}</td><td>Points</td><td>Total</td>
					{/each}
				</tr>
			{/if}
			<tr
				><td>{i + 1}</td>
				{#each turn as play}<td class={'good'}>{lastPlayWords(play)}</td><td class={'good'}
						>{play.score}</td
					><td>{play.totalScore}</td>{/each}
			</tr>
		{/each}
		{#if $store.duplicate.gameOver}
			<tr
				><td />{#each boardState.finalScoreAdjustment as a, i}<td>Game Over</td><td>{a}</td><td
						>{boardState.scores[i]}</td
					>{/each}
			</tr>
		{/if}
	</table>
</div>

<style>
	td {
		padding: 0.3em;
		text-align: center;
	}
	.container {
		width: 100%;
		height: 80%;
	}
	.titlepadding {
		height: 1px;
	}
</style>
