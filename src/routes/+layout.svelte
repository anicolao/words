<svelte:window bind:innerWidth={width}/>

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
				<Title>{active}</Title>
			</Section>
</div>
			<Section align="end" toolbar>
				<IconButton class="material-icons" aria-label="Connect Cube"
					>settings_bluetooth</IconButton
				>
				<Avatar />
			</Section>
		</Row>
	</TopAppBar>

	<AutoAdjust {topAppBar}>
	</AutoAdjust>

  <Drawer variant={width>720 ? undefined : 'modal'} 
          fixed={width>720 ? undefined : false} bind:open>
    <Header>
      <Title>Super Mail</Title>
      <Subtitle>It's the best fake mail app drawer.</Subtitle>
    </Header>
    <Content>
      <List>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('inbox')}
          activated={active === 'inbox'}
        >
          <Graphic class="material-icons" aria-hidden="true">inbox</Graphic>
          <Text>Inbox</Text>
        </Item>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('star')}
          activated={active === 'star'}
        >
          <Graphic class="material-icons" aria-hidden="true">star</Graphic>
          <Text>Star</Text>
        </Item>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('send')}
          activated={active === 'send'}
        >
          <Graphic class="material-icons" aria-hidden="true">send</Graphic>
          <Text>Sent Mail</Text>
        </Item>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('drafts')}
          activated={active === 'drafts'}
        >
          <Graphic class="material-icons" aria-hidden="true">drafts</Graphic>
          <Text>Drafts</Text>
        </Item>

        <Separator />
        <Subheader component={H6}>Labels</Subheader>
        <Item
          href="javascript:void(0)"
          on:click={() => setActive('bookmark')}
          activated={active === 'bookmark'}
        >
          <Graphic class="material-icons" aria-hidden="true">bookmark</Graphic>
          <Text>Family</Text>
        </Item>
      </List>
    </Content>
  </Drawer>

	<Scrim fixed={false} />
	<AppContent class="app-content">
		<slot />
	</AppContent>
</div>

<script lang="ts">
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

  let topAppBar: TopAppBarComponentDev;

  /* drawer */
  import Drawer, {
    AppContent,
    Content,
    Header,
    Subtitle,
    Scrim,
  } from '@smui/drawer';
  import Button, { Label } from '@smui/button';
  import List, { Item, Text, Graphic, Separator, Subheader } from '@smui/list';
  import { H6 } from '@smui/common/elements';

  $: open = width > 720;
  let active = 'inbox';

  function setActive(value: string) {
    active = value;
    open = false || width > 720;
  }

  let width;
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

</style>

