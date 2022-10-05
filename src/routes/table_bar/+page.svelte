<script lang="ts">
	import { goto } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import { dispatchToTable } from '$lib/components/gameutil';
	import {
		create_table,
		destroy_table,
		join_table,
		leave_table,
		start_table,
		tables
	} from '$lib/components/tables';
	import { draw_tiles, initial_tiles, join_game } from '$lib/components/words';
	import firebase from '$lib/firebase';
	import { store } from '$lib/store';
	import Button from '@smui/button';
	import { Content } from '@smui/card';
	import IconButton from '@smui/icon-button';
	import { addDoc, collection, serverTimestamp, setIndexConfiguration } from 'firebase/firestore';

	$: tableIds = $store.tables.tableIds;

	const me = $store.auth.email || '';
	async function newTable() {
		const tableid = await addDoc(collection(firebase.firestore, 'tables'), {
			creator: $store.auth.uid
		});
		const owner = me;
		const action = create_table({ tableid: tableid.id, gameid: 'ofzl7s0llmrDqf1ON3h6', owner });
		console.log({ action });
		firebase.dispatch(action);
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
	function shuffle(elements: string[]) {
		const ret = elements.slice(0);
		for (let i = ret.length - 1; i > 0; --i) {
			const item = Math.round(Math.random() * i);
			[ret[i], ret[item]] = [ret[item], ret[i]];
		}
		return ret;
	}
	function start(tableid: string) {
		return async () => {
			const players = shuffle($store.tables.tableIdToTable[tableid].players);
			const tiles = shuffle(
				$store.gamedefs.gameIdToGame[
					$store.tables.tableIdToTable[tableid].gameid
				].properties.tiles.split('')
			);
			const setupActions = [];
			setupActions.push(initial_tiles(tiles.join('')));
			players.forEach((player) => setupActions.push(join_game(player)));
			players.forEach((player) => setupActions.push(draw_tiles(player)));

			setupActions.forEach((action) => {
				dispatchToTable(tableid, action);
			});

			firebase.dispatch(start_table({ tableid }));
			goto('table_bar/' + tableid);
		};
	}
	function navigateTo(tableid: string) {
		return async () => {
			console.log('go to ', tableid);
			goto('table_bar/' + tableid);
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
				{/if}
			</li>
		{/each}
	</ul>
	<Button on:click={newTable}>New Table</Button>
</Content>
