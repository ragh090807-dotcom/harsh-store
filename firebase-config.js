import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCcmm5dI7gXlLXdW0J6QQCerFqfNzV0shQ",
  authDomain: "harsha-clothing.firebaseapp.com",
  projectId: "harsha-clothing",
  storageBucket: "harsha-clothing.firebasestorage.app",
  messagingSenderId: "67038967521",
  appId: "1:67038967521:web:bf5c396241411c510fa9a0"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);