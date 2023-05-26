<script lang="ts">
	export let map: string = "swiss";
</script>

<img alt="{map} map" src="{map}_map.jpg" />

<style>
	img {
		width: 100%;
		border-radius: 5px;
		margin: 4px;
		box-shadow: 4px;
		box-shadow: rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, rgba(6, 24, 44, 0.65) 0px 4px 6px -1px,
			rgba(255, 255, 255, 0.08) 0px 1px 0px inset;
	}
</style>
