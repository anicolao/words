// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
	getFirestore,
	connectFirestoreEmulator,
	addDoc,
	collection,
	serverTimestamp,
	doc,
	setDoc
} from 'firebase/firestore';
import { store } from './store';
//import { getAnalytics } from 'firebase/analytics';
//
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyBTNg60q0X2AAEIUz5fpXPtOJfUT4cndDA",
	authDomain: "words-62ed1.firebaseapp.com",
	projectId: "words-62ed1",
	storageBucket: "words-62ed1.appspot.com",
	messagingSenderId: "1011220640118",
	appId: "1:1011220640118:web:1dc6a545756e97fd214a57",
	measurementId: "G-77PFY8JX9Y"
  };

// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

const firebase = {
	app: initializeApp(firebaseConfig),
	auth: getAuth(),
	google_auth_provider: new GoogleAuthProvider(),
	firestore: getFirestore(),
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	dispatch: (action: any) => {
		const user = store.getState().auth;
		if (user.uid) {
			firebase.request(user.uid, action);
		}
	},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	dispatchDoc: (id: string, action: any) => {
		const user = store.getState().auth;
		if (user.uid) {
			setDoc(
				doc(
					firebase.firestore,
					'from',
					user.uid,
					'to',
					user.uid,
					'requests',
					id.replaceAll('/', '_')
				),
				{
					...action,
					creator: user.uid,
					target: user.uid,
					timestamp: serverTimestamp()
				}
			).catch((message) => {
				console.error(message);
			});
		}
	},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	request: (to: string, action: any) => {
		const user = store.getState().auth;
		if (user.uid) {
			addDoc(collection(firebase.firestore, 'from', user.uid, 'to', to, 'requests'), {
				...action,
				creator: user.uid,
				target: to,
				timestamp: serverTimestamp()
			}).catch((message) => {
				console.error(message);
			});
		}
	}
};

connectFirestoreEmulator(firebase.firestore, 'localhost', 8080);

export default firebase;
