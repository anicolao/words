<script lang="ts">
	import { onMount } from 'svelte';
	import { connectSmartPuzzle } from 'cubing/bluetooth';
	import { pair, listKnownDevices, setupDevices } from '$lib/bluetooth/pair';
	import { bluetooth_supported, known_cubes, reconnect_supported, connect } from './cubes';
	import { navigate_to } from '$lib/components/nav';
	import { store } from '$lib/store';

	import Button from '@smui/button';

	const connectCallback = (d: BluetoothDevice): void => {
		store.dispatch(
			known_cubes([
				...$store.cubes.knownCubes,
				[d.id, d.name || 'Unknown Device', !!d.gatt && d.gatt.connected]
			])
		);
		store.dispatch(connect([d.id, !!d.gatt && d.gatt.connected]));
	};
	onMount(async () => {
		let page = window.location.pathname.substring(1);
		store.dispatch(navigate_to(page));

		const bluetoothSupported = navigator.bluetooth !== undefined;
		const autoReconnectSupported = navigator.bluetooth.getDevices !== undefined;
		store.dispatch(bluetooth_supported(bluetoothSupported));
		if ($store.cubes.autoReconnectSupported !== true && autoReconnectSupported === true) {
			store.dispatch(reconnect_supported(autoReconnectSupported));
			const devices = await listKnownDevices();
			store.dispatch(
				known_cubes(
					devices.map((d) => [d.id, d.name || 'Unknown Device', !!d.gatt && d.gatt.connected])
				)
			);
			setupDevices(devices, connectCallback);
		}
	});

	function pairHandler() {
		pair(connectCallback);
	}

	async function legacyPairHandler() {
		const cube = await connectSmartPuzzle();
		console.log(`connected to ${cube.name()}`, cube);
		const fakeId = 'legacy_' + cube.name();
		store.dispatch(known_cubes([[fakeId, 'Legacy: ' + cube.name(), true]]));
		store.dispatch(connect([fakeId, true]));
		(globalThis as any).legacyCubes = (globalThis as any).legacyCubes || {};
		(globalThis as any).legacyCubes[fakeId] = cube;
	}

	$: cubes = $store.cubes.knownCubes;
	$: versions = $store.cubes.cubeIdToVersionMap;
	$: connectedCubes = cubes.filter((x) => x[2]);
	$: disconnectedCubes = cubes.filter((x) => !x[2]);
</script>

{#if $store.cubes.autoReconnectSupported}
	{#if connectedCubes.length}
		Currently connected:
		<ul>
			{#each connectedCubes as cube}
				<li>
					{cube[1]}
					{#if versions[cube[0]]}
						(v{versions[cube[0]]})
					{:else}
						(do a solve first to see cube version)
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#if disconnectedCubes.length}
		<p>Wake up one of these cubes to automatically reconnect:</p>
		<ul>
			{#each disconnectedCubes as cube}
				<li>{cube[1]}</li>
			{/each}
		</ul>
	{/if}
{/if}
<Button on:click={pairHandler} variant="raised">Pair GAN 356i v1</Button>
<Button on:click={legacyPairHandler} variant="raised">Pair Other Cubes</Button>
