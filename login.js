import { auth } from "./firebase-config.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const provider = new GoogleAuthProvider();

async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
    alert("Login successful.");
    window.location.href = "index.html";
  } catch (error) {
    alert(error.message);
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in:", user.email);
  }
});

window.loginWithGoogle = loginWithGoogle;
