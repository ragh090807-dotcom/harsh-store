import { db, auth } from "./firebase-config.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const whatsappNumber = "919059047796";

const demoProducts = [
  {
    id: "demo1",
    name: "Royal Ethnic Kurta Set",
    price: 2499,
    category: "Ethnic",
    sizes: ["S", "M", "L", "XL"],
    stock: 12,
    description: "Premium ethnic kurta set designed for festive occasions and elegant daily wear.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "demo2",
    name: "Premium Festive Dress",
    price: 3199,
    category: "Festive",
    sizes: ["M", "L", "XL"],
    stock: 8,
    description: "Stylish festive dress with a premium look and comfortable fit.",
    image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "demo3",
    name: "Modern Premium Co-ord Set",
    price: 2199,
    category: "Modern",
    sizes: ["S", "M", "L", "XL"],
    stock: 10,
    description: "Modern co-ord set designed for stylish casual and semi-formal looks.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"
  }
];

let products = [];
let usingDemoProducts = false;
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

// ✅ NEW
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

async function saveOrder(orderData) {
  return await addDoc(collection(db, "orders"), {
    ...orderData,
    createdAt: serverTimestamp()
  });
}

async function loadProductsFromFirebase() {
  productGrid.innerHTML = `<div class="empty-state"><h3>Loading products...</h3></div>`;

  try {
    const snapshot = await getDocs(collection(db, "products"));
    products = [];

    snapshot.forEach((docSnap) => {
      products.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    if (products.length === 0) {
      usingDemoProducts = true;
      products = demoProducts;
    }

    applyFilters();
  } catch (error) {
    usingDemoProducts = true;
    products = demoProducts;
    applyFilters();
  }
}

function displayProducts(list = products) {
  productGrid.innerHTML = "";

  if (list.length === 0) {
    productGrid.innerHTML = `<div class="empty-state"><h3>No products found.</h3></div>`;
    return;
  }

  list.forEach(product => {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const sizeOptions = sizes.map(size => `<option value="${size}">${size}</option>`).join("");
    const isOut = Number(product.stock) <= 0;
    const wished = wishlist.includes(product.id);

    productGrid.innerHTML += `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="${product.image}" onclick="openProduct('${product.id}')">
          <span class="product-badge">${isOut ? "Out of Stock" : product.category}</span>
          <button class="wish-btn ${wished ? "active" : ""}" onclick="toggleWishlist('${product.id}')">
            ${wished ? "♥" : "♡"}
          </button>
        </div>

        <div class="product-info">
          <h3 onclick="openProduct('${product.id}')">${product.name}</h3>
          <p class="price">₹${product.price}</p>

          ${isOut ? `<div class="stock-out">Out of Stock</div>` : `
            <select id="size-${product.id}">
              <option value="">Select Size</option>
              ${sizeOptions}
            </select>

            <div class="product-actions">
              <button onclick="addToCart('${product.id}')">Add to Cart</button>
              <button class="small-btn" onclick="openProduct('${product.id}')">View</button>
            </div>
          `}
        </div>
      </div>
    `;
  });
}

function applyFilters() {
  const searchValue = searchInput ? searchInput.value.toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "all";
  const size = sizeFilter ? sizeFilter.value : "all";
  const min = minPrice ? Number(minPrice.value) || 0 : 0;
  const max = maxPrice ? Number(maxPrice.value) || Infinity : Infinity;
  const sort = sortFilter ? sortFilter.value : "default";

  let filtered = products.filter(product => {
    const productSizes = Array.isArray(product.sizes) ? product.sizes : [];

    return (
      product.name.toLowerCase().includes(searchValue) &&
      (category === "all" || product.category === category) &&
      (size === "all" || productSizes.includes(size)) &&
      Number(product.price) >= min &&
      Number(product.price) <= max &&
      (!showingWishlistOnly || wishlist.includes(product.id))
    );
  });

  if (sort === "low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "high") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  displayProducts(filtered);
}

function toggleWishlist(id) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(item => item !== id);
  } else {
    wishlist.push(id);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));

  // ✅ instant update
  applyFilters();
}

function showWishlist() {
  showingWishlistOnly = true;
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  applyFilters();
}

function clearFilters() {
  showingWishlistOnly = false;

  searchInput.value = "";
  categoryFilter.value = "all";
  sizeFilter.value = "all";
  minPrice.value = "";
  maxPrice.value = "";
  sortFilter.value = "default";

  applyFilters();
}

// 🔥 IMPORTANT FIX
[searchInput, categoryFilter, sizeFilter, minPrice, maxPrice, sortFilter].forEach(el => {
  if (el) {
    el.addEventListener("input", () => {
      showingWishlistOnly = false;
      applyFilters();
    });

    el.addEventListener("change", () => {
      showingWishlistOnly = false;
      applyFilters();
    });
  }
});

// other functions unchanged...

window.toggleWishlist = toggleWishlist;
window.showWishlist = showWishlist;
window.clearFilters = clearFilters;

loadProductsFromFirebase();
