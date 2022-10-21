import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAmvN70iJiINjovaXlPKdT6Y9mQkQIdnKY',
  authDomain: 'claim-kitty.firebaseapp.com',
  databaseURL: 'https://claim-kitty-default-rtdb.firebaseio.com',
  projectId: 'claim-kitty',
  storageBucket: 'claim-kitty.appspot.com',
  messagingSenderId: '824225186729',
  appId: '1:824225186729:web:cf46e74755a332d58bbab8',
  measurementId: 'G-91BGY294V1',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
