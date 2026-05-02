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
      <img src="${data.image}" alt="${data.name}">
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
    productGrid.innerHTML = `<div class="empty-state"><h3>Error loading products.</h3><p>Check Firebase or console.</p></div>`;
  }
}

function getSizes(product) {
  if (Array.isArray(product.sizes)) return product.sizes;

  if (typeof product.sizes === "string") {
    return product.sizes.split(",").map(size => size.trim()).filter(Boolean);
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
    const sizeOptions = sizes.map(size => `<option value="${size}">${size}</option>`).join("");
    const isOut = Number(product.stock) <= 0;
    const wished = wishlist.includes(product.id);

    productGrid.innerHTML += `
      <div class="product-card">
        <div class="product-image-wrap">
          ${productMediaHTML(product)}

          <span class="product-badge">${isOut ? "Out of Stock" : product.category || "New"}</span>

          <button class="wish-btn ${wished ? "active" : ""}" onclick="toggleWishlist('${product.id}')">
            ${wished ? "♥" : "♡"}
          </button>
        </div>

        <div class="product-info">
          <h3 onclick="openProduct('${product.id}')">${product.name}</h3>
          <p class="price">₹${product.price}</p>
          <p class="muted">${product.category || "Collection"} • Stock: ${product.stock ?? "Available"}</p>

          ${
            isOut
              ? `<div class="stock-out">Out of Stock</div>`
              : `
                <select id="size-${product.id}" class="size-select">
                  <option value="">Select Size</option>
                  ${sizeOptions}
                </select>

                <div class="product-actions">
                  <button type="button" onclick="addToCart('${product.id}')">Add to Cart</button>
                  <button type="button" class="small-btn" onclick="openProduct('${product.id}')">View</button>
                </div>
              `
          }
        </div>
      </div>
    `;
  });
}

function applyFilters() {
  const searchValue = searchInput ? searchInput.value.toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "all";
  const size = sizeFilter ? sizeFilter.value : "all";
  const min = minPrice && minPrice.value !== "" ? Number(minPrice.value) : 0;
  const max = maxPrice && maxPrice.value !== "" ? Number(maxPrice.value) : Infinity;
  const sort = sortFilter ? sortFilter.value : "default";

  let filtered = products.filter(product => {
    const productSizes = getSizes(product);

    return (
      String(product.name || "").toLowerCase().includes(searchValue) &&
      (
        category === "all" ||
        String(product.category || "").trim().toLowerCase() === String(category || "").trim().toLowerCase()
      ) &&
      (size === "all" || productSizes.includes(size)) &&
      Number(product.price) >= min &&
      Number(product.price) <= max &&
      (!showingWishlistOnly || wishlist.includes(product.id))
    );
  });

  if (sort === "low") filtered.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "high") filtered.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name") filtered.sort((a, b) => String(a.name).localeCompare(String(b.name)));

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
  window.location.href = `product.html?id=${encodeURIComponent(id)}`;
}

function toggleWishlist(id) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(item => item !== id);
  } else {
    wishlist.push(id);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  applyFilters();
}

function showWishlist() {
  showingWishlistOnly = true;
  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  applyFilters();
}

function addToCart(id) {
  const product = products.find(item => item.id === id);

  if (!product) {
    alert("Product not found.");
    return;
  }

  const sizeSelect = document.getElementById(`size-${id}`);
  const selectedSize = sizeSelect ? sizeSelect.value : "";

  if (!selectedSize) {
    alert("Please select a size.");
    return;
  }

  if (Number(product.stock) <= 0) {
    alert("This product is out of stock.");
    return;
  }

  const existing = cart.find(item => item.id === id && item.selectedSize === selectedSize);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      ...product,
      selectedSize,
      qty: 1
    });
  }

  saveCart();
  updateCart();
  openCart();
}

function removeFromCart(id, selectedSize) {
  cart = cart.filter(item => !(item.id === id && item.selectedSize === selectedSize));
  saveCart();
  updateCart();
}

function increaseQty(id, selectedSize) {
  const item = cart.find(i => i.id === id && i.selectedSize === selectedSize);
  if (item) item.qty++;
  saveCart();
  updateCart();
}

function decreaseQty(id, selectedSize) {
  const item = cart.find(i => i.id === id && i.selectedSize === selectedSize);

  if (item && item.qty > 1) {
    item.qty--;
  } else {
    removeFromCart(id, selectedSize);
    return;
  }

  saveCart();
  updateCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function getTotal() {
  return cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
}

function updateCart() {
  if (!cartCount || !cartItems || !cartTotal) return;

  cartCount.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
  }

  cart.forEach(item => {
    cartItems.innerHTML += `
      <div class="cart-item">
        ${
          isVideoProduct(item)
            ? `<video src="${item.image}" muted playsinline></video>`
            : `<img src="${item.image}" alt="${item.name}">`
        }

        <div>
          <h4>${item.name}</h4>
          <p>Size: ${item.selectedSize}</p>
          <p>₹${item.price}</p>

          <div class="qty-row">
            <button onclick="decreaseQty('${item.id}', '${item.selectedSize}')">-</button>
            <span>${item.qty}</span>
            <button onclick="increaseQty('${item.id}', '${item.selectedSize}')">+</button>
          </div>

          <button class="remove-btn" onclick="removeFromCart('${item.id}', '${item.selectedSize}')">Remove</button>
        </div>
      </div>
    `;
  });

  cartTotal.innerText = getTotal();
}

function openCart() {
  const cartOverlay = document.getElementById("cartOverlay");
  if (cartOverlay) cartOverlay.style.display = "flex";
}

function closeCart() {
  const cartOverlay = document.getElementById("cartOverlay");
  if (cartOverlay) cartOverlay.style.display = "none";
}

function getCustomerDetails() {
  const name = document.getElementById("custName")?.value.trim();
  const phone = document.getElementById("custPhone")?.value.trim();
  const address = document.getElementById("custAddress")?.value.trim();

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return null;
  }

  if (!name || !phone || !address) {
    alert("Please fill all details.");
    return null;
  }

  if (phone.length < 10) {
    alert("Please enter a valid phone number.");
    return null;
  }

  return { name, phone, address };
}

async function saveOrder(orderData) {
  return await addDoc(collection(db, "orders"), {
    ...orderData,
    createdAt: serverTimestamp()
  });
}

async function sendWhatsAppOrder() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    alert("Please login with Gmail before placing order.");
    window.location.href = "login.html";
    return;
  }

  const details = getCustomerDetails();
  if (!details) return;

  const orderData = {
    name: details.name,
    customerName: details.name,
    phone: details.phone,
    address: details.address,
    userId: currentUser.uid,
    userEmail: currentUser.email,
    cart,
    items: cart,
    total: getTotal(),
    paymentMethod: "WhatsApp",
    paymentStatus: "Pending",
    orderStatus: "Order Placed",
    paymentId: "Not paid"
  };

  try {
    const saved = await saveOrder(orderData);
    orderData.orderId = saved.id;

    let message = `Hello, I want to place an order.%0A%0A`;
    message += `Order ID: ${orderData.orderId}%0A`;
    message += `Name: ${orderData.name}%0A`;
    message += `Email: ${orderData.userEmail}%0A`;
    message += `Phone: ${orderData.phone}%0A`;
    message += `Address: ${orderData.address}%0A%0A`;
    message += `Order Details:%0A`;

    cart.forEach(item => {
      message += `- ${item.name} | Size: ${item.selectedSize} | Qty: ${item.qty} | Price: ₹${item.price}%0A`;
    });

    message += `%0ATotal Amount: ₹${orderData.total}`;

    localStorage.removeItem("cart");
    cart = [];
    updateCart();

    alert("Order saved successfully. Order ID: " + saved.id);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");

  } catch (error) {
    console.error(error);
    alert("Order not saved. Check Firebase.");
  }
}

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

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.openCart = openCart;
window.closeCart = closeCart;
window.sendWhatsAppOrder = sendWhatsAppOrder;
window.openProduct = openProduct;
window.toggleWishlist = toggleWishlist;
window.showWishlist = showWishlist;
window.clearFilters = clearFilters;
window.quickCategory = quickCategory;

async function initWebsite() {
  await loadCollectionsFromFirebase();
  await loadProductsFromFirebase();
  updateCart();
}

initWebsite();
