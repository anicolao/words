<script>
	import { onMount } from 'svelte';
	import { pair, listKnownDevices, setupDevices } from '$lib/bluetooth/pair';
	import { bluetooth_supported, known_cubes, reconnect_supported, connect } from './cubes';
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
		store.dispatch(known_cubes(devices.map(d => [d.id, d.name, d.gatt.connected])));
		setupDevices(devices, (d) => store.dispatch(connect([d.id, d.gatt.connected])));
	});

	$: cubes = $store.cubes.knownCubes;
	$: connectedCubes = cubes.filter(x => x[2]);
	$: disconnectedCubes = cubes.filter(x => !x[2]);
</script>

{#if $store.cubes.autoReconnectSupported}

{#if connectedCubes.length}
Currently connected:
<ul>
{#each connectedCubes as cube}
<li>{cube[1]}</li>
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
<Button on:click={pair} variant="raised">Pair</Button>
