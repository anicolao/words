// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjB6iJwlZxMlUjS_Q91JdK0yPA-vRljDU",
  authDomain: "blueroux-5772a.firebaseapp.com",
  projectId: "blueroux-5772a",
  storageBucket: "blueroux-5772a.appspot.com",
  messagingSenderId: "307152117266",
  appId: "1:307152117266:web:b1bce200fb687ba8ae02cb",
  measurementId: "G-6C5J9P8BQL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
