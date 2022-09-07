<script>
	import { onMount } from 'svelte';
	import { pair, listKnownDevices, setupDevices } from '$lib/bluetooth/pair';
	import { bluetooth_supported, known_cubes, reconnect_supported } from './cubes';
  import { navigate_to } from '$lib/components/nav';
	import { store } from '$lib/store';

	import Button from '@smui/button';

	onMount(async () => {
		let page = window.location.pathname.substring(1);
		store.dispatch(navigate_to(page));

		const bluetoothSupported = navigator.bluetooth !== undefined;
		const autoReconnectSupported = navigator.bluetooth.getDevices !== undefined;
		store.dispatch(bluetooth_supported(bluetoothSupported));
		store.dispatch(reconnect_supported(autoReconnectSupported));
		const devices = await listKnownDevices();
		store.dispatch(known_cubes(devices.map(d => d.name)));
		setupDevices(devices);
	});

	$: cubes = $store.cubes.knownCubes;
</script>

{#if $store.cubes.autoReconnectSupported}
<p>Wake up one of these cubes to automatically reconnect:</p>
<ul>
{#each cubes as cube}
<li>{cube}</li>
{/each}
</ul>
{/if}
<Button on:click={pair} variant="raised">Pair</Button>
