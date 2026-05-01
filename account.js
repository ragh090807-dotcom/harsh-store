import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const userEmail = document.getElementById("userEmail");
const ordersList = document.getElementById("ordersList");

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  userEmail.textContent = "Logged in as: " + user.email;
  loadCustomerOrders(user.uid);
});

async function loadCustomerOrders(userId) {
  ordersList.innerHTML = "<p>Loading orders...</p>";

  try {
    const q = query(collection(db, "orders"), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    ordersList.innerHTML = "";

    if (snapshot.empty) {
      ordersList.innerHTML = "<p>No orders found.</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const order = docSnap.data();
      const items = order.items || order.cart || [];

      let itemsHTML = "";

      items.forEach(item => {
        itemsHTML += `
          <div class="product-box">
            <p><b>${item.name}</b></p>
            <p>Size: ${item.selectedSize || "N/A"}</p>
            <p>Qty: ${item.qty || 1}</p>
            <p>Price: ₹${item.price}</p>
          </div>
        `;
      });

      ordersList.innerHTML += `
        <div class="order-card">
          <h3>Order ID: ${docSnap.id}</h3>
          <p><b>Status:</b> ${order.orderStatus || "Order Placed"}</p>
          <p><b>Payment:</b> ${order.paymentStatus || "Pending"}</p>
          <p><b>Total:</b> ₹${order.total}</p>
          ${itemsHTML}
        </div>
      `;
    });

  } catch (error) {
    console.error(error);
    ordersList.innerHTML = "<p>Error loading orders.</p>";
  }
}

async function logoutCustomer() {
  await signOut(auth);
  window.location.href = "login.html";
}

window.logoutCustomer = logoutCustomer;
