<script lang="ts">
	export let level = -1;
	export let artifact = -1;
</script>

{#if artifact === -1}
	<img alt="artifact back" src="artifact_back_{level - 1}.jpg" />
{:else}
	<img alt="artifact level {level} number {artifact}" src="artifact_{level}_{artifact}.jpg" />
{/if}

<style>
	img {
		width: 100%;
		border-radius: 5px;
		--width: 80px;
		--margin: 4px;
		box-shadow: 4px;
		box-shadow: rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, rgba(6, 24, 44, 0.65) 0px 4px 6px -1px,
			rgba(255, 255, 255, 0.08) 0px 1px 0px inset;
	}
</style>
