<script lang="ts">
	import { page } from '$app/stores';
	import { store } from '$lib/store';
	import Seal from '$lib/components/Seal.svelte';
	import Ingredient from '$lib/components/Ingredient.svelte';
	import Favour from '$lib/components/Favour.svelte';
	import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';
	import firebase from '$lib/firebase';

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
	$: state = $store.alchemists.emailToPlayerState[me];
	$: seals = state?.seals || [];
	$: favours = state?.favours || [];
	$: ingredients = state?.ingredients || [];
	$: player = state ? $store.alchemists.players.indexOf(me) : -1;
</script>

<div class="container">
	<h1>Alchemists</h1>
	<div class="row">
		{me}
	</div>
	<div class="row">
		{#each favours as favour}
			<Favour {favour} />
		{/each}
	</div>
	<div class="row">
		{#each ingredients as ingredient}
			<Ingredient {ingredient} />
		{/each}
	</div>
	<div class="row">
		{#each seals as seal}
			<Seal {player} {seal} />
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
