<script lang="ts">
	import { onMount } from 'svelte';
	import { connectSmartPuzzle } from 'cubing/bluetooth';
	import { pair, listKnownDevices, setupDevices } from '$lib/bluetooth/pair';
	import {
		bluetooth_supported,
		known_cubes,
		reconnect_supported,
		connect,
		known_md
	} from './cubes';
	import { navigate_to } from '$lib/components/nav';
	import { store } from '$lib/store';

	import Button from '@smui/button';
	import { identity } from 'svelte/internal';
	import firebase from '$lib/firebase';

	async function scan() {
		const scan = await navigator.bluetooth.requestLEScan({
			filters: [{ namePrefix: 'GAN' }, { namePrefix: 'MG' }],
			keepRepeatedDevices: true
		});
		const log = console.log;
		console.log(scan);
		navigator.bluetooth.addEventListener('advertisementreceived', (event) => {
			log('Advertisement received.');
			log('  Device Name: ' + event.device.name);
			log('  Device ID: ' + event.device.id);
			log('  RSSI: ' + event.rssi);
			log('  TX Power: ' + event.txPower);
			log('  UUIDs: ' + event.uuids);
			log({ md: event.manufacturerData });
			event.manufacturerData.forEach((vdv) => {
				const hexString = [...new Uint8Array(vdv.buffer)]
					.map((b) => {
						return b.toString(16).padStart(2, '0');
					})
					.join(' ');
				log('Manufacturer data: ', { hex: hexString, buffer: vdv.buffer });
				firebase.dispatchDoc(event.device.id, known_md({ id: event.device.id, data: hexString }));
			});
		});
	}

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
		flags = window as any;
	});

	function pairHandler() {
		pair(connectCallback);
	}
	function scanHandler() {
		scan();
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
	$: mdKnown = $store.cubes.cubeIdToMDMap;
	let flags: {scarydebug: boolean} = { scarydebug: false };

	function modifyMD(e: any) {
		console.log('Event: ', { e, id: e.target.id, value: e.target.value });
		firebase.dispatchDoc(e.target.id, known_md({ id: e.target.id, data: e.target.value }));
	}
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
{/if}
<span><Button on:click={pairHandler} variant="raised">Pair</Button></span>
<span><Button on:click={scanHandler} variant="raised">Scan</Button></span>
<span><Button on:click={legacyPairHandler} variant="raised">Pair Unsupported Cube</Button></span>

{#if flags.scarydebug}
	<ul>
		<div class="scarydebug">
			Scary Debug UI:
			{#each disconnectedCubes as cube}
				<li>
					<pre>{cube}</pre>
					<br />
					<input id={cube[0]} type="text" value={mdKnown[cube[0]]} on:change={modifyMD} />
				</li>
			{/each}
		</div>
	</ul>
{/if}

<style>
	.scarydebug {
		background-color: white;
		border: 2px dashed red;
		margin: 3em;
		padding: 1em;
	}

	span {
		margin: 0.5em;
	}
</style>
