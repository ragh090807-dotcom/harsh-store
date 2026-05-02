import { db, auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ELEMENTS */
const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const loginError = document.getElementById("loginError");

const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");

const editingProductId = document.getElementById("editingProductId");
const productFormTitle = document.getElementById("productFormTitle");

const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productCategory = document.getElementById("productCategory");
const productSizes = document.getElementById("productSizes");
const productStock = document.getElementById("productStock");
const productImage = document.getElementById("productImage");
const productImages = document.getElementById("productImages"); // NEW
const productDescription = document.getElementById("productDescription");

const adminProducts = document.getElementById("adminProducts");
const ordersDiv = document.getElementById("orders");

let ordersCache = [];

/* LOGIN */
async function loginAdmin() {
  loginError.textContent = "";

  if (!adminEmail.value || !adminPassword.value) {
    loginError.textContent = "Enter email and password.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, adminEmail.value, adminPassword.value);
  } catch (error) {
    loginError.textContent = "Login failed: " + error.message;
  }
}

async function logoutAdmin() {
  await signOut(auth);
}

onAuthStateChanged(auth, user => {
  if (user) {
    loginBox.style.display = "none";
    adminPanel.style.display = "block";
    loadProducts();
    loadOrders();
  } else {
    loginBox.style.display = "block";
    adminPanel.style.display = "none";
  }
});

/* =========================
   SAVE PRODUCT (UPDATED)
========================= */
async function saveProduct() {
  if (!productName.value || !productPrice.value || !productImage.value) {
    alert("Product name, price and image are required.");
    return;
  }

  /* MULTI IMAGE LOGIC */
  const extraImages = productImages.value
    ? productImages.value.split(",").map(i => i.trim()).filter(Boolean)
    : [];

  const allImages = [productImage.value.trim(), ...extraImages];

  const productData = {
    name: productName.value.trim(),
    price: Number(productPrice.value),
    category: productCategory.value.trim(),
    sizes: productSizes.value.split(",").map(s => s.trim()).filter(Boolean),
    stock: Number(productStock.value) || 0,

    /* IMPORTANT */
    image: productImage.value.trim(), // keep old
    images: allImages, // NEW

    description: productDescription.value.trim(),
    updatedAt: serverTimestamp()
  };

  try {
    if (editingProductId.value) {
      await updateDoc(doc(db, "products", editingProductId.value), productData);
      alert("Product updated successfully.");
    } else {
      await addDoc(collection(db, "products"), {
        ...productData,
        createdAt: serverTimestamp()
      });
      alert("Product added successfully.");
    }

    clearProductForm();
    loadProducts();

  } catch (error) {
    alert("Error saving product: " + error.message);
  }
}

/* =========================
   LOAD PRODUCTS
========================= */
async function loadProducts() {
  adminProducts.innerHTML = "<p>Loading products...</p>";

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    adminProducts.innerHTML = "";

    if (snapshot.empty) {
      adminProducts.innerHTML = "<p>No products added yet.</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const product = docSnap.data();

      adminProducts.innerHTML += `
        <div class="product-card">
          <img src="${product.image}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p><b>₹${product.price}</b></p>
          <p>${product.category || ""}</p>
          <button class="edit-btn" onclick="editProduct('${docSnap.id}')">Edit</button>
          <button class="danger-btn" onclick="deleteProduct('${docSnap.id}')">Delete</button>
        </div>
      `;
    });

  } catch (error) {
    adminProducts.innerHTML = "<p>Error loading products.</p>";
  }
}

/* =========================
   EDIT PRODUCT
========================= */
async function editProduct(productId) {
  const ref = doc(db, "products", productId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Product not found.");
    return;
  }

  const p = snap.data();

  editingProductId.value = productId;
  productFormTitle.textContent = "Edit Product";

  productName.value = p.name || "";
  productPrice.value = p.price || "";
  productCategory.value = p.category || "";
  productSizes.value = p.sizes ? p.sizes.join(",") : "";
  productStock.value = p.stock || 0;

  productImage.value = p.image || "";

  /* LOAD EXTRA IMAGES */
  if (p.images && p.images.length > 1) {
    productImages.value = p.images.slice(1).join(",");
  } else {
    productImages.value = "";
  }

  productDescription.value = p.description || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* DELETE */
async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  await deleteDoc(doc(db, "products", id));
  alert("Deleted");
  loadProducts();
}

/* CLEAR FORM */
function clearProductForm() {
  editingProductId.value = "";
  productFormTitle.textContent = "Add New Product";

  productName.value = "";
  productPrice.value = "";
  productCategory.value = "";
  productSizes.value = "";
  productStock.value = "";
  productImage.value = "";
  productImages.value = ""; // NEW
  productDescription.value = "";
}

/* =========================
   ORDERS (NO CHANGE)
========================= */
async function loadOrders() {
  ordersDiv.innerHTML = "<p>Loading orders...</p>";

  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  ordersDiv.innerHTML = "";
  ordersCache = [];

  snapshot.forEach(docSnap => {
    const order = { id: docSnap.id, ...docSnap.data() };
    ordersCache.push(order);

    ordersDiv.innerHTML += `
      <div class="order-card">
        <h2>${order.id}</h2>
        <p>${order.customerName}</p>
        <p>₹${order.total}</p>
      </div>
    `;
  });
}

/* EXPORT */
function exportOrders() {
  if (ordersCache.length === 0) return alert("No orders");

  let csv = "ID,Name,Total\n";

  ordersCache.forEach(o => {
    csv += `${o.id},${o.customerName},${o.total}\n`;
  });

  const blob = new Blob([csv]);
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.csv";
  a.click();
}

/* GLOBAL */
window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;
window.saveProduct = saveProduct;
window.clearProductForm = clearProductForm;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.exportOrders = exportOrders;
