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

    displayProducts(products);
  } catch (error) {
    console.error(error);
    usingDemoProducts = true;
    products = demoProducts;
    displayProducts(products);
  }
}

function displayProducts(list = products) {
  productGrid.innerHTML = "";

  if (list.length === 0) {
    productGrid.innerHTML = `<div class="empty-state"><h3>No products found.</h3><p>Try another filter or search.</p></div>`;
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
          <img src="${product.image}" alt="${product.name}" onclick="openProduct('${product.id}')">
          <span class="product-badge">${isOut ? "Out of Stock" : product.category || "New"}</span>
          <button class="wish-btn ${wished ? "active" : ""}" onclick="toggleWishlist('${product.id}')">♡</button>
        </div>

        <div class="product-info">
          <h3 onclick="openProduct('${product.id}')">${product.name}</h3>
          <p class="price">₹${product.price}</p>
          <p class="muted">${product.category || "Collection"} • Stock: ${product.stock ?? "Available"}</p>

          ${isOut ? `
            <div class="stock-out">Out of Stock</div>
          ` : `
            <select id="size-${product.id}" class="size-select">
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
  const searchValue = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const size = sizeFilter.value;
  const min = Number(minPrice.value) || 0;
  const max = Number(maxPrice.value) || Infinity;
  const sort = sortFilter.value;

  let filtered = products.filter(product => {
    const productSizes = Array.isArray(product.sizes) ? product.sizes : [];

    return (
      product.name.toLowerCase().includes(searchValue) &&
      (category === "all" || product.category === category) &&
      (size === "all" || productSizes.includes(size)) &&
      Number(product.price) >= min &&
      Number(product.price) <= max
    );
  });

  if (sort === "low") filtered.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "high") filtered.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  displayProducts(filtered);
}

function quickCategory(category) {
  categoryFilter.value = category;
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  applyFilters();
}

function clearFilters() {
  searchInput.value = "";
  categoryFilter.value = "all";
  sizeFilter.value = "all";
  minPrice.value = "";
  maxPrice.value = "";
  sortFilter.value = "default";
  displayProducts(products);
}

function openProduct(id) {
  window.location.href = `product.html?id=${id}${usingDemoProducts ? "&demo=1" : ""}`;
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
  const wishedProducts = products.filter(product => wishlist.includes(product.id));
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
  displayProducts(wishedProducts);
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  const selectedSize = document.getElementById(`size-${id}`)?.value;

  if (!product) return;

  if (Number(product.stock) <= 0) {
    alert("This product is out of stock.");
    return;
  }

  if (!selectedSize) {
    alert("Please select a size.");
    return;
  }

  const existing = cart.find(item => item.id === id && item.selectedSize === selectedSize);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, selectedSize, qty: 1 });
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
  cartCount.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
  }

  cart.forEach(item => {
    cartItems.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
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
  document.getElementById("cartOverlay").style.display = "flex";
}

function closeCart() {
  document.getElementById("cartOverlay").style.display = "none";
}

function getCustomerDetails() {
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();

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

async function sendWhatsAppOrder() {
  const details = getCustomerDetails();
  if (!details) return;

  const currentUser = auth.currentUser;

  const orderData = {
    name: details.name,
    customerName: details.name,
    phone: details.phone,
    address: details.address,
    userId: currentUser ? currentUser.uid : null,
    userEmail: currentUser ? currentUser.email : null,
    cart: cart,
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
    alert("Order saved successfully. Order ID: " + saved.id);
  } catch (error) {
    console.error(error);
    alert("Order not saved. Check Firebase.");
    return;
  }

  let message = `Hello, I want to place an order.%0A%0A`;
  message += `Order ID: ${orderData.orderId}%0A`;
  message += `Name: ${orderData.name}%0A`;
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

  window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
}

[searchInput, categoryFilter, sizeFilter, minPrice, maxPrice, sortFilter].forEach(el => {
  if (el) {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
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

loadProductsFromFirebase();
updateCart();
