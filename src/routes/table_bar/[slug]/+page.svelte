<script lang="ts">
	import { page } from '$app/stores';
	import Board from '$lib/components/Board.svelte';
	import { custom_title } from '$lib/components/nav';
	import firebase from '$lib/firebase';
	import { store } from '$lib/store';
	import Button, { Label } from '@smui/button';
	import IconButton from '@smui/icon-button';
	import { Item, Text } from '@smui/list';
	import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';

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
	$: if (gamedef) {
		letterm = gamedef.letterm;
		wordm = gamedef.wordm;
		tiles = gamedef.tiles;
		values = gamedef.values;
	}
	$: console.log({ gamedef });
	$: boardState = $store.words;

	$: currentPlayer = $store.words.players[$store.words.currentPlayerIndex];
	$: if (currentPlayer) {
		const name = $store.users.emailToUser[currentPlayer].name.split(' ');
		store.dispatch(custom_title(`${name[0]}'s turn`));
	}
</script>

<div class="container">
	<p class="titlepadding" />
	<Board bind:rack {tableId} {tiles} {values} {letterm} {wordm} {boardState} />
</div>

<style>
	.container {
		width: 100%;
		height: 80%;
	}
	.titlepadding {
		height: 1px;
	}
</style>
