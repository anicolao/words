<script lang="ts">
	import {getContext} from 'svelte';
	import Login from '$lib/components/Login.svelte';
	import Pair from '$lib/components/Pair.svelte';
  import Card, {
    Content,
    Actions,
  } from '@smui/card';
  import Button, { Label } from '@smui/button';
  import { store } from '$lib/store';
  import { override } from '$lib/components/cubes';

  import { writable } from 'svelte/store';
  const loading = writable(true);

  let width;
</script>

<svelte:window bind:innerWidth={width}/>

{#if $loading || $store.auth.signedIn === undefined}
<h2>Loading ...</h2>
<div style="display: none"><Pair/><Login/>{loading.update(tf => false)}</div>
{:else if !$store.auth.signedIn}
	<div class="card-display">
		<div class="card-container">
			<Card>
	{#if !$store.cubes.bluetoothSupported && !$store.cubes.overrideUsingCubes}
				<Content>
					<p>Make the most of your bluetooth cube as you master the Roux speedsolving method.</p>
					<p>Your web browser doesn't support bluetooth. Try using
					Google Chrome or installing the app version of blueroux.
					</p>
				</Content>
				<Actions fullBleed>
					<Button on:click={() => store.dispatch(override(true)) }>
						<Label>Ignore and continue</Label>
						<i class="material-icons" aria-hidden="true">arrow_forward</i>
					</Button>
				</Actions>
	{:else}
				<Content>
					<p>Make the most of your bluetooth cube as you master the Roux speedsolving method.</p>
					<p>Sign in with Google to proceed.</p>
				</Content>
				<Login/>
	{/if}
			</Card>
		</div>
	</div>
{:else}
<Content>
	<Pair/>
	<Login/>
	<p>Page width is: {width}px</p>
	<p>Active page is: {$store.nav.active}</p>
</Content>
{/if}

<style>
.card-display {
	margin: 25%;
	margin-top: 5%;
}

p {
	padding-top: 0.5em;
}

h2 {
	margin: 5%;
	font-family: "Roboto", sans-serif;
	font-size: large;
}
</style>
