import { auth } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const authMessage = document.getElementById("authMessage");

async function signupCustomer() {
  if (!email.value || !password.value) {
    authMessage.textContent = "Enter email and password.";
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    authMessage.textContent = "Account created successfully.";
    window.location.href = "account.html";
  } catch (error) {
    authMessage.textContent = error.message;
  }
}

async function loginCustomer() {
  if (!email.value || !password.value) {
    authMessage.textContent = "Enter email and password.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    authMessage.textContent = "Login successful.";
    window.location.href = "account.html";
  } catch (error) {
    authMessage.textContent = error.message;
  }
}

window.signupCustomer = signupCustomer;
window.loginCustomer = loginCustomer;
