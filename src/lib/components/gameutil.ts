import firebase from '$lib/firebase';
import type { AnyAction } from '@reduxjs/toolkit';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function dispatchToTable(tableid: string, action: AnyAction) {
	const gameActions = collection(firebase.firestore, 'tables', tableid, 'actions');
	addDoc(gameActions, { ...action, timestamp: serverTimestamp() }).catch((message) => {
		console.error(message);
	});
}
