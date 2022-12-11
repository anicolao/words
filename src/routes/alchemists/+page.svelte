<script lang="ts">
	import { onDestroy } from 'svelte';
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
		discard_ingredient,
		draw_ingredient,
		drink_potion,
		favourToPhase,
		forage,
		MixesTable,
		pass,
		place_cube,
		play_favour,
		queue_pending,
		redo_pending,
		renounce,
		shop,
		test_potion,
		transmute,
		turn_order,
		undo_pending,
		type AlchemistsState,
		type PlayerState
	} from '$lib/components/alchemists';
	import type { AnyAction } from '@reduxjs/toolkit';
	import { dispatchToTable } from '$lib/components/gameutil';
	import Button, { Label } from '@smui/button';
	import Alchemical from '$lib/components/Alchemical.svelte';
	import Potion from '$lib/components/Potion.svelte';
	import Notebook from '$lib/components/Notebook.svelte';
	import IngredientToken from '$lib/components/IngredientToken.svelte';
	import PotionToken from '$lib/components/PotionToken.svelte';
	import ExperimentGrid from '$lib/components/ExperimentGrid.svelte';
	import Artifact from '$lib/components/Artifact.svelte';
	import Theories from '$lib/components/Theories.svelte';

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

	onDestroy(() => {
		if (unsub) unsub();
		unsub = undefined;
	});

	function previewPlayerState(storeState: AlchemistsState, email: string) {
		const origState = storeState;
		const pending = storeState.emailToPlayerState[email]?.pending;
		if (pending) {
			let count = 0;
			pending.forEach((action) => {
				try {
					storeState = alchemists(storeState, action);
					count++;
				} catch (err) {
					console.log(err);
					for (let i = 0; i < storeState.emailToPlayerState[me].pending.length - count; ++i) {
						undoPending();
					}
					return origState;
				}
			});
		}
		return storeState;
	}
	const me = $store.auth.email || '';
	$: previewStore = previewPlayerState($store.alchemists, me);
	$: cstate = $store.alchemists.emailToPlayerState[me];
	$: state = previewStore?.emailToPlayerState[me];
	$: seals = state?.seals || [];
	$: favours = state?.favours.map((x, i) => (i < cstate.favours.length ? x : -1)) || [];
	$: artifacts = state?.artifacts || [];
	$: ingredients =
		state?.ingredients.map((x, i) =>
			i < cstate.ingredients.length || currentActionKey === 'discard_ingredient' ? x : -2
		) || [];
	$: player = state ? $store.alchemists.players.indexOf(me) : -1;
	$: numPlayers = $store.alchemists.players.length;

	$: currentActionKey = state?.currentActionKey;

	function describeAction(name: string, count: number, prefix?: string) {
		const display: { [k: string]: string } = {
			discard_favour: 'discard a starting favour.',
			discard_ingredient: 'discard an ingredient.',
			play_favour: 'play immediate favours.',
			turn_order: 'choose turn order.',
			forage: 'forage for an ingredient.',
			custodian: 'drink a potion.',
			transmute: 'transmute an ingredient.',
			student: 'test on a student.',
			shop: 'buy an artifact.',
			drink: 'drink a potion.',
			commit: 'commit or undo/redo actions.',
			place_cube: 'place an action cube.',
			pass: 'end your round.'
		};
		let please = prefix || 'Please ';
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
		if (name === 'commit' && !canCommit(state)) {
			return please + "wait to check other player's choices.";
		}
		return please + display[name] + suffix;
	}
	function nextPlayerForAction() {
		const npStore = $store.alchemists;
		const cubeCount = npStore.players.map((p) => {
			let cubes = npStore.cubeActionToPlayerEmails[currentActionKey];
			if (cubes) {
				return cubes.filter((x) => x === p).length;
			} else {
				return 0;
			}
		});
		let maxCubes = 0;
		let maxCubePlayer = $store.alchemists.players[$store.alchemists.currentPlayerIndex];
		if (
			currentActionKey === 'commit' &&
			state.pending.filter((x) => x.type === 'place_cube').length > 0
		) {
			let index = $store.alchemists.currentPlayerIndex - 1;
			if (index < 0) index += $store.alchemists.players.length;
			maxCubePlayer = $store.alchemists.players[index];
		}
		for (let i = 0; i < npStore.players.length; ++i) {
			if (cubeCount[i] > maxCubes) {
				maxCubes = cubeCount[i];
				maxCubePlayer = npStore.players[i];
			}
		}
		return maxCubePlayer;
	}
	$: if (state) {
		if (currentActionKey === 'pass') {
			if (!canCommit(state)) {
				store.dispatch(custom_title('Waiting for other players.'));
			} else {
				immediate(pass({ player: me }));
			}
		} else if (state.required.length) {
			const num = state.required.filter((x) => x === currentActionKey).length;
			const prompt = describeAction(currentActionKey, num);
			if (prompt !== 'undefined') store.dispatch(custom_title(prompt));
			else store.dispatch(custom_title(currentActionKey));
		} else if (!canCommit(state)) {
			const waitingOn = nextPlayerForAction();
			store.dispatch(custom_title('Waiting on ' + waitingOn));
		} else {
			store.dispatch(custom_title('Commit or undo your actions.'));
		}
	}

	let round = 1;

	function enqueue(action: AnyAction) {
		if (tableId) {
			dispatchToTable(tableId, queue_pending({ player: me, action }));
		}
	}
	function immediate(action: AnyAction) {
		if (tableId) {
			dispatchToTable(tableId, action);
		}
	}

	function discardFavour(index: number) {
		return () => {
			const action = discard_favour({ player: me, index });
			enqueue(action);
		};
	}
	function playFavour(index: number) {
		return () => {
			enqueue(play_favour({ player: me, index }));
		};
	}
	function conflict() {
		const sequential = ['turn_order', 'place_cube', 'forage', 'pass', 'test_potion', 'shop'];
		const pending = $store.alchemists.emailToPlayerState[me].pending;
		for (let i = 0; i < sequential.length; ++i) {
			if (pending.filter((x) => x.type === sequential[i]).length > 0 || passing(state)) {
				if (nextPlayerForAction() !== me) return true;
			}
		}
		return false;
	}
	function playerPass(pstate: PlayerState) {
		return pstate.required.length >= 1 && pstate.required[0] === 'pass';
	}
	function playerTurn(pstate: PlayerState) {
		return pstate.required.length >= 1 && pstate.required[0] === 'turn_order';
	}
	function passing(previewState: PlayerState) {
		if (playerPass(previewState)) {
			if (previewStore) {
				let ret = true;
				previewStore.players.forEach((p) => {
					const s = previewStore.emailToPlayerState[p];
					ret = ret && (playerPass(s) || playerTurn(s));
				});
				return ret;
			}
		}
		return false;
	}
	function canCommit(previewState: PlayerState) {
		return (
			previewState &&
			(previewState.required.length === 0 ||
				previewState.required[0] === 'student' ||
				previewState.required[0] === 'drink' ||
				previewState.required[0] === 'commit' ||
				previewState.required[0] === 'pass') &&
			(previewState.pending.length > 0 || passing(previewState)) &&
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
		if (currentActionKey === 'turn_order' && e?.detail.startsWith('turn')) {
			enqueue(turn_order({ player: me, order: e.detail }));
		} else if (currentActionKey === 'place_cube' && e?.detail.startsWith('cube_')) {
			const actionSplit = e?.detail.split('_');
			if (actionSplit && actionSplit.length > 2) {
				const chosenCategory = actionSplit[1];
				console.log('Clicking for actions on ', chosenCategory);
				switch (chosenCategory) {
					case 'forage':
					case 'transmute':
					case 'shop':
					case 'student':
					case 'drink':
					case 'action_renounce':
						break;
					case 'debunk':
					case 'sell':
					case 'publish':
						if (previewStore.round > 1) break;
					default:
						console.log('Erroneous click on ', chosenCategory);
						return;
				}
				console.log('Successful click on ', chosenCategory);
				enqueue(place_cube({ player: me, cube: e?.detail }));
			}
		} else if (currentActionKey === 'forage' && e?.detail.startsWith('draw')) {
			immediate(draw_ingredient({ player: me }));
		} else if (currentActionKey === 'forage' && e?.detail.startsWith('forest')) {
			console.log('Draw specific ingredient...');
			const index = parseInt(e?.detail.substring(6));
			enqueue(forage({ player: me, index }));
		} else if (currentActionKey === 'shop' && e?.detail.startsWith('artifact')) {
			const index = parseInt(e?.detail.substring(8)) - 1;
			enqueue(shop({ player: me, index }));
		} else if (e?.detail.startsWith('action_renounce')) {
			enqueue(renounce({ player: me, action: currentActionKey }));
		}
	}
	let potionCards: number[] = [];
	function clickIngredient(i: number) {
		return () => {
			if (currentActionKey === 'transmute') {
				enqueue(transmute({ player: me, index: i }));
			} else if (currentActionKey === 'discard_ingredient') {
				enqueue(discard_ingredient({ player: me, index: i }));
			} else if (
				currentActionKey === 'custodian' ||
				currentActionKey === 'student' ||
				currentActionKey === 'drink'
			) {
				let found = potionCards.indexOf(i);
				if (found === -1 && potionCards.length >= 1) {
					for (let s = 0; s < potionCards.length; ++s) {
						if (state.ingredients[potionCards[s]] === state.ingredients[i]) {
							found = s;
							potionCards.push(i);
							break;
						}
					}
				}
				if (found !== -1) {
					potionCards.splice(found, 1);
					undoPending();
				} else {
					potionCards.push(i);
				}
				if (potionCards.length > 2) {
					potionCards.splice(0, 1);
					undoPending();
				}
				if (potionCards.length === 2) {
					if (currentActionKey === 'custodian' || currentActionKey === 'drink') {
						enqueue(drink_potion({ player: me, i0: potionCards[0], i1: potionCards[1] }));
					} else {
						enqueue(test_potion({ player: me, i0: potionCards[0], i1: potionCards[1] }));
					}
					potionCards = [];
				}
				potionCards = potionCards;
			}
		};
	}

	function mixIngredients(i0: number, i1: number) {
		const alchemicalA = $store.alchemists.ingredientToAlchemical[i0];
		const alchemicalB = $store.alchemists.ingredientToAlchemical[i1];
		const a0 = Math.min(alchemicalA, alchemicalB);
		const a1 = Math.max(alchemicalA, alchemicalB);
		return MixesTable[a0 * 10 + a1];
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
		{#if state}
			<p>Round: {$store.alchemists.round}</p>
			<p>Start Player: {$store.alchemists.players[0]}</p>
			<p>Coins: {state.coins}</p>
		{/if}
	</div>
	<div class="row">
		{#each favours as favour, i}
			<span class="card larger">
				<Favour
					{favour}
					glowing={favourToPhase[favour] === currentActionKey ||
						(favourToPhase[favour] === 'immediate' && currentActionKey !== 'discard_favour')}
					discard={currentActionKey === 'discard_favour'}
					on:discard={discardFavour(i)}
					on:play={playFavour(i)}
				/>
			</span>
		{/each}
	</div>
	<div class="row">
		{#each ingredients as ingredient, i}
			<span class="card" on:click={clickIngredient(i)}>
				<Ingredient {ingredient} selected={potionCards.indexOf(i) !== -1} />
			</span>
		{/each}
	</div>
	<div class="row">
		{#each artifacts as artifact, i}
			<span class="card larger">
				<Artifact level={Math.floor(artifact / 100)} artifact={artifact % 10} />
			</span>
		{/each}
	</div>
	<div class="row">
		{#each seals as seal}
			<Seal {player} {seal} />
		{/each}
	</div>
	<div class="row" style="width: 30px">
		{#each [0, 1, 2, 3, 4, 5, 6, 7] as ingredient}
			<Ingredient {ingredient} />
			<Alchemical alchemical={$store.alchemists.ingredientToAlchemical[ingredient]} />
		{/each}
	</div>
	{#if cstate && cstate.mixes !== undefined}
		<Notebook mixes={cstate.mixes} />
	{/if}
	<div class="row" style="width: 30px">
		{#each [-1, 0, 1, 2, 3, 4, 5, 6, 7] as a}
			<Alchemical alchemical={a} />
		{/each}
	</div>
	{#each [0, 1, 2, 3, 4, 5, 6, 7] as r}
		<div class="row" style="width: 30px">
			<Alchemical alchemical={r} />
			{#each [0, 1, 2, 3, 4, 5, 6, 7] as a}
				<Potion potion={MixesTable[r * 10 + a]} />
			{/each}
		</div>
	{/each}
	<div class="row" style="width: 30px">
		{#each [-1, 0, 1, 2, 3, 4, 5, 6, 7] as i}
			<IngredientToken ingredient={i} />
		{/each}
	</div>
	{#each [0, 1, 2, 3, 4, 5, 6, 7] as r}
		<div class="row" style="width: 30px">
			<IngredientToken ingredient={r} />
			{#each [0, 1, 2, 3, 4, 5, 6, 7] as a}
				<PotionToken potion={mixIngredients(r, a)} />
			{/each}
		</div>
	{/each}
	{#if cstate}
		<ExperimentGrid {tableId} mixes={cstate.mixes} />
		<Theories players={$store.alchemists.players} />
	{/if}
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
	p {
		padding: 1em;
	}

	:global(.mdc-drawer-app-content) {
		margin: 0 !important;
		padding: 0 !important;
		padding-top: 64px !important;
	}
</style>
