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
const collectionsGrid = document.getElementById("collectionsGrid");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sizeFilter = document.getElementById("sizeFilter");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const sortFilter = document.getElementById("sortFilter");

const defaultCollections = [
  { name: "Ethnic", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80" },
  { name: "Festive", image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=900&q=80" },
  { name: "Modern", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80" },
  { name: "Watch and Buy", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80" }
];

function isVideoProduct(product) {
  const url = String(product.image || "").toLowerCase();
  const category = String(product.category || "").trim().toLowerCase();

  return (
    category === "watch and buy" ||
    url.includes(".mp4") ||
    url.includes(".webm") ||
    url.includes(".mov")
  );
}

function productMediaHTML(product) {
  if (isVideoProduct(product)) {
    return `
      <video
        src="${product.image}"
        autoplay
        muted
        loop
        playsinline
        onclick="openProduct('${product.id}')">
      </video>
    `;
  }

  return `<img src="${product.image}" alt="${product.name}" onclick="openProduct('${product.id}')">`;
}

function addCategoryOption(name) {
  if (!categoryFilter || !name) return;

  const exists = [...categoryFilter.options].some(
    option => option.value.trim().toLowerCase() === name.trim().toLowerCase()
  );

  if (!exists) {
    categoryFilter.innerHTML += `<option value="${name}">${name}</option>`;
  }
}

function renderCollectionCard(data) {
  if (!collectionsGrid) return;

  collectionsGrid.innerHTML += `
    <div class="collection-card" onclick="quickCategory('${data.name}')">
      <img src="${data.image}">
      <h3>${data.name}</h3>
    </div>
  `;
}

async function loadCollectionsFromFirebase() {
  if (!collectionsGrid || !categoryFilter) return;

  collectionsGrid.innerHTML = "";

  defaultCollections.forEach(item => {
    addCategoryOption(item.name);
    renderCollectionCard(item);
  });

  try {
    const snapshot = await getDocs(collection(db, "collections"));

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      if (data.name && data.image) {
        addCategoryOption(data.name);
        renderCollectionCard(data);
      }
    });
  } catch (error) {
    console.error("Collections loading failed:", error);
  }
}

async function loadProductsFromFirebase() {
  if (!productGrid) return;

  productGrid.innerHTML = `<div class="empty-state"><h3>Loading products...</h3></div>`;

  try {
    const snapshot = await getDocs(collection(db, "products"));
    products = [];

    snapshot.forEach(docSnap => {
      products.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    applyFilters();

  } catch (error) {
    console.error("Products loading failed:", error);
    productGrid.innerHTML = `<div class="empty-state"><h3>Error loading products.</h3></div>`;
  }
}

function getSizes(product) {
  if (Array.isArray(product.sizes)) return product.sizes;

  if (typeof product.sizes === "string") {
    return product.sizes.split(",").map(s => s.trim()).filter(Boolean);
  }

  return [];
}

function displayProducts(list = products) {
  if (!productGrid) return;

  productGrid.innerHTML = "";

  if (list.length === 0) {
    productGrid.innerHTML = `<div class="empty-state"><h3>No products found.</h3></div>`;
    return;
  }

  list.forEach(product => {
    const sizes = getSizes(product);
    const sizeOptions = sizes.map(s => `<option value="${s}">${s}</option>`).join("");
    const isOut = Number(product.stock) <= 0;
    const wished = wishlist.includes(product.id);

    productGrid.innerHTML += `
      <div class="product-card" onclick="openProduct('${product.id}')">
        <div class="product-image-wrap">
          ${productMediaHTML(product)}
          <span class="product-badge">${isOut ? "Out of Stock" : product.category || "New"}</span>
        </div>

        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="price">₹${product.price}</p>

          ${
            isOut
              ? `<div class="stock-out">Out of Stock</div>`
              : `
                <select id="size-${product.id}" onclick="event.stopPropagation()">
                  <option value="">Select Size</option>
                  ${sizeOptions}
                </select>

                <div class="product-actions">
                  <button onclick="event.stopPropagation(); addToCart('${product.id}')">Add</button>
                  <button onclick="event.stopPropagation(); toggleWishlist('${product.id}')">
                    ${wished ? "♥" : "♡"}
                  </button>
                </div>
              `
          }
        </div>
      </div>
    `;
  });
}

function applyFilters() {
  const searchValue = searchInput?.value.toLowerCase() || "";
  const category = categoryFilter?.value || "all";
  const size = sizeFilter?.value || "all";
  const min = minPrice?.value ? Number(minPrice.value) : 0;
  const max = maxPrice?.value ? Number(maxPrice.value) : Infinity;
  const sort = sortFilter?.value || "default";

  let filtered = products.filter(p => {
    const sizes = getSizes(p);

    return (
      p.name.toLowerCase().includes(searchValue) &&
      (category === "all" || p.category?.toLowerCase() === category.toLowerCase()) &&
      (size === "all" || sizes.includes(size)) &&
      p.price >= min &&
      p.price <= max &&
      (!showingWishlistOnly || wishlist.includes(p.id))
    );
  });

  if (sort === "low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "high") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  displayProducts(filtered);
}

function quickCategory(category) {
  showingWishlistOnly = false;
  if (categoryFilter) categoryFilter.value = category;
  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  applyFilters();
}

function clearFilters() {
  showingWishlistOnly = false;

  if (searchInput) searchInput.value = "";
  if (categoryFilter) categoryFilter.value = "all";
  if (sizeFilter) sizeFilter.value = "all";
  if (minPrice) minPrice.value = "";
  if (maxPrice) maxPrice.value = "";
  if (sortFilter) sortFilter.value = "default";

  applyFilters();
}

function openProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

function toggleWishlist(id) {
  wishlist = wishlist.includes(id)
    ? wishlist.filter(i => i !== id)
    : [...wishlist, id];

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  applyFilters();
}

/* CART SAME AS BEFORE (no change) */

window.addToCart = addToCart;
window.openProduct = openProduct;
window.toggleWishlist = toggleWishlist;
window.clearFilters = clearFilters;
window.quickCategory = quickCategory;

/* INIT */
async function initWebsite() {
  await loadCollectionsFromFirebase();
  await loadProductsFromFirebase();
  updateCart();
}

initWebsite();
