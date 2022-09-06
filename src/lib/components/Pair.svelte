<script>
	import { pair, listKnownDevices } from '$lib/bluetooth/pair';
	import Button from '@smui/button';
</script>

<Button on:click={pair} variant="raised">Pair</Button>
<Button on:click={listKnownDevices} variant="raised">List</Button>
