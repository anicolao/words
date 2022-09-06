<script>
	import { onMount } from 'svelte';
	import { pair, listKnownDevices, setupDevices } from '$lib/bluetooth/pair';
	import { bluetooth_supported, known_cubes, reconnect_supported } from './cubes';
	import { store } from '$lib/../store';

	import Button from '@smui/button';

	onMount(async () => {
		const bluetoothSupported = navigator.bluetooth !== undefined;
		const autoReconnectSupported = navigator.bluetooth.getDevices !== undefined;
		store.dispatch(bluetooth_supported(bluetoothSupported));
		store.dispatch(reconnect_supported(autoReconnectSupported));
		const devices = await listKnownDevices();
		store.dispatch(known_cubes(devices.map(d => d.name)));
		setupDevices(devices);
	});
</script>

{#if $store.cubes.autoReconnectSupported}
<p>Wake up one of these cubes to automatically reconnect:</p>
<ul>
{#each $store.cubes.knownCubes as cube}
<li>{cube}</li>
{/each}
</ul>
{/if}
<Button on:click={pair} variant="raised">Pair</Button>
