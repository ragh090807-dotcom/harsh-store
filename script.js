import { db, auth } from "./firebase-config.js";

import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let products = [];
let cart = [];

const productGrid = document.getElementById("productGrid");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

async function loadProductsFromFirebase() {
  const snapshot = await getDocs(collection(db, "products"));

  products = [];

  snapshot.forEach(doc => {
    products.push({ id: doc.id, ...doc.data() });
  });

  renderProducts();
}

function renderProducts() {
  productGrid.innerHTML = "";

  products.forEach(p => {
    productGrid.innerHTML += `
      <div class="product-card">
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    `;
  });
}

function addToCart(id) {
  const product = products.find(p => p.id === id);

  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCart();
}

function updateCart() {
  cartItems.innerHTML = "";

  cart.forEach(item => {
    cartItems.innerHTML += `
      <div>
        <h4>${item.name}</h4>
        <p>₹${item.price} x ${item.qty}</p>
      </div>
    `;
  });

  cartTotal.innerText = getTotal();
}

function getTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function openCart() {
  document.getElementById("cartOverlay").style.display = "block";
}

function closeCart() {
  document.getElementById("cartOverlay").style.display = "none";
}

function getCustomerDetails() {
  const name = document.getElementById("custName").value;
  const phone = document.getElementById("custPhone").value;
  const address = document.getElementById("custAddress").value;

  if (!name || !phone || !address) {
    alert("Fill all fields");
    return null;
  }

  return { name, phone, address };
}

async function sendWhatsAppOrder() {
  const details = getCustomerDetails();
  if (!details) return;

  const user = auth.currentUser;

  const orderData = {
    customerName: details.name,
    phone: details.phone,
    address: details.address,
    userId: user ? user.uid : null,
    userEmail: user ? user.email : null,
    cart: cart,
    total: getTotal(),
    paymentStatus: "Pending",
    orderStatus: "Order Placed"
  };

  const saved = await addDoc(collection(db, "orders"), orderData);

  alert("Order placed. ID: " + saved.id);

  let message = "Order ID: " + saved.id + "%0A";

  cart.forEach(item => {
    message += `${item.name} x ${item.qty}%0A`;
  });

  window.open(`https://wa.me/919059047796?text=${message}`, "_blank");
}

window.addToCart = addToCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.sendWhatsAppOrder = sendWhatsAppOrder;

loadProductsFromFirebase();
