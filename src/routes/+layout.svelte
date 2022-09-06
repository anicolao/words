<TopAppBar bind:this={topAppBar} variant="fixed">
  <Row>
    <Section>
      <IconButton class="material-icons">menu</IconButton>
      <Title>Blue Roux</Title>
    </Section>
    <Section align="end" toolbar>
      <IconButton class="material-icons" aria-label="Connect Cube"
        >settings_bluetooth</IconButton
      >
      <Avatar />
    </Section>
  </Row>
</TopAppBar>
<AutoAdjust {topAppBar}>
  <slot />
</AutoAdjust>

<script lang="ts">
  import type { TopAppBarComponentDev } from '@smui/top-app-bar';
  import TopAppBar, {
    Row,
    Section,
    Title,
    AutoAdjust,
  } from '@smui/top-app-bar';
  import IconButton from '@smui/icon-button';
  import Avatar from '$lib/components/Avatar.svelte';

  let topAppBar: TopAppBarComponentDev;
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
</style>
