<script lang="ts">
	export let ingredient = -1;
</script>

{#if ingredient === -1}
	<img alt="ingredient back" src="ingd_back_s.jpg" />
{:else}
	<img alt="ingredient {ingredient}" src="ingd_{ingredient}.jpg" />
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
