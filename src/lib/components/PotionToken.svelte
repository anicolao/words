<script lang="ts">
	export let potion = -1;
	export let selected = false;
</script>

{#if potion < 0}
	<img class:glow={selected} alt="mix {potion}" src="token_potion_{8 + potion}.png" />
{:else}
	<img class:glow={selected} alt="mix {potion}" src="token_potion_{potion}.png" />
{/if}

<style>
	img {
		width: 100%;
	}
	.glow {
	}
</style>
