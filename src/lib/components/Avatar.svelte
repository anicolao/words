<script lang="ts">
	import { store } from '$lib/store';
	import IconButton from '@smui/icon-button';

	export let player = $store.auth.signedIn ? $store.auth.email : '';

	let email = player || '';
	let name = '';
	let photo = '';

	$: if ($store.auth.signedIn) {
		if (email == $store.auth.email) {
			name = $store.auth.name || '';
			photo = $store.auth.photo || '';
		} else {
			name = $store.users.emailToUser[email].name;
			photo = $store.users.emailToUser[email].photo;
		}
	}
</script>

{#if $store.auth.signedIn}
	<img
		alt={name}
		src={photo}
		class:round={true}
		width="48"
		height="48"
		referrerpolicy="no-referrer"
	/>
{:else}
	<IconButton class="material-icons" aria-label="Avatar">account_circle</IconButton>
{/if}

<style>
	.round {
		border-radius: 50%;
	}
</style>
