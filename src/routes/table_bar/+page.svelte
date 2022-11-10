<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		draw_favour,
		draw_ingredient,
		Favours,
		Ingredients,
		initial_setup as alch_initial_setup
	} from '$lib/components/alchemists';
	import Avatar from '$lib/components/Avatar.svelte';
	import { dispatchToTable, shuffle } from '$lib/components/gameutil';
	import {
		create_table,
		destroy_table,
		join_table,
		leave_table,
		start_table
	} from '$lib/components/tables';
	import { draw_tiles, initial_tiles, join_game } from '$lib/components/words';
	import firebase from '$lib/firebase';
	import { store } from '$lib/store';
	import Button from '@smui/button';
	import { Content } from '@smui/card';
	import IconButton from '@smui/icon-button';
	import { addDoc, collection } from 'firebase/firestore';

	$: tableIds = $store.tables.tableIds.filter((x) => !$store.tables.tableIdToTable[x].completed);

	const me = $store.auth.email || '';
	function newTable(gameid: string) {
		return async () => {
			const tableid = await addDoc(collection(firebase.firestore, 'tables'), {
				creator: $store.auth.uid
			});
			const owner = me;
			const action = create_table({ tableid: tableid.id, gameid, owner });
			console.log({ action });
			firebase.dispatch(action);
		};
	}

	function destroy(tableid: string) {
		return async () => {
			firebase.dispatch(destroy_table({ tableid }));
		};
	}
	function join(tableid: string) {
		return async () => {
			firebase.dispatch(join_table({ tableid, player: me }));
		};
	}
	function leave(tableid: string) {
		return async () => {
			firebase.dispatch(leave_table({ tableid, player: me }));
		};
	}
	function start(tableid: string) {
		return async () => {
			const table = $store.tables.tableIdToTable[tableid];
			if (table.gameid === 'ofzl7s0llmrDqf1ON3h6') {
				const players = shuffle($store.tables.tableIdToTable[tableid].players);
				const gameProps =
					$store.gamedefs.gameIdToGame[$store.tables.tableIdToTable[tableid].gameid].properties;
				const shuffledTiles = shuffle(gameProps.tiles.split(''));
				const tiles = gameProps.tiles;
				const values = gameProps.values;
				const letterm = gameProps.letterm;
				const wordm = gameProps.wordm;
				const num_cols = parseInt(gameProps.numCols);
				const num_rows = parseInt(gameProps.numRows);
				const setupActions = [];
				setupActions.push(
					initial_tiles({
						draw_pile: shuffledTiles.join(''),
						tiles,
						values,
						letterm,
						wordm,
						num_cols,
						num_rows
					})
				);
				players.forEach((player) => setupActions.push(join_game(player)));
				players.forEach((player) => setupActions.push(draw_tiles(player)));

				setupActions.forEach((action) => {
					dispatchToTable(tableid, action);
				});
			} else if (table.gameid === 'r2TizEhIPpYu5bXN6qtb') {
				const players = shuffle($store.tables.tableIdToTable[tableid].players);
				const gameType = 'base';
				let ingredientPile: Ingredients[] = [];
				let favoursPile: Favours[] = [];
				for (let i = 0; i < 5; ++i) {
					for (let ingredient = 0; ingredient < 8; ++ingredient) {
						ingredientPile.push(ingredient);
					}
				}
				const favourCount = [4, 3, 2, 3, 4, 2, 2, 2];
				for (let favour = 0; favour < 8; ++favour) {
					for (let i = 0; i < favourCount[favour]; ++i) {
						favoursPile.push(favour);
					}
				}
				ingredientPile = shuffle(ingredientPile);
				favoursPile = shuffle(favoursPile);
				let levelI = shuffle([0, 1, 2, 3, 4, 5]);
				let levelII = shuffle([0, 1, 2, 3, 4, 5]);
				let levelIII = shuffle([0, 1, 2, 3, 4, 5]);
				const setupActions: any[] = [
					alch_initial_setup({ gameType, ingredientPile, favoursPile, levelI, levelII, levelIII })
				];
				players.forEach((player) => {
					setupActions.push(join_game(player));
					setupActions.push(draw_ingredient(player));
					setupActions.push(draw_ingredient(player));
					setupActions.push(draw_favour(player));
					setupActions.push(draw_favour(player));
				});
				setupActions.forEach((action) => {
					dispatchToTable(tableid, action);
				});
			}
			const gameDef = $store.gamedefs.gameIdToGame[table.gameid];
			firebase.dispatch(start_table({ tableid }));
			goto('/' + gameDef.properties.path + '/?slug=' + tableid);
		};
	}
	function navigateTo(tableid: string) {
		return async () => {
			console.log('go to ', tableid);
			const table = $store.tables.tableIdToTable[tableid];
			const gameDef = $store.gamedefs.gameIdToGame[table.gameid];
			goto('/' + gameDef.properties.path + '/?slug=' + tableid);
		};
	}
</script>

<Content>
	<h2>Tables ({tableIds.length})</h2>
	<ul>
		{#each tableIds as table}
			<li>
				{$store.gamedefs.gameIdToGame[$store.tables.tableIdToTable[table].gameid].properties.name}:
				{#each $store.tables.tableIdToTable[table].players as player}
					<Avatar {player} />
				{/each}
				{#if $store.tables.tableIdToTable[table].started === false}
					{#if $store.tables.tableIdToTable[table].owner === me}
						<Button on:click={start(table)}>Start</Button>
						<IconButton class="material-icons" on:click={destroy(table)}>delete</IconButton>
					{:else if $store.tables.tableIdToTable[table].players.indexOf(me) === -1}
						<Button on:click={join(table)}>Join</Button>
					{:else}
						<Button on:click={leave(table)}>Leave</Button>
					{/if}
				{:else}
					<IconButton class="material-icons" on:click={navigateTo(table)}>arrow_forward</IconButton>
					{#if $store.tables.tableIdToTable[table].owner === me}
						<IconButton class="material-icons" on:click={destroy(table)}>delete</IconButton>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
	{#each $store.gamedefs.gameΙds as gameid}
		<p>
			<Button on:click={newTable(gameid)}
				>New {$store.gamedefs.gameIdToGame[gameid].properties.name} Table</Button
			>
		</p>
	{/each}
</Content>
