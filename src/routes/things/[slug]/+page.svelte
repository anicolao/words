<script lang="ts">
	import { page } from '$app/stores';
	import { initialGameDefsState } from '$lib/components/gamedefs';
	import { dispatchToTable, shuffle } from '$lib/components/gameutil';
	import { custom_title } from '$lib/components/nav';
	import type { Table } from '$lib/components/tables';
	import {
		answer_category,
		guesses,
		set_category,
		show_round,
		things,
		type ThingsState
	} from '$lib/components/things';
	import { join_game, set_current_player } from '$lib/components/words';
	import firebase from '$lib/firebase';
	import { store } from '$lib/store';
	import Button from '@smui/button';
	import {
		collection,
		onSnapshot,
		orderBy,
		query,
		setIndexConfiguration,
		type Unsubscribe
	} from 'firebase/firestore';

	const tableId = $page.params.slug;

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
	let gameId: string = '';
	let table: Table;
	let gamedef: any;
	let name = 'unknown game';
	$: if ($store.tables.tableIdToTable[tableId]) {
		gameId = $store.tables.tableIdToTable[tableId].gameid;
		table = $store.tables.tableIdToTable[tableId];
	}
	$: if (gameId && $store.gamedefs.gameIdToGame[gameId]) {
		gamedef = $store.gamedefs.gameIdToGame[gameId].properties;
	}
	$: if (gamedef) {
		name = gamedef.name;
	}
	$: console.log({ gamedef });
	let categoryString = 'type category here...';

	let gameState: ThingsState;
	$: gameState = $store.things;

	function reveal() {
		const category = set_category(categoryString);
		dispatchToTable(tableId, category);
	}
	function showRound() {
		dispatchToTable(tableId, show_round(true));
	}
	let guessString = '';
	function answer() {
		const answer = answer_category({ player: me, answer: guessString });
		dispatchToTable(tableId, answer);
	}

	$: if (gameState) {
		window.setTimeout(() => {
			if (gameState.players.indexOf(me) < 0) {
				dispatchToTable(tableId, join_game(me));
			}
		}, 1000);
	}

	function playerName(index: number) {
		const email = $store.things.players[index];
		return $store.users.emailToUser[email].name.split(' ')[0];
	}

	function eliminate(p: number, dP: number) {
		return () => {
			const player = $store.things.players[p];
			const dead_player = $store.things.players[dP];
			dispatchToTable(tableId, guesses({ player, dead_player }));
		};
	}

	function nextPlayer() {
		let next = $store.things.currentPlayerIndex + 1;
		next %= $store.things.players.length;
		while (!$store.things.alive[next]) {
			next++;
			next %= $store.things.players.length;
		}
		dispatchToTable(tableId, set_current_player(next));
	}
</script>

<div class="container">
	<p class="titlepadding" />
	<p>{name}</p>
	{#if table && me === table.owner}
		<p>You are the moderator</p>
		<p>Things ... {$store.things.currentCategory}</p>
		{#if !$store.things.showRound || $store.things.roundOver}
			<input bind:value={categoryString} />
			<Button on:click={reveal}>Reveal Category</Button>
			{#if gameState.roundReady}
				<Button on:click={showRound}>Start Round</Button>
			{/if}
		{:else}
			<table>
				{#each shuffle($store.things.players) as p}
					<tr><td>{$store.things.playerToAnswer[p]}</td></tr>
				{/each}
			</table>
			<p>The current player is {$store.things.players[$store.things.currentPlayerIndex]}</p>
			{#each $store.things.players as p, i}
				{#if $store.things.alive[i] && i !== $store.things.currentPlayerIndex}
					<Button on:click={eliminate($store.things.currentPlayerIndex, i)}
						>{playerName($store.things.currentPlayerIndex)} eliminates {playerName(i)}</Button
					>
				{/if}
			{/each}
			<Button on:click={nextPlayer}
				>{playerName($store.things.currentPlayerIndex)} guesses wrong</Button
			>
		{/if}
	{/if}
	{#if gameState && gameState.players.indexOf(me) !== -1}
		<p>You are player #{gameState.players.indexOf(me)}</p>
		<p>Things ... {gameState.currentCategory}</p>
		<p>Your current answer: <b>{$store.things.playerToAnswer[me]}</b></p>
		<input bind:value={guessString} />
		<Button on:click={answer}>Submit Answer</Button>
	{:else}
		<p>no game state</p>
	{/if}
</div>

<style>
	input {
		width: 90%;
	}
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
