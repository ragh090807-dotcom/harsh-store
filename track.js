import { db } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const orderIdInput = document.getElementById("orderIdInput");
const orderResult = document.getElementById("orderResult");

async function trackOrder() {
  const orderId = orderIdInput.value.trim();

  if (!orderId) {
    alert("Please enter your Order ID.");
    return;
  }

  orderResult.innerHTML = "<p>Checking order...</p>";

  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      orderResult.innerHTML = `
        <div class="order-card">
          <h3>Order Not Found</h3>
          <p>Please check your Order ID and try again.</p>
        </div>
      `;
      return;
    }

    const order = orderSnap.data();
    const items = order.items || order.cart || [];

    let itemsHTML = "";

    items.forEach(item => {
      itemsHTML += `
        <div class="product-box">
          <p><b>${item.name}</b></p>
          <p>Size: ${item.selectedSize || "N/A"}</p>
          <p>Quantity: ${item.qty || item.quantity || 1}</p>
          <p>Price: ₹${item.price}</p>
        </div>
      `;
    });

    orderResult.innerHTML = `
      <div class="order-card">
        <h3>Order Details</h3>
        <p><b>Order ID:</b> ${orderId}</p>
        <p><b>Name:</b> ${order.customerName || order.name}</p>
        <p><b>Phone:</b> ${order.phone}</p>
        <p><b>Address:</b> ${order.address}</p>
        <p><b>Payment Status:</b> ${order.paymentStatus || "Pending"}</p>
        <p><b>Order Status:</b> ${order.orderStatus || "Order Placed"}</p>

        <h4>Products:</h4>
        ${itemsHTML}

        <p class="total"><b>Total:</b> ₹${order.total}</p>
      </div>
    `;

  } catch (error) {
    console.error(error);
    orderResult.innerHTML = `
      <div class="order-card">
        <h3>Error</h3>
        <p>Unable to track order. Please try again later.</p>
      </div>
    `;
  }
}

window.trackOrder = trackOrder;