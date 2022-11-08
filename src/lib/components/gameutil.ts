import firebase from '$lib/firebase';
import type { AnyAction } from '@reduxjs/toolkit';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function dispatchToTable(tableid: string, action: AnyAction) {
	const gameActions = collection(firebase.firestore, 'tables', tableid, 'actions');
	addDoc(gameActions, { ...action, timestamp: serverTimestamp() }).catch((message) => {
		console.error(message);
	});
}

export function shuffle<T>(elements: T[]) {
	const ret = elements.slice(0);
	for (let i = ret.length - 1; i > 0; --i) {
		const item = Math.round(Math.random() * i);
		[ret[i], ret[item]] = [ret[item], ret[i]];
	}
	return ret;
}
