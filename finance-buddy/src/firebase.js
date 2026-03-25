// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDK3cueD4utMjVz79umph499xWPgQFCN5c",
  authDomain: "ml-budget-app.firebaseapp.com",
  projectId: "ml-budget-app",
  storageBucket: "ml-budget-app.firebasestorage.app",
  messagingSenderId: "562656331228",
  appId: "1:562656331228:web:831602aeae4436ade73b19",
  measurementId: "G-FC8HSMQL8D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);