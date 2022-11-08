import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyB34wv1VtgW5jpB-GMHFc2J5MK2C9DuvCs',
  authDomain: 'claimkitty-3acf8.firebaseapp.com',
  databaseURL: 'https://claimkitty-3acf8-default-rtdb.firebaseio.com/',
  projectId: 'claimkitty-3acf8',
  storageBucket: 'claimkitty-3acf8.appspot.com',
  messagingSenderId: '832415540230',
  appId: '1:832415540230:web:879e1f9a3071b6be460f87',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
