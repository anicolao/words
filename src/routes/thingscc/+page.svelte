<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { dispatchToTable, shuffle } from '$lib/components/gameutil';
	import QRCode from '$lib/components/QRCode.svelte';
	import type { ThingsState } from '$lib/components/things';
	import { join_game } from '$lib/components/words';
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
	}
	onDestroy(() => {
		if (unsub) unsub();
		unsub = undefined;
	});

	const me = $store.auth.email || '';
	let gameId: string = '';
	let gamedef: any;
	let name = 'Loading...';
	$: if (tableId && $store.tables.tableIdToTable[tableId]) {
		gameId = $store.tables.tableIdToTable[tableId].gameid;
	}
	$: if (gameId && $store.gamedefs.gameIdToGame[gameId]) {
		gamedef = $store.gamedefs.gameIdToGame[gameId].properties;
	}
	$: if (gamedef) {
		name = gamedef.name;
	}
	$: console.log({ gamedef });

	let gameState: ThingsState;
	$: gameState = $store.things;

	$: if (gameState) {
		window.setTimeout(() => {
			if (gameState.players.indexOf(me) < 0 && tableId) {
				dispatchToTable(tableId, join_game(me));
			}
		}, 1000);
	}
	let shuffledPlayers: string[] = [];
	$: if ($store.things.showRound) {
		if (shuffledPlayers.length === 0) {
			shuffledPlayers = shuffle($store.things.players);
		} else {
			shuffledPlayers = shuffledPlayers;
		}
	} else {
		shuffledPlayers = [];
	}
	function emailToName(email: string) {
		return $store.users.emailToUser[email].name.split(' ')[0];
	}

	function isAlive(email: string) {
		const index = $store.things.players.indexOf(email);
		return $store.things.alive[index];
	}

	const baseURL = $page.url.origin;
</script>

<div class="container">
	<p class="titlepadding" />
	{#if $store.things.showRound}
		<h1>Things ... {$store.things.currentCategory}</h1>
	{:else}
		<h1>{name}</h1>
		<QRCode codeValue={baseURL} squareSize={200} />
	{/if}
	{#if $store.things.showRound}
		<div class="row">
			<div class="maincolumn">
				<table>
					{#each shuffledPlayers as p}
						<tr class={isAlive(p) ? '' : 'dead'}><td>{$store.things.playerToAnswer[p]}</td></tr>
					{/each}
				</table>
			</div>
			<div class="column">
				<table>
					{#each $store.things.players as p, i}
						<tr
							class="{$store.things.alive[i] ? 'live' : 'dead'} {i ===
							$store.things.currentPlayerIndex
								? 'current'
								: ''}"><td>{emailToName(p)}</td><td>{$store.things.scores[i]}</td></tr
						>
					{/each}
				</table>
			</div>
		</div>
	{/if}
</div>

<style>
	td {
		border: 1px solid grey;
		padding: 0.5em;
		text-align: left;
	}
	.current {
		background-color: #deffde;
	}
	.dead {
		background-color: #ffdede;
	}
	.container {
		width: 100%;
		height: 80%;
	}
	.titlepadding {
		height: 1px;
	}
	.row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		width: 100%;
	}

	.column {
		display: flex;
		flex-direction: column;
	}
	.maincolumn {
		display: flex;
		flex-direction: column;
		flex-basis: 100%;
		flex: 1;
	}
</style>
