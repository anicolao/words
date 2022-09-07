<svelte:window bind:innerWidth={width}/>

{#if loading || $store.auth.signedIn === undefined}
<h2>Loading ...</h2>
<div style="display: none"><Pair/><Login/>{loading = false}</div>
{:else if !$store.auth.signedIn}
	<div class="card-display">
		<div class="card-container">
			<Card>
	{#if !$store.cubes.bluetoothSupported && !$store.cubes.overrideUsingCubes}
				<CardContent>
					<h2>Blue Roux</h2>
					<p>Make the most of your bluetooth cube as you master the Roux speedsolving method.</p>
					<p>Your web browser doesn't support bluetooth. Try using
					Google Chrome or installing the app version of blueroux.
					</p>
				</CardContent>
				<Actions fullBleed>
					<Button on:click={() => store.dispatch(override(true)) }>
						<Label>Ignore and continue</Label>
						<i class="material-icons" aria-hidden="true">arrow_forward</i>
					</Button>
				</Actions>
	{:else}
				<CardContent>
					<h2>Blue Roux</h2>
					<p>Make the most of your bluetooth cube as you master the Roux speedsolving method.</p>
					<p>Sign in with Google to proceed.</p>
				</CardContent>
				<Login/>
	{/if}
			</Card>
		</div>
	</div>
{:else}
<div class="drawer-container">
	<TopAppBar bind:this={topAppBar} variant="fixed">
		<Row>
<div class={width > 720 ? "desk-margin" : "mobile-margin"}>
			<Section>
{#if width <= 720}
				<IconButton class="material-icons" on:click={() => open = !open || width > 720}>menu</IconButton>
{:else}
				<IconButton class="material-icons" on:click={() => open = !open || width > 720}>{active}</IconButton>
{/if}
				<Title>{textLookup(active)}</Title>
			</Section>
</div>
			<Section align="end" toolbar>
				<IconButton class="material-icons" aria-label="Connect Cube" on:click={() => setActive('bluetooth')}
					>settings_bluetooth</IconButton
				>
				<span on:click={() => setActive('account_circle')}><Avatar /></span>
			</Section>
		</Row>
	</TopAppBar>

	<AutoAdjust {topAppBar}>
	</AutoAdjust>

  <Drawer variant={width>720 ? undefined : 'modal'} 
          fixed={width>720 ? undefined : false} bind:open>
    <Header>
      <Title>Blue Roux</Title>
      <Subtitle>Bluetooth training FTW</Subtitle>
    </Header>
    <Content>
      <List>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('timer')}
          activated={active === 'timer'}
        >
          <Graphic class="material-icons" aria-hidden="true">timer</Graphic>
          <Text>{textLookup('timer')}</Text>
        </Item>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('trending_down')}
          activated={active === 'trending_down'}
        >
          <Graphic class="material-icons" aria-hidden="true">trending_down</Graphic>
          <Text>{textLookup('trending_down')}</Text>
        </Item>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('school')}
          activated={active === 'school'}
        >
          <Graphic class="material-icons" aria-hidden="true">school</Graphic>
          <Text>{textLookup('school')}</Text>
        </Item>

        <Separator />
        <Subheader component={H6}>Settings</Subheader>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('account_circle')}
          activated={active === 'account_circle'}
        >
          <Graphic class="material-icons" aria-hidden="true">account_circle</Graphic>
          <Text>{textLookup('account_circle')}</Text>
        </Item>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('bluetooth')}
          activated={active === 'bluetooth'}
        >
          <Graphic class="material-icons" aria-hidden="true">bluetooth</Graphic>
          <Text>{textLookup('bluetooth')}</Text>
        </Item>
      </List>
    </Content>
  </Drawer>

	<Scrim fixed={false} />
	<AppContent class="app-content">
		<slot />
	</AppContent>
</div>
{/if}

<script lang="ts">
  import {goto} from '$app/navigation';
  /* app bar */
  import type { TopAppBarComponentDev } from '@smui/top-app-bar';
  import TopAppBar, {
    Row,
    Section,
    AutoAdjust,
    Title,
  } from '@smui/top-app-bar';
  import IconButton from '@smui/icon-button';
  import Avatar from '$lib/components/Avatar.svelte';
	import Login from '$lib/components/Login.svelte';
	import Pair from '$lib/components/Pair.svelte';
  import Card, {
    Content as CardContent,
    Actions,
  } from '@smui/card';
  import Button, { Label } from '@smui/button';
  import { store } from '$lib/store';
  import { override } from '$lib/components/cubes';

  let topAppBar: TopAppBarComponentDev;

  /* drawer */
  import Drawer, {
    AppContent,
    Content,
    Header,
    Subtitle,
    Scrim,
  } from '@smui/drawer';
  import List, { Item, Text, Graphic, Separator, Subheader } from '@smui/list';
  import { H6 } from '@smui/common/elements';
  import { navigate_to } from '$lib/components/nav';

  $: open = width > 720;
  $: active = $store.nav.active;

  function setActive(value: string) {
    store.dispatch(navigate_to(value));
    open = false || width > 720;
    goto(value);
  }

  let width;

  const i18n = {
  	unknown: "Unknown",
  	timer: "Speed Solving",
  	trending_down: "Efficient Solving",
  	school: "Roux Academy",
  	account_circle: "Profile",
  	bluetooth: "Cubes",
	};
  function textLookup(key: string) {
  	return i18n[key];
	}

	let loading = true;
</script>


<style>
  /* Hide everything above this component. */
  :global(app),
  :global(body),
  :global(html) {
    display: block !important;
    height: auto !important;
    width: auto !important;
    position: static !important;
    margin: 0;
    padding: 0;
  }


	.drawer-container {
    position: relative;
    display: flex;
    height: 100vh;
    max-width: 100vw;
    border: 1px solid
      var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.1));
    overflow: hidden;
    z-index: 0;
    flex-grow: 1;
  }

  * :global(.app-content) {
    flex: auto;
    overflow: auto;
    position: relative;
    flex-grow: 1;

  	margin-top: 64px;
  	display: flex;
  	padding: 0.5em;
  }

  .main-content {
    overflow: auto;
    padding: 16px;
    height: 100%;
    box-sizing: border-box;
  }
  .mobile-margin {
  	margin-left: 0;
	}
  .desk-margin {
  	margin-left: 256px;
	}

.card-display {
	margin: 25%;
	margin-top: 5%;
}

p {
	padding-top: 0.5em;
}

h2 {
	font-family: "Roboto", sans-serif;
	font-size: large;
}
</style>

