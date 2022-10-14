<script lang="ts">
	import { page } from '$app/stores';
	import Board from '$lib/components/Board.svelte';
	import { custom_title } from '$lib/components/nav';
	import type { play, TurnRecord, words } from '$lib/components/words';
	import firebase from '$lib/firebase';
	import { store } from '$lib/store';
	import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';

	const tableId = $page.url.searchParams.get('slug');

	let unsub: Unsubscribe | undefined;
	let subbedTableId = '';
	$: if ($store.auth.signedIn) {
		if ($store.auth.uid && (!unsub || subbedTableId !== tableId)) {
			if (unsub) {
				console.log('unsubscribe from old table: ', { subbedTableId });
				unsub();
			}
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
								console.log('server side action: ', action);
								delete action.timestamp;
								store.dispatch(action);
							} else {
								console.log('Ignore local echo for consistency', action);
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

	const me = $store.auth.email || '';
	let rack;
	let gameId: string = '';
	let gamedef: any;
	$: if ($store.tables.tableIdToTable[tableId]) {
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
	$: console.log({ gamedef });
	$: boardState = $store.words;

	$: currentPlayer = $store.words.players[$store.words.currentPlayerIndex];
	type TurnRecordSummarized = TurnRecord & { totalScore: number };
	let turnRows: TurnRecordSummarized[][] = [];
	$: if (currentPlayer) {
		if (!$store.words.gameOver) {
			const playerIndex = $store.words.currentPlayerIndex;
			const name = $store.users.emailToUser[currentPlayer].name.split(' ');
			let title = `${name[0]}'s turn (${$store.words.scores[playerIndex]})   `;
			for (let i = playerIndex + 1; i < $store.words.players.length; ++i) {
				const email = $store.words.players[i];
				const name = $store.users.emailToUser[email].name.split(' ')[0];
				title += `vs ${name} (${$store.words.scores[i]})`;
			}
			for (let i = 0; i < playerIndex; ++i) {
				const email = $store.words.players[i];
				const name = $store.users.emailToUser[email].name.split(' ')[0];
				title += `vs  ${name} (${$store.words.scores[i]})`;
			}
			if ($store.words.plays.length) {
				const lastPlay = $store.words.plays.slice(-1)[0];
				const words = lastPlayWords(lastPlay);
				title += ` [Last play: ${words} for ${lastPlay.score}]`;
			}
			store.dispatch(custom_title(title));
		} else {
			let winningScore = 0;
			$store.words.scores.forEach((s) => (winningScore = Math.max(s, winningScore)));
			let winner: string[] = [];
			$store.words.scores.forEach((s, i) => {
				if (s === winningScore) winner.push(playerName($store.words.players[i]));
			});
			let title = `Game Over! ${winner} wins with ${winningScore}!`;
			store.dispatch(custom_title(title));
		}
	}
	$: if ($store.words.plays.length) {
		turnRows = [];
		let totals: number[] = [];
		for (let i = 0; i < $store.words.plays.length; ++i) {
			const lastPlay = $store.words.plays[i];
			while (totals.length < lastPlay.playerIndex + 1) totals.push(0);
			console.log({ totals, pi: lastPlay.playerIndex, ti: totals[lastPlay.playerIndex] });
			if (!lastPlay.challenged) totals[lastPlay.playerIndex] += lastPlay.score;
			const data = { ...lastPlay, totalScore: totals[lastPlay.playerIndex] };
			if (lastPlay.playerIndex === 0 || turnRows.length === 0) {
				turnRows.push([data]);
			} else {
				turnRows[turnRows.length - 1].push(data);
			}
			console.log('Turn Rows so far: ', turnRows);
		}
	}
	function lastPlayWords(lastPlay: TurnRecord) {
		return [lastPlay.mainWord, lastPlay.sideWords].flat().map((x) => x.toUpperCase());
	}
	function playerName(email: string) {
		return $store.users.emailToUser[email].name.split(' ')[0];
	}
	function lastPlayName(lastPlay: TurnRecord) {
		const email = $store.words.players[lastPlay.playerIndex];
		return playerName(email);
	}
</script>

<div class="container">
	<p class="titlepadding" />
	<Board bind:rack {tableId} {numRows} {numCols} {tiles} {values} {letterm} {wordm} {boardState} />
	<table border="1" cellspacing="0" style="margin-top: 50px">
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
				{#each turn as play}<td class={play.challenged ? 'challenged' : 'good'}
						>{lastPlayWords(play)}</td
					><td class={play.challenged ? 'challenged' : 'good'}>{play.score}</td><td
						>{play.totalScore}</td
					>{/each}
			</tr>
		{/each}
		{#if $store.words.gameOver}
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
	.challenged {
		text-decoration: line-through;
	}
</style>
