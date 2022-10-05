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
	<Board bind:rack {tableId} {tiles} {values} {letterm} {wordm} {boardState} />
	<p>Rack: {rack}</p>
</div>

<style>
	.container {
		width: 100%;
		height: 80%;
	}
</style>
