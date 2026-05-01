import { db, saveOrder } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const whatsappNumber = "919059047796";

const demoProducts = {
  demo1: {
    id: "demo1",
    name: "Royal Ethnic Kurta Set",
    price: 2499,
    category: "Ethnic",
    sizes: ["S","M","L","XL"],
    stock: 12,
    description: "Premium ethnic kurta set designed for festive occasions and elegant daily wear.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80"
  },
  demo2: {
    id: "demo2",
    name: "Premium Festive Dress",
    price: 3199,
    category: "Festive",
    sizes: ["M","L","XL"],
    stock: 8,
    description: "Stylish festive dress with a premium look and comfortable fit.",
    image: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=900&q=80"
  },
  demo3: {
    id: "demo3",
    name: "Modern Premium Co-ord Set",
    price: 2199,
    category: "Modern",
    sizes: ["S","M","L","XL"],
    stock: 10,
    description: "Modern co-ord set designed for stylish casual and semi-formal looks.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"
  }
};

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let product = null;
let selectedSize = "";

const productDetail = document.getElementById("productDetail");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const demoMode = params.get("demo") === "1";

async function loadProductDetail() {
  if (!productId) {
    productDetail.innerHTML = `<div class="empty-state"><h2>Product not found</h2></div>`;
    return;
  }

  if (demoMode && demoProducts[productId]) {
    product = demoProducts[productId];
    displayProductDetail();
    return;
  }

  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      productDetail.innerHTML = `<div class="empty-state"><h2>Product not found</h2></div>`;
      return;
    }

    product = { id: productSnap.id, ...productSnap.data() };
    displayProductDetail();
  } catch (error) {
    console.error(error);
    productDetail.innerHTML = `<div class="empty-state"><h2>Could not load product</h2></div>`;
  }
}

function displayProductDetail() {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const sizeButtons = sizes.map(size => {
    return `<button class="size-option" onclick="selectSize('${size}', event)">${size}</button>`;
  }).join("");

  const out = Number(product.stock) <= 0;

  productDetail.innerHTML = `
    <div class="detail-container">
      <div class="detail-image">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <div class="detail-info">
        <p class="section-small">${product.category || "Product"}</p>
        <h1>${product.name}</h1>
        <p class="detail-price">₹${product.price}</p>
        <p class="detail-desc">${product.description || ""}</p>
        <p><strong>Stock:</strong> ${out ? "Out of Stock" : product.stock ?? "Available"}</p>

        ${out ? `
          <div class="stock-out">Out of Stock</div>
        ` : `
          <p><strong>Select Size:</strong></p>
          <div class="size-options">${sizeButtons}</div>
          <p id="selectedSizeText">No size selected</p>
          <button class="detail-btn" onclick="addToCart()">Add to Cart</button>
          <button class="whatsapp-detail-btn" onclick="buyNowWhatsApp()">Buy on WhatsApp</button>
        `}
      </div>
    </div>
  `;
}

function selectSize(size, event) {
  selectedSize = size;
  document.getElementById("selectedSizeText").innerText = `Selected Size: ${size}`;

  document.querySelectorAll(".size-option").forEach(btn => btn.classList.remove("active-size"));
  event.target.classList.add("active-size");
}

function addToCart() {
  if (Number(product.stock) <= 0) {
    alert("This product is out of stock.");
    return;
  }

  if (!selectedSize) {
    alert("Please select a size.");
    return;
  }

  const existing = cart.find(item => item.id === product.id && item.selectedSize === selectedSize);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, selectedSize, qty: 1 });
  }

  saveCart();
  updateCart();
  openCart();
}

function buyNowWhatsApp() {
  addToCart();
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
  if (item && item.qty > 1) item.qty--;
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

  if (cart.length === 0) cartItems.innerHTML = "<p>Your cart is empty.</p>";

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

  const orderData = {
    name: details.name,
    phone: details.phone,
    address: details.address,
    cart,
    total: getTotal(),
    paymentMethod: "WhatsApp",
    paymentStatus: "Pending",
    orderStatus: "Pending",
    paymentId: "Not paid",
    createdAt: new Date().toLocaleString()
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

  window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.openCart = openCart;
window.closeCart = closeCart;
window.sendWhatsAppOrder = sendWhatsAppOrder;
window.buyNowWhatsApp = buyNowWhatsApp;
window.selectSize = selectSize;

loadProductDetail();
updateCart();
