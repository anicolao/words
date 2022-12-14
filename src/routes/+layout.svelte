<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	/* app bar */
	import type { TopAppBarComponentDev } from '@smui/top-app-bar';
	import TopAppBar, { Row, Section, AutoAdjust, Title } from '@smui/top-app-bar';
	import IconButton from '@smui/icon-button';
	import Avatar from '$lib/components/Avatar.svelte';
	import Login from '$lib/components/Login.svelte';
	import Card, { Content as CardContent } from '@smui/card';
	import { store } from '$lib/store';

	let topAppBar: TopAppBarComponentDev;

	/* drawer */
	import Drawer, { AppContent, Content, Header, Subtitle, Scrim } from '@smui/drawer';
	import List, { Item, Text, Graphic, Separator, Subheader } from '@smui/list';
	import { H6 } from '@smui/common/elements';
	import { navigate_to } from '$lib/components/nav';
	import {
		collection,
		collectionGroup,
		onSnapshot,
		orderBy,
		query,
		where,
		type Unsubscribe
	} from 'firebase/firestore';
	import firebase from '$lib/firebase';
	import type { AnyAction } from '@reduxjs/toolkit';
	import { create_user, type User } from '$lib/components/users';
	import { define_game } from '$lib/components/gamedefs';

	const suppressHeaders = $page.url.pathname.slice(-3) === 'cc/';
	$: open = width > 720;
	$: active = $store.nav.active.split('/')[0];

	function setActive(value: string) {
		store.dispatch(navigate_to(value));
		open = false || width > 720;
		goto('/' + value);
	}

	let width = 0;

	// Icon reference: https://fonts.google.com/icons?icon.query=table_bar&icon.set=Material+Icons
	const i18n: { [key: string]: string } = {
		unknown: 'Unknown',
		account_circle: 'Profile',
		table_bar: 'Tables'
	};
	function textLookup(key: string) {
		return i18n[key];
	}

	let loading = true;

	let unsubRequests: Unsubscribe | undefined;
	$: if ($store.auth.signedIn) {
		if ($store.auth.uid && !unsubRequests) {
			const actions = collectionGroup(firebase.firestore, 'requests');
			unsubRequests = onSnapshot(
				query(actions, where('target', '==', $store.auth.uid), orderBy('timestamp')),
				(querySnapshot) => {
					querySnapshot.docChanges().forEach((change) => {
						if (change.type === 'added') {
							let doc = change.doc;
							let action = doc.data() as AnyAction;
							delete action.timestamp;
							store.dispatch(action);
						}
					});
				},
				(error) => {
					console.log('requests query failing: ');
					console.error(error);
				}
			);
		}
	}

	let unsubActions: Unsubscribe | undefined;
	$: if ($store.auth.signedIn) {
		if ($store.auth.uid && !unsubActions) {
			const actions = collection(firebase.firestore, 'actions');
			unsubActions = onSnapshot(
				query(actions, orderBy('timestamp')),
				(querySnapshot) => {
					querySnapshot.docChanges().forEach((change) => {
						if (change.type === 'added') {
							let doc = change.doc;
							let action = doc.data() as AnyAction;
							if (action.type) {
								delete action.timestamp;
								store.dispatch(action);
							} else {
								console.error('INVALID ACTION: ', action);
							}
						}
					});
				},
				(error) => {
					console.log('actions query failing: ');
					console.error(error);
				}
			);
		}
	}

	let unsubUsers: Unsubscribe | undefined;
	$: if ($store.auth.signedIn) {
		if ($store.auth.uid && !unsubUsers) {
			const users = collection(firebase.firestore, 'users');
			unsubUsers = onSnapshot(
				query(users),
				(querySnapshot) => {
					querySnapshot.docChanges().forEach((change) => {
						if (change.type === 'added') {
							let doc = change.doc;
							let user = doc.data() as User;
							store.dispatch(create_user(user));
							//delete action.timestamp;
							//store.dispatch(action);
						}
					});
				},
				(error) => {
					console.log('actions query failing: ');
					console.error(error);
				}
			);
		}
	}

	let unsubGamedefs: Unsubscribe | undefined;
	$: if ($store.auth.signedIn) {
		if ($store.auth.uid && !unsubGamedefs) {
			const gamedefs = collection(firebase.firestore, 'gamedef');
			unsubGamedefs = onSnapshot(
				query(gamedefs),
				(querySnapshot) => {
					querySnapshot.docChanges().forEach((change) => {
						if (change.type === 'added') {
							let doc = change.doc;
							let game = doc.data() as any;
							store.dispatch(define_game({ id: change.doc.id, properties: game }));
						}
					});
				},
				(error) => {
					console.log('actions query failing: ');
					console.error(error);
				}
			);
		}
	}

	$: customTitle = $store.nav.customTitle;
</script>

<svelte:window bind:innerWidth={width} />

{#if loading || $store.auth.signedIn === undefined}
	<h2>Loading ...</h2>
	<div style="display: none"><Login />{(loading = false)}</div>
{:else if !$store.auth.signedIn}
	<div class="card-display">
		<div class="card-container">
			<Card>
				<CardContent>
					<h2>Words</h2>
					<p>Have fun playing a word game!</p>
					<p>Sign in with Google to proceed.</p>
				</CardContent>
				<Login />
			</Card>
		</div>
	</div>
{:else}
	<div class="drawer-container">
		{#if !suppressHeaders}
			<TopAppBar bind:this={topAppBar} variant="fixed">
				<Row>
					<div class={width > 720 ? 'desk-margin' : 'mobile-margin'}>
						<Section>
							{#if width <= 720}
								<IconButton class="material-icons" on:click={() => (open = !open || width > 720)}
									>menu</IconButton
								>
							{:else if !customTitle}
								<IconButton class="material-icons" on:click={() => (open = !open || width > 720)}
									>{active}</IconButton
								>
							{/if}
							{#if !customTitle}
								<Title>{textLookup(active)}</Title>
							{:else}
								<Title>{customTitle}</Title>
							{/if}
						</Section>
					</div>
					<Section align="end" toolbar>
						<span on:click={() => setActive('account_circle')}><Avatar /></span>
					</Section>
				</Row>
			</TopAppBar>

			<AutoAdjust {topAppBar} />

			<Drawer
				variant={width > 720 ? undefined : 'modal'}
				fixed={width > 720 ? undefined : false}
				bind:open
			>
				<Header>
					<Title>Words</Title>
					<Subtitle>Word Game</Subtitle>
				</Header>
				<Content>
					<List>
						<Item
							href="javascript:void(0)"
							on:click={() => setActive('table_bar')}
							activated={active === 'table_bar'}
						>
							<Graphic class="material-icons" aria-hidden="true">table_bar</Graphic>
							<Text>{textLookup('table_bar')}</Text>
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
					</List>
				</Content>
			</Drawer>

			<Scrim fixed={false} />
			<AppContent class="app-content">
				<slot />
			</AppContent>
		{:else}
			<slot />
		{/if}
	</div>
{/if}

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
		border: 1px solid var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.1));
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
		font-family: 'Roboto', sans-serif;
		font-size: large;
	}
</style>
