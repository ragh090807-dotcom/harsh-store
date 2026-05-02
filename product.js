import { db } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const productDetail = document.getElementById("productDetail");

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

let currentProduct = null;

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProduct() {
  const productId = getProductId();

  if (!productId) {
    productDetail.innerHTML = "<p>Product not found.</p>";
    return;
  }

  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      currentProduct = {
        id: productSnap.id,
        ...productSnap.data()
      };
    } else {
      currentProduct = demoProducts.find(product => product.id === productId);
    }

    if (!currentProduct) {
      productDetail.innerHTML = "<p>Product not found.</p>";
      return;
    }

    displayProduct(currentProduct);

  } catch (error) {
    console.error(error);

    currentProduct = demoProducts.find(product => product.id === productId);

    if (currentProduct) {
      displayProduct(currentProduct);
    } else {
      productDetail.innerHTML = "<p>Error loading product.</p>";
    }
  }
}

function displayProduct(product) {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const sizeOptions = sizes.map(size => `<option value="${size}">${size}</option>`).join("");
  const isOut = Number(product.stock) <= 0;

  productDetail.innerHTML = `
    <div class="product-detail-image">
      <img src="${product.image}" alt="${product.name}">
    </div>

    <div class="product-detail-info">
      <p class="section-small">${product.category || "Collection"}</p>
      <h1>${product.name}</h1>
      <h2>₹${product.price}</h2>

      <p class="product-description">
        ${product.description || "Premium quality clothing designed for comfort and style."}
      </p>

      <p><b>Stock:</b> ${product.stock ?? "Available"}</p>

      ${
        isOut
          ? `<div class="stock-out">Out of Stock</div>`
          : `
            <label>Select Size</label>
            <select id="detailSize">
              <option value="">Choose Size</option>
              ${sizeOptions}
            </select>

            <button onclick="addDetailProductToCart()">Add to Cart</button>
          `
      }

      <a href="index.html#products" class="outline-btn">Back to Shop</a>
    </div>
  `;
}

function addDetailProductToCart() {
  const selectedSize = document.getElementById("detailSize").value;

  if (!selectedSize) {
    alert("Please select a size.");
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(
    item => item.id === currentProduct.id && item.selectedSize === selectedSize
  );

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      ...currentProduct,
      selectedSize: selectedSize,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  alert("Product added to cart.");
  window.location.href = "index.html";
}

window.addDetailProductToCart = addDetailProductToCart;

loadProduct();
