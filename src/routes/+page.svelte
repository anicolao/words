<h2>Loading ...</h2>

<script>
  import { goto } from '$app/navigation';
  import { store } from '$lib/store';
  import { onMount } from 'svelte';
  onMount(() => {
  	let urlNav = window.location.pathname.substring(1);
  	if (urlNav !== $store.nav.active) {
  		goto($store.nav.active);
		}
	});
</script>
