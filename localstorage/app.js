const STORAGE_KEY = "sari_store_data";

const defaultProducts = [
  { id: 1, name: "Rice 5kg", category: "Groceries", quantity: 25, price: 220, reorderLevel: 8 },
  { id: 2, name: "Coke 1L", category: "Beverage", quantity: 15, price: 65, reorderLevel: 5 },
  { id: 3, name: "Instant Noodles", category: "Snacks", quantity: 35, price: 18, reorderLevel: 10 },
  { id: 4, name: "Soap", category: "Household", quantity: 12, price: 42, reorderLevel: 5 },
  { id: 5, name: "Coffee", category: "Beverage", quantity: 20, price: 28, reorderLevel: 6 },
  { id: 6, name: "Eggs", category: "Groceries", quantity: 18, price: 12, reorderLevel: 7 }
];

let products = loadProducts();
let cart = [];
let salesHistory = loadSales();

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(amount || 0);
};

function loadProducts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [...defaultProducts];
  try {
    const parsed = JSON.parse(saved);
    return parsed.products || [...defaultProducts];
  } catch {
    return [...defaultProducts];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, sales: salesHistory }));
}

function loadSales() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return parsed.sales || [];
  } catch {
    return [];
  }
}

function renderProductOptions() {
  const select = document.getElementById("productSelect");
  const priceSelect = document.getElementById("priceProductSelect");

  select.innerHTML = "<option value=''>Select product</option>" + products.map(item => {
    return `<option value="${item.id}">${item.name} - ${formatCurrency(item.price)}</option>`;
  }).join("");

  priceSelect.innerHTML = "<option value=''>Select product</option>" + products.map(item => {
    return `<option value="${item.id}">${item.name}</option>`;
  }).join("");

  priceSelect.onchange = () => {
    const product = products.find(item => item.id == priceSelect.value);
    document.getElementById("currentPrice").value = product ? formatCurrency(product.price) : "";
  };
}

function renderInventoryTable() {
  const search = document.getElementById("searchInventory").value.toLowerCase();
  const table = document.getElementById("inventoryTable");
  const filtered = products.filter(product => {
    return product.name.toLowerCase().includes(search) || product.category.toLowerCase().includes(search);
  });

  if (!filtered.length) {
    table.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;">No products found</td></tr>`;
    return;
  }

  table.innerHTML = filtered.map(product => {
    let statusClass = "in-stock";
    let statusText = "In Stock";

    if (product.quantity <= 0) {
      statusClass = "out-of-stock";
      statusText = "Out of Stock";
    } else if (product.quantity <= product.reorderLevel) {
      statusClass = "low-stock";
      statusText = "Low Stock";
    }

    return `
      <tr>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${product.quantity}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${product.reorderLevel}</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
        <td>
          <button class="secondary-btn" data-edit-id="${product.id}">Edit</button>
          <button class="secondary-btn" data-delete-id="${product.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll("[data-delete-id]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.deleteId);
      deleteProduct(id);
    });
  });

  document.querySelectorAll("[data-edit-id]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.editId);
      editProduct(id);
    });
  });
}

function addToCart() {
  const productId = Number(document.getElementById("productSelect").value);
  const qty = Number(document.getElementById("quantityInput").value);

  if (!productId || qty <= 0) {
    alert("Select a product and valid quantity.");
    return;
  }

  const product = products.find(item => item.id === productId);
  if (!product) return;

  if (product.quantity < qty) {
    alert("Not enough stock available.");
    return;
  }

  const existing = cart.find(item => item.productId === productId);

  if (existing) {
    existing.quantity += qty;
    existing.total = existing.quantity * existing.price;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      quantity: qty,
      price: product.price,
      total: product.price * qty
    });
  }

  renderCart();
}

function renderCart() {
  const tbody = document.getElementById("cartItems");

  if (!cart.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;">No items in cart</td></tr>`;
    updateTotals();
    return;
  }

  tbody.innerHTML = cart.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${formatCurrency(item.total)}</td>
      <td><button class="secondary-btn" data-remove-id="${item.productId}">Remove</button></td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-remove-id]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.removeId);
      cart = cart.filter(item => item.productId !== id);
      renderCart();
    });
  });

  updateTotals();
}

function updateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountPercent = Number(document.getElementById("discountPercent").value || 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const grandTotal = subtotal - discountAmount;

  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("discountAmount").textContent = formatCurrency(discountAmount);
  document.getElementById("grandTotal").textContent = formatCurrency(grandTotal);
}

function clearCart() {
  cart = [];
  document.getElementById("discountPercent").value = 0;
  renderCart();
}

function completeSale() {
  if (!cart.length) {
    alert("Cart is empty.");
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountPercent = Number(document.getElementById("discountPercent").value || 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const grandTotal = subtotal - discountAmount;

  salesHistory.push({
    id: Date.now(),
    date: new Date().toISOString(),
    subtotal,
    discount: discountAmount,
    total: grandTotal,
    items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))
  });

  cart.forEach(item => {
    const product = products.find(prod => prod.id === item.productId);
    if (product) {
      product.quantity -= item.quantity;
    }
  });

  saveProducts();
  clearCart();
  renderProductOptions();
  renderInventoryTable();
  generateReport();
  alert(`Sale completed! Total: ${formatCurrency(grandTotal)}`);
}

function deleteProduct(id) {
  products = products.filter(item => item.id !== id);
  saveProducts();
  renderProductOptions();
  renderInventoryTable();
}

function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  const name = prompt("Edit product name", product.name);
  if (name === null) return;

  const category = prompt("Edit category", product.category);
  if (category === null) return;

  const quantity = Number(prompt("Edit quantity", product.quantity));
  const price = Number(prompt("Edit price", product.price));
  const reorderLevel = Number(prompt("Edit reorder level", product.reorderLevel));

  if (!name.trim() || !category.trim() || Number.isNaN(quantity) || Number.isNaN(price) || Number.isNaN(reorderLevel)) {
    alert("Invalid value entered.");
    return;
  }

  product.name = name.trim();
  product.category = category.trim();
  product.quantity = quantity;
  product.price = price;
  product.reorderLevel = reorderLevel;

  saveProducts();
  renderProductOptions();
  renderInventoryTable();
}

function addProduct(event) {
  event.preventDefault();

  const productName = document.getElementById("productName").value.trim();
  const productCategory = document.getElementById("productCategory").value.trim();
  const qty = Number(document.getElementById("productQty").value);
  const price = Number(document.getElementById("productPrice").value);
  const reorderLevel = Number(document.getElementById("productReorder").value);

  if (!productName || !productCategory || Number.isNaN(qty) || Number.isNaN(price) || Number.isNaN(reorderLevel)) {
    alert("Please fill all fields correctly.");
    return;
  }

  products.push({
    id: Date.now(),
    name: productName,
    category: productCategory,
    quantity: qty,
    price,
    reorderLevel
  });

  saveProducts();
  renderProductOptions();
  renderInventoryTable();
  document.getElementById("productForm").reset();
  document.getElementById("productModal").classList.add("hidden");
}

function updatePrice() {
  const productId = Number(document.getElementById("priceProductSelect").value);
  const newPrice = Number(document.getElementById("newPriceInput").value);

  if (!productId || Number.isNaN(newPrice) || newPrice < 0) {
    alert("Select a valid product and price.");
    return;
  }

  const product = products.find(item => item.id === productId);
  if (!product) return;

  product.price = newPrice;
  saveProducts();
  renderProductOptions();
  renderInventoryTable();
  document.getElementById("currentPrice").value = formatCurrency(product.price);
  document.getElementById("newPriceInput").value = "";
}

function generateReport() {
  const reportType = document.getElementById("reportType").value;
  const startDate = document.getElementById("reportStartDate").value;
  const endDate = document.getElementById("reportEndDate").value;

  let filtered = [...salesHistory];

  if (startDate) {
    filtered = filtered.filter(item => new Date(item.date) >= new Date(startDate));
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(item => new Date(item.date) <= end);
  }

  if (!filtered.length) {
    document.getElementById("reportOutput").innerHTML = "<p>No sales found for the selected date range.</p>";
    return;
  }

  const totalSales = filtered.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = filtered.reduce((sum, sale) => sum + sale.items.reduce((acc, item) => acc + item.quantity, 0), 0);

  const rows = filtered.map(sale => {
    const summary = sale.items.map(item => `${item.name} (${item.quantity})`).join(", ");
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${new Date(sale.date).toLocaleString()}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${summary}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${formatCurrency(sale.total)}</td>
      </tr>
    `;
  }).join("");

  document.getElementById("reportOutput").innerHTML = `
    <h3>${reportType.toUpperCase()} report</h3>
    <p><strong>Total Sales:</strong> ${formatCurrency(totalSales)}</p>
    <p><strong>Total Items Sold:</strong> ${totalItems}</p>

    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Date</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Items</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function printReceipt() {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discount = Number(document.getElementById("discountPercent").value || 0);
  const discountAmount = subtotal * (discount / 100);
  const grandTotal = subtotal - discountAmount;

  const receiptWindow = window.open("", "_blank", "width=400,height=800");
  receiptWindow.document.write(`
    <html>
      <head>
        <title>Sari-Sari Store Receipt</title>
        <style>
          body { font-family: Arial; padding: 24px; }
          h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border-bottom: 1px solid #ddd; }
          .summary { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h2>Sari-Sari Store</h2>
        <p>${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="summary">
          <p>Subtotal: ${formatCurrency(subtotal)}</p>
          <p>Discount: ${formatCurrency(discountAmount)}</p>
          <p><strong>Grand Total: ${formatCurrency(grandTotal)}</strong></p>
        </div>
      </body>
    </html>
  `);

  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
}

document.addEventListener("DOMContentLoaded", () => {
  renderProductOptions();
  renderInventoryTable();
  renderCart();

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(panel => panel.classList.remove("active"));

      button.classList.add("active");
      const section = button.dataset.section;
      document.getElementById(section).classList.add("active");
    });
  });

  document.getElementById("addToCartBtn").addEventListener("click", addToCart);
  document.getElementById("completeSaleBtn").addEventListener("click", completeSale);
  document.getElementById("clearCartBtn").addEventListener("click", clearCart);
  document.getElementById("discountPercent").addEventListener("input", updateTotals);
  document.getElementById("searchInventory").addEventListener("input", renderInventoryTable);

  document.getElementById("addProductBtn").addEventListener("click", () => {
    document.getElementById("productModal").classList.remove("hidden");
  });

  document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("productModal").classList.add("hidden");
  });

  document.getElementById("productForm").addEventListener("submit", addProduct);
  document.getElementById("updatePriceBtn").addEventListener("click", updatePrice);
  document.getElementById("generateReportBtn").addEventListener("click", generateReport);
  document.getElementById("printReceiptBtn").addEventListener("click", printReceipt);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  document.getElementById("reportStartDate").value = firstDay.toISOString().split("T")[0];
  document.getElementById("reportEndDate").value = lastDay.toISOString().split("T")[0];

  generateReport();
});
