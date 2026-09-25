/* Your Firebase config — already filled in for Development Allies BD. */
const firebaseConfig = {
  apiKey: "AIzaSyD1_caUdM7yl9ruELcpPke8XO0LROEiXUc",
  authDomain: "devalliesbd.firebaseapp.com",
  projectId: "devalliesbd",
  storageBucket: "devalliesbd.firebasestorage.app",
  messagingSenderId: "60035762750",
  appId: "1:60035762750:web:3146b189521835fbaddf6f"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth ? firebase.auth() : null;
