<Content id="main-content">
	<p>{scramble}</p>
</Content>

<script lang="ts">
  import { Content, } from '@smui/card';
  import { connectSmartRobot } from "cubing/bluetooth";
  import { randomScrambleForEvent } from "cubing/scramble";
  import "cubing/twisty";
  import { onMount } from 'svelte';
	import { TwistyPlayer } from "cubing/twisty";

  let robot;
  let scramble;

  onMount(async () => {
		scramble = await randomScrambleForEvent("333");

		let contentElem = document.querySelector("#main-content");
		const twistyPlayer: TwistyPlayer = new TwistyPlayer();
		twistyPlayer.background = "none";
		twistyPlayer.visualization = "PG3D";
		twistyPlayer.controlPanel = "none";
		twistyPlayer.backView = "top-right";
		twistyPlayer.hintFacelets = "none";
		contentElem.appendChild(twistyPlayer);
	});
</script>


