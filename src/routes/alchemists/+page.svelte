<script lang="ts">
	import { page } from '$app/stores';
	import { store } from '$lib/store';
	import Seal from '$lib/components/Seal.svelte';
	import Ingredient from '$lib/components/Ingredient.svelte';
	import AlchemistsBoard from '$lib/components/AlchemistsBoard.svelte';
	import Favour from '$lib/components/Favour.svelte';
	import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';
	import firebase from '$lib/firebase';
	import { custom_title } from '$lib/components/nav';
	import {
		alchemists,
		commit,
		discard_favour,
		queue_pending,
		redo_pending,
		undo_pending,
		type AlchemistsState,
		type PlayerState
	} from '$lib/components/alchemists';
	import { isPending, type AnyAction } from '@reduxjs/toolkit';
	import { dispatchToTable } from '$lib/components/gameutil';
	import Button, { Label } from '@smui/button';

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

	function previewPlayerState(storeState: AlchemistsState, email: string) {
		const pending = storeState.emailToPlayerState[email]?.pending;
		if (pending) pending.forEach((action) => (storeState = alchemists(storeState, action)));
		return storeState;
	}
	const me = $store.auth.email || '';
	$: localStore = previewPlayerState($store.alchemists, me);
	$: state = localStore?.emailToPlayerState[me];
	$: seals = state?.seals || [];
	$: favours = state?.favours || [];
	$: ingredients = state?.ingredients || [];
	$: player = state ? $store.alchemists.players.indexOf(me) : -1;
	$: numPlayers = $store.alchemists.players.length;

	let action = '';

	function describeAction(name: string, count: number) {
		const display: { [k: string]: string } = {
			discard_favour: 'Discard your starting favour.'
		};
		let suffix = '';
		if (count > 1) {
			const nTimes = ['', '', ' (Twice!)', ' (Tree times!)', ' (Four times!)'];
			suffix = nTimes[count];
		}
		return display[name] + suffix;
	}
	$: if (state) {
		if (state.required.length) {
			action = state.required[0];
			const num = state.required.filter((x) => x === action).length;
			const prompt = describeAction(action, num);
			store.dispatch(custom_title(prompt));
		} else {
			action = '';
			store.dispatch(custom_title(me));
		}
	}

	let round = 1;

	function enqueue(action: AnyAction) {
		if (tableId) {
			dispatchToTable(tableId, queue_pending({ player: me, action }));
		}
	}

	function discardFavour(index: number) {
		return () => {
			console.log('discard the ith favour: ', index);
			const action = discard_favour({ player: me, index });
			enqueue(action);
		};
	}
	function canCommit(previewState: PlayerState) {
		return previewState && previewState.required.length === 0 && previewState.pending.length > 0;
	}
	function canUndo(previewState: PlayerState) {
		return previewState && previewState.pending.length > 0;
	}
	function canRedo(previewState: PlayerState) {
		return previewState && previewState.undone.length > 0;
	}
	function commitPending() {
		if (tableId) {
			dispatchToTable(tableId, commit({ player: me }));
		}
	}
	function undoPending() {
		if (tableId) {
			dispatchToTable(tableId, undo_pending({ player: me }));
		}
	}
	function redoPending() {
		if (tableId) {
			dispatchToTable(tableId, redo_pending({ player: me }));
		}
	}
</script>

<div class="container">
	<div class="row">
		<AlchemistsBoard {round} {numPlayers} />
	</div>
	<div class="row">
		<Button disabled={!canUndo(state)} on:click={undoPending}>
			<Label>Undo</Label>
			<i class="material-icons" aria-hidden="true">undo</i>
		</Button>
		<Button disabled={!canRedo(state)} on:click={redoPending}>
			<Label>Redo</Label>
			<i class="material-icons" aria-hidden="true">redo</i>
		</Button>
		<Button disabled={!canCommit(state)} on:click={commitPending}>
			<Label>Commit</Label>
			<i class="material-icons" aria-hidden="true">arrow_forward</i>
		</Button>
	</div>
	<div class="row">
		{#each favours as favour, i}
			<Favour {favour} discard={action === 'discard_favour'} on:discard={discardFavour(i)} />
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

	:global(.mdc-drawer-app-content) {
		margin: 0 !important;
		padding: 0 !important;
		padding-top: 64px !important;
	}
</style>
