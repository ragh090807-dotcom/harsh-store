import { db, auth } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const whatsappNumber = "919059047796";

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let showingWishlistOnly = false;

const productGrid = document.getElementById("productGrid");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sizeFilter = document.getElementById("sizeFilter");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const sortFilter = document.getElementById("sortFilter");

/* ===== VIDEO CHECK ===== */
function isVideo(product) {
  const url = product.image || "";
  return (
    product.category === "Watch and Buy" ||
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".mov")
  );
}

/* ===== MEDIA HTML ===== */
function getMedia(product) {
  if (isVideo(product)) {
    return `
      <video src="${product.image}" autoplay muted loop playsinline onclick="openProduct('${product.id}')"></video>
    `;
  }
  return `
    <img src="${product.image}" onclick="openProduct('${product.id}')">
  `;
}

/* ===== LOAD PRODUCTS ===== */
async function loadProducts() {
  productGrid.innerHTML = "<p>Loading...</p>";

  const snapshot = await getDocs(collection(db, "products"));
  products = [];

  snapshot.forEach(docSnap => {
    products.push({ id: docSnap.id, ...docSnap.data() });
  });

  applyFilters();
}

/* ===== DISPLAY ===== */
function displayProducts(list) {
  productGrid.innerHTML = "";

  list.forEach(p => {
    const sizes = (p.sizes || "").split(",");

    productGrid.innerHTML += `
      <div class="product-card">
        <div class="product-image-wrap">
          ${getMedia(p)}
        </div>

        <div class="product-info">
          <h3 onclick="openProduct('${p.id}')">${p.name}</h3>
          <p class="price">₹${p.price}</p>

          <select id="size-${p.id}">
            <option value="">Select Size</option>
            ${sizes.map(s => `<option>${s}</option>`).join("")}
          </select>

          <div class="product-actions">
            <button onclick="addToCart('${p.id}')">Add to Cart</button>
            <button onclick="openProduct('${p.id}')">View</button>
          </div>
        </div>
      </div>
    `;
  });
}

/* ===== FILTER FIX ===== */
function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const size = sizeFilter.value;
  const min = Number(minPrice.value) || 0;
  const max = Number(maxPrice.value) || Infinity;

  let filtered = products.filter(p => {
    return (
      p.name.toLowerCase().includes(search) &&
      (category === "all" ||
        p.category?.toLowerCase().trim() === category.toLowerCase().trim()) &&
      (size === "all" || (p.sizes || "").includes(size)) &&
      Number(p.price) >= min &&
      Number(p.price) <= max
    );
  });

  displayProducts(filtered);
}

/* ===== CART ===== */
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const size = document.getElementById(`size-${id}`).value;

  if (!size) {
    alert("Select size");
    return;
  }

  cart.push({ ...product, size });
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

function updateCart() {
  cartCount.innerText = cart.length;
}

/* ===== NAV ===== */
function openProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

/* ===== EVENTS ===== */
[searchInput, categoryFilter, sizeFilter, minPrice, maxPrice].forEach(el => {
  el.addEventListener("input", applyFilters);
});

/* ===== GLOBAL ===== */
window.addToCart = addToCart;
window.openProduct = openProduct;

/* ===== START ===== */
loadProducts();
updateCart();
