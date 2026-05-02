import { db } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const productDetail = document.getElementById("productDetail");

let currentProduct = null;

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function isVideoProduct(product) {
  const url = product.image || "";

  return (
    product.category === "Watch and Buy" ||
    url.includes(".mp4") ||
    url.includes(".webm") ||
    url.includes(".mov")
  );
}

function cleanDescription(description) {
  if (!description || description.includes("http")) {
    return "Premium quality product designed for comfort, style and everyday confidence.";
  }

  return description;
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

      displayProduct(currentProduct);
    } else {
      productDetail.innerHTML = "<p>Product not found.</p>";
    }

  } catch (error) {
    console.error(error);
    productDetail.innerHTML = "<p>Error loading product.</p>";
  }
}

function displayProduct(product) {
  const sizes = Array.isArray(product.sizes)
    ? product.sizes
    : typeof product.sizes === "string"
      ? product.sizes.split(",").map(size => size.trim()).filter(Boolean)
      : [];

  const sizeOptions = sizes.map(size => `<option value="${size}">${size}</option>`).join("");
  const isOut = Number(product.stock) <= 0;
  const description = cleanDescription(product.description);

  productDetail.innerHTML = `
    <div class="product-detail-image">
      ${
        isVideoProduct(product)
          ? `<video src="${product.image}" controls autoplay muted loop playsinline></video>`
          : `<img src="${product.image}" alt="${product.name}">`
      }
    </div>

    <div class="product-detail-info">
      <p class="section-small">${product.category || "Collection"}</p>

      <h1>${product.name}</h1>

      <h2>₹${product.price}</h2>

      <p class="product-description">${description}</p>

      <p class="stock-text"><b>Stock:</b> ${product.stock ?? "Available"}</p>

      ${
        isOut
          ? `<div class="stock-out">Out of Stock</div>`
          : `
            <label for="detailSize">Select Size</label>
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
      selectedSize,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  alert("Product added to cart.");
  window.location.href = "index.html";
}

window.addDetailProductToCart = addDetailProductToCart;

loadProduct();
