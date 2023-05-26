<script lang="ts">
	import { page } from '$app/stores';
	import { store } from '$lib/store';
	import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';
	import firebase from '$lib/firebase';
	import Wagon from '$lib/components/ttr/Wagon.svelte'
	import { Wagons } from '$lib/components/ttr/ttr';
	import Board from '$lib/components/ttr/Board.svelte';

	// TODO: centralize this
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
	$: state = $store.ttr.emailToPlayerState[me];
	//$: wagons = state?.wagons || [];
	$: wagons = [Wagons.blue, Wagons.tunnel];
	$: gameType = $store.ttr.gameType;
	$: player = state ? $store.ttr.players.indexOf(me) : -1;
</script>

<div class="container">
	<h1>Ticket To Ride</h1>
	<div class="row">
		{me}
	</div>
	<div class="row">
	   <Board map={gameType} />
	</div>
	<div class="row">
		{#each wagons as wagon}
			<Wagon {wagon} />
		{/each}
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	.row {
		display: flex;
		flex-direction: row;
	}
</style>
