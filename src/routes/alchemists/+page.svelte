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
		turn_order,
		undo_pending,
		type AlchemistsState,
		type PlayerState
	} from '$lib/components/alchemists';
	import { isPending, type AnyAction } from '@reduxjs/toolkit';
	import { dispatchToTable } from '$lib/components/gameutil';
	import Button, { Label } from '@smui/button';
	import { EdgesGeometry } from 'three';

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
		const origState = storeState;
		const pending = storeState.emailToPlayerState[email]?.pending;
		console.log('ppS');
		if (pending) {
			let count = 0;
			pending.forEach((action) => {
				try {
					storeState = alchemists(storeState, action);
					count++;
				} catch (err) {
					console.log(err);
					for (let i = 0; i < storeState.emailToPlayerState[me].pending.length - count; ++i) {
						console.log('discarding pending actions');
						undoPending();
					}
					return origState;
				}
			});
		}
		console.log('ppS end');
		return storeState;
	}
	const me = $store.auth.email || '';
	$: previewStore = previewPlayerState($store.alchemists, me);
	$: state = previewStore?.emailToPlayerState[me];
	$: seals = state?.seals || [];
	$: favours = state?.favours || [];
	$: ingredients = state?.ingredients || [];
	$: player = state ? $store.alchemists.players.indexOf(me) : -1;
	$: numPlayers = $store.alchemists.players.length;

	let action = '';

	function describeAction(name: string, count: number) {
		const display: { [k: string]: string } = {
			discard_favour: 'Discard your starting favour.',
			turn_order: 'Choose your place in turn order.',
			place_cube: 'Place an action cube.'
		};
		let suffix = '';
		if (count > 1) {
			const nTimes = [
				'',
				'',
				' (Twice!)',
				' (Three times!)',
				' (Four times!)',
				'(Five times!)',
				'(Six times!)'
			];
			suffix = nTimes[count];
		}
		return display[name] + suffix;
	}
	$: if (state) {
		if (state.required.length) {
			action = state.required[0];
			const num = state.required.filter((x) => x === action).length;
			const prompt = describeAction(action, num);
			if (prompt !== 'undefined') store.dispatch(custom_title(prompt));
			else store.dispatch(custom_title(action));
		} else if (!canCommit(state)) {
			const waitingOn = $store.alchemists.players[$store.alchemists.currentPlayerIndex];
			store.dispatch(custom_title('Waiting on ' + waitingOn));
		} else {
			action = '';
			store.dispatch(custom_title('Commit or undo your actions.'));
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
	function conflict() {
		if (
			$store.alchemists.emailToPlayerState[me].pending.filter((x) => x.type === 'turn_order')
				.length > 0
		) {
			return $store.alchemists.currentPlayerIndex !== player;
		}
		return false;
	}
	function canCommit(previewState: PlayerState) {
		return (
			previewState &&
			previewState.required.length === 0 &&
			previewState.pending.length > 0 &&
			!conflict()
		);
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
	function clickBoard(e: CustomEvent) {
		console.log(e.detail);
		if (action === 'turn_order' && e?.detail.startsWith('turn')) {
			enqueue(turn_order({ player: me, order: e.detail }));
		}
	}
</script>

<div class="container">
	<div class="row">
		<AlchemistsBoard {previewStore} {numPlayers} on:cube={clickBoard} />
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
			<span class="card larger">
				<Favour {favour} discard={action === 'discard_favour'} on:discard={discardFavour(i)} />
			</span>
		{/each}
	</div>
	<div class="row">
		{#each ingredients as ingredient}
			<span class="card">
				<Ingredient {ingredient} />
			</span>
		{/each}
	</div>
	<div class="row">
		{#each seals as seal}
			<Seal {player} {seal} />
		{/each}
	</div>
</div>

<style>
	.card {
		width: 80px;
		margin: 4px;
	}
	.larger {
		width: 120px;
	}
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
