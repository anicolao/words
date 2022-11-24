<script lang="ts">
	export let potion = -1;
	export let selected = false;
</script>

{#if potion === -1}
	<img alt="potion back" src="ingd_back_s.jpg" />
{:else}
	<img class:glow={selected} alt="potion {potion}" src="potion{potion}.png" />
{/if}

<style>
	img {
		width: 100%;
		border-radius: 5px;
	}
	.glow {
		box-shadow: rgba(0, 255, 0, 0.4) 0px 0px 0px 2px, rgba(0, 255, 0, 0.65) 0px 4px 6px -1px,
			rgba(255, 255, 255, 0.08) 0px 1px 0px inset;
		box-shadow: rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, rgba(6, 255, 4, 0.65) 0px 0px 4px 4px,
			rgba(0, 255, 0, 0.08) 0px 1px 0px inset;
	}
</style>
