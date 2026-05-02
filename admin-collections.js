import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const collectionName = document.getElementById("collectionName");
const collectionImage = document.getElementById("collectionImage");
const adminCollections = document.getElementById("adminCollections");

async function saveCollection() {
  const name = collectionName.value.trim();
  const image = collectionImage.value.trim();

  if (!name || !image) {
    alert("Please enter collection name and image URL.");
    return;
  }

  await addDoc(collection(db, "collections"), {
    name,
    image
  });

  collectionName.value = "";
  collectionImage.value = "";

  alert("Collection added successfully.");
  loadCollections();
}

async function loadCollections() {
  adminCollections.innerHTML = "<p>Loading collections...</p>";

  const snapshot = await getDocs(collection(db, "collections"));

  adminCollections.innerHTML = "";

  if (snapshot.empty) {
    adminCollections.innerHTML = "<p>No collections added yet.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    adminCollections.innerHTML += `
      <div class="product-box">
        <h3>${data.name}</h3>
        <img src="${data.image}" style="width:120px;height:120px;object-fit:cover;border-radius:12px;">
        <br><br>
        <button class="danger-btn" onclick="deleteCollection('${docSnap.id}')">Delete</button>
      </div>
    `;
  });
}

async function deleteCollection(id) {
  if (!confirm("Delete this collection?")) return;

  await deleteDoc(doc(db, "collections", id));
  loadCollections();
}

window.saveCollection = saveCollection;
window.deleteCollection = deleteCollection;

loadCollections();
