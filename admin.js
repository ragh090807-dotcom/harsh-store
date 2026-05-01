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
const productDescription = document.getElementById("productDescription");

const adminProducts = document.getElementById("adminProducts");
const ordersDiv = document.getElementById("orders");

let ordersCache = [];

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

async function saveProduct() {
  if (!productName.value || !productPrice.value || !productImage.value) {
    alert("Product name, price and image are required.");
    return;
  }

  const productData = {
    name: productName.value.trim(),
    price: Number(productPrice.value),
    category: productCategory.value.trim(),
    sizes: productSizes.value.split(",").map(size => size.trim()).filter(Boolean),
    stock: Number(productStock.value) || 0,
    image: productImage.value.trim(),
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
          <p><b>Price:</b> ₹${product.price}</p>
          <p><b>Category:</b> ${product.category || "N/A"}</p>
          <p><b>Sizes:</b> ${product.sizes ? product.sizes.join(", ") : "N/A"}</p>
          <p><b>Stock:</b> ${product.stock}</p>
          <button class="edit-btn" onclick="editProduct('${docSnap.id}')">Edit</button>
          <button class="danger-btn" onclick="deleteProduct('${docSnap.id}')">Delete</button>
        </div>
      `;
    });
  } catch (error) {
    adminProducts.innerHTML = "<p>Error loading products.</p>";
    console.error(error);
  }
}

async function editProduct(productId) {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      alert("Product not found.");
      return;
    }

    const product = productSnap.data();

    editingProductId.value = productId;
    productFormTitle.textContent = "Edit Product";
    productName.value = product.name || "";
    productPrice.value = product.price || "";
    productCategory.value = product.category || "";
    productSizes.value = product.sizes ? product.sizes.join(",") : "";
    productStock.value = product.stock || 0;
    productImage.value = product.image || "";
    productDescription.value = product.description || "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    alert("Error loading product: " + error.message);
  }
}

async function deleteProduct(productId) {
  if (!confirm("Delete this product?")) return;

  try {
    await deleteDoc(doc(db, "products", productId));
    alert("Product deleted.");
    loadProducts();
  } catch (error) {
    alert("Error deleting product: " + error.message);
  }
}

function clearProductForm() {
  editingProductId.value = "";
  productFormTitle.textContent = "Add New Product";
  productName.value = "";
  productPrice.value = "";
  productCategory.value = "";
  productSizes.value = "";
  productStock.value = "";
  productImage.value = "";
  productDescription.value = "";
}

async function loadOrders() {
  ordersDiv.innerHTML = "<p>Loading orders...</p>";

  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    ordersDiv.innerHTML = "";
    ordersCache = [];

    if (snapshot.empty) {
      ordersDiv.innerHTML = "<p>No orders yet.</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const order = {
        id: docSnap.id,
        ...docSnap.data()
      };

      ordersCache.push(order);

      const orderItems = order.items || order.cart || [];

      let itemsHTML = "";
      orderItems.forEach(item => {
        itemsHTML += `
          <div class="product-box">
            <p><b>${item.name}</b></p>
            <p>Size: ${item.selectedSize || "N/A"}</p>
            <p>Qty: ${item.qty || item.quantity || 1}</p>
            <p>Price: ₹${item.price}</p>
          </div>
        `;
      });

      ordersDiv.innerHTML += `
        <div class="order-card">
          <h2>Order ID: ${order.id}</h2>
          <p><b>Name:</b> ${order.customerName || order.name}</p>
          <p><b>Phone:</b> ${order.phone}</p>
          <p><b>Address:</b> ${order.address}</p>
          <p><b>Payment:</b> ${order.paymentStatus || "Pending"}</p>
          <p><b>Status:</b> ${order.orderStatus || "Order Placed"}</p>

          ${itemsHTML}

          <p class="total">Total: ₹${order.total}</p>

          <select onchange="updateOrderStatus('${order.id}', this.value)">
            <option value="">Update Status</option>
            <option value="Order Placed">Order Placed</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button class="danger-btn" onclick="deleteOrder('${order.id}')">Delete Order</button>
        </div>
      `;
    });
  } catch (error) {
    ordersDiv.innerHTML = "<p>Error loading orders.</p>";
    console.error(error);
  }
}

async function updateOrderStatus(orderId, status) {
  if (!status) return;

  try {
    await updateDoc(doc(db, "orders", orderId), {
      orderStatus: status
    });

    alert("Order status updated.");
    loadOrders();
  } catch (error) {
    alert("Error updating order: " + error.message);
  }
}

async function deleteOrder(orderId) {
  if (!confirm("Delete this order?")) return;

  try {
    await deleteDoc(doc(db, "orders", orderId));
    alert("Order deleted.");
    loadOrders();
  } catch (error) {
    alert("Error deleting order: " + error.message);
  }
}

function exportOrders() {
  if (ordersCache.length === 0) {
    alert("No orders to export.");
    return;
  }

  let csv = "Order ID,Name,Phone,Address,Total,Payment Status,Order Status\n";

  ordersCache.forEach(order => {
    csv += `"${order.id}","${order.customerName || order.name}","${order.phone}","${order.address}","${order.total}","${order.paymentStatus}","${order.orderStatus}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.csv";
  a.click();

  URL.revokeObjectURL(url);
}

window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;
window.saveProduct = saveProduct;
window.clearProductForm = clearProductForm;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
window.exportOrders = exportOrders;
