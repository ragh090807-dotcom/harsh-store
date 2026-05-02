import { db } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const productDetail = document.getElementById("productDetail");

let currentProduct = null;
let selectedImage = "";

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function getProductImages(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images;
  }

  if (product.image) {
    return [product.image];
  }

  return [];
}

function isVideoUrl(url) {
  const value = String(url || "").toLowerCase();

  return (
    value.includes(".mp4") ||
    value.includes(".webm") ||
    value.includes(".mov")
  );
}

function isVideoProduct(product) {
  const category = String(product.category || "").trim().toLowerCase();
  return category === "watch and buy" || isVideoUrl(product.image);
}

function cleanDescription(description) {
  if (!description || String(description).includes("http")) {
    return "Premium quality product designed for comfort, style and everyday confidence.";
  }

  return description;
}

function getSizes(product) {
  if (Array.isArray(product.sizes)) return product.sizes;

  if (typeof product.sizes === "string") {
    return product.sizes.split(",").map(size => size.trim()).filter(Boolean);
  }

  return [];
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

    if (!productSnap.exists()) {
      productDetail.innerHTML = "<p>Product not found.</p>";
      return;
    }

    currentProduct = {
      id: productSnap.id,
      ...productSnap.data()
    };

    const images = getProductImages(currentProduct);
    selectedImage = images[0] || "";

    displayProduct(currentProduct);

  } catch (error) {
    console.error(error);
    productDetail.innerHTML = "<p>Error loading product.</p>";
  }
}

function renderMainMedia(product) {
  if (isVideoProduct(product) || isVideoUrl(selectedImage)) {
    return `
      <video
        src="${selectedImage}"
        controls
        autoplay
        muted
        loop
        playsinline>
      </video>
    `;
  }

  return `<img src="${selectedImage}" alt="${product.name}">`;
}

function displayProduct(product) {
  const sizes = getSizes(product);
  const images = getProductImages(product);
  const sizeOptions = sizes.map(size => `<option value="${size}">${size}</option>`).join("");
  const isOut = Number(product.stock) <= 0;
  const description = cleanDescription(product.description);

  productDetail.innerHTML = `
    <div>
      <div class="product-detail-image">
        ${renderMainMedia(product)}
      </div>

      ${
        images.length > 1
          ? `
            <div class="product-thumbnails">
              ${images.map(img => `
                <button
                  class="${img === selectedImage ? "active-thumb" : ""}"
                  onclick="changeProductImage('${img}')">
                  ${
                    isVideoUrl(img)
                      ? `<video src="${img}" muted playsinline></video>`
                      : `<img src="${img}" alt="Product image">`
                  }
                </button>
              `).join("")}
            </div>
          `
          : ""
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

function changeProductImage(imageUrl) {
  selectedImage = imageUrl;
  displayProduct(currentProduct);
}

function addDetailProductToCart() {
  const selectedSize = document.getElementById("detailSize")?.value;

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
window.changeProductImage = changeProductImage;

loadProduct();
