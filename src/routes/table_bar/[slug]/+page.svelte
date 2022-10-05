<script lang="ts">
	import { page } from '$app/stores';
	import Board from '$lib/components/Board.svelte';
	import firebase from '$lib/firebase';
	import { store } from '$lib/store';
	import Button, { Label } from '@smui/button';
	import IconButton from '@smui/icon-button';
	import { Item, Text } from '@smui/list';
	import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';

	const tableId = $page.params.slug;

	let unsub: Unsubscribe | undefined;
	$: if ($store.auth.signedIn) {
		if ($store.auth.uid && !unsub) {
			const gameActions = collection(firebase.firestore, 'tables', tableId, 'actions');
			unsub = onSnapshot(
				query(gameActions, orderBy('timestamp')),
				(querySnapshot) => {
					querySnapshot.docChanges().forEach((change) => {
						if (change.type === 'added') {
							let doc = change.doc;
							let action = doc.data() as any;
							console.log('Incoming game action ', action);
							if (action.timestamp) {
								console.log('Dispatched!');
								delete action.timestamp;
								store.dispatch(action);
							} else {
								console.log('Ignore local echo for consistency');
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
	$: gameId = $store.tables.tableIdToTable[tableId].gameid;
	$: gamedef = $store.gamedefs.gameIdToGame[gameId].properties;
	$: letterm = gamedef.letterm;
	$: wordm = gamedef.wordm;
	$: tiles = gamedef.tiles;
	$: values = gamedef.values;
	$: console.log({ gamedef });
	$: boardState = $store.words;
</script>

<div class="container">
	Welcome to the game at table {tableId}.
	<Board bind:rack {tiles} {values} {letterm} {wordm} {boardState} />
	<p>Rack: {rack}</p>
</div>

<style>
	.container {
		width: 100%;
		height: 80%;
	}
</style>
