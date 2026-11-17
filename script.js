const productContainer = document.getElementById("product-container");

let products = [];
let cart = JSON.parse(localStorage.getItem("monitorShopCart")) || [];

function saveCart() {
    localStorage.setItem("monitorShopCart", JSON.stringify(cart));
}

function formatPrice(price) {
    return new Intl.NumberFormat("uk-UA").format(price) + " ₴";
}

function createPageLayout(title) {
    document.title = title;

    productContainer.insertAdjacentHTML("beforebegin", `
        <header class="header">
            <a class="logo" href="#" id="home-link">${title}</a>
            <button class="cart-button" id="open-cart" type="button">
                Корзина <span class="cart-count" id="cart-count">0</span>
            </button>
        </header>
        <main class="main-content">
            <section class="intro">
                <p class="eyebrow">Техніка для роботи та розваг</p>
                <h1>${title}</h1>
                <p>Обирайте монітор, який підходить саме вам.</p>
            </section>
        </main>
    `);

    productContainer.classList.add("products-grid");

    productContainer.insertAdjacentHTML("afterend", `
        <div class="cart-overlay" id="cart-overlay">
            <section class="cart-panel" aria-label="Корзина товарів">
                <div class="cart-header">
                    <h2>Ваша корзина</h2>
                    <button class="close-cart" id="close-cart" type="button" aria-label="Закрити">×</button>
                </div>
                <div id="cart-items"></div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Загальна сума:</span>
                        <strong id="cart-total">0 ₴</strong>
                    </div>
                    <button class="checkout-button" id="checkout-button" type="button">Оплатити</button>
                    <button class="back-button" id="back-to-shop" type="button">Повернутись до покупок</button>
                </div>
            </section>
        </div>
        <div class="toast" id="toast"></div>
        <footer class="footer">© 2026 Магазин моніторів</footer>
    `);

    document.getElementById("open-cart").addEventListener("click", openCart);
    document.getElementById("close-cart").addEventListener("click", closeCart);
    document.getElementById("back-to-shop").addEventListener("click", closeCart);
    document.getElementById("checkout-button").addEventListener("click", checkout);
    document.getElementById("home-link").addEventListener("click", (event) => {
        event.preventDefault();
        closeCart();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function renderProducts() {
    productContainer.innerHTML = products.map(product => `
        <article class="product-card">
            <div class="product-image-wrap">
                <img
                    class="product-image"
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                    onerror="this.src='https://placehold.co/600x400?text=Monitor'"
                >
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h2>${product.name}</h2>
                <p class="product-description">${product.description}</p>
                <div class="product-bottom">
                    <strong class="product-price">${formatPrice(product.price)}</strong>
                    <button class="add-button" type="button" data-product-id="${product.id}">
                        До корзини
                    </button>
                </div>
            </div>
        </article>
    `).join("");

    productContainer.querySelectorAll(".add-button").forEach(button => {
        button.addEventListener("click", () => {
            const productId = Number(button.dataset.productId);
            addToCart(productId);
        });
    });
}

function addToCart(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) {
        showToast("Товар не знайдено.");
        return;
    }

    const quantityInput = prompt(`Введіть кількість товару «${product.name}»:`, "1");

    if (quantityInput === null) return;

    const quantity = Number(quantityInput);

    if (!Number.isInteger(quantity) || quantity < 1) {
        showToast("Введіть цілу кількість, більшу за 0.");
        return;
    }

    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }

    saveCart();
    updateCart();
    showToast("Товар успішно додано до корзини!");
}

function updateCart() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    document.getElementById("cart-count").textContent = count;
    document.getElementById("cart-total").textContent = formatPrice(total);

    const cartItems = document.getElementById("cart-items");

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Корзина порожня.</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <article class="cart-item">
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p>${formatPrice(item.price)} за одиницю</p>
                    <strong>${formatPrice(item.price * item.quantity)}</strong>
                </div>
                <div class="cart-item-actions">
                    <label>
                        Кількість
                        <input
                            class="quantity-input"
                            type="number"
                            min="1"
                            step="1"
                            value="${item.quantity}"
                            data-id="${item.id}"
                            aria-label="Кількість товару ${item.name}"
                        >
                    </label>
                    <button class="remove-button" type="button" data-id="${item.id}">
                        Видалити
                    </button>
                </div>
            </article>
        `).join("");

        cartItems.querySelectorAll(".quantity-input").forEach(input => {
            input.addEventListener("change", () => {
                changeQuantity(Number(input.dataset.id), Number(input.value));
            });
        });

        cartItems.querySelectorAll(".remove-button").forEach(button => {
            button.addEventListener("click", () => {
                removeFromCart(Number(button.dataset.id));
            });
        });
    }

    document.getElementById("checkout-button").disabled = cart.length === 0;
}

function changeQuantity(productId, quantity) {
    if (!Number.isInteger(quantity) || quantity < 1) {
        showToast("Кількість має бути цілим числом від 1.");
        updateCart();
        return;
    }

    const item = cart.find(product => product.id === productId);

    if (item) {
        item.quantity = quantity;
        saveCart();
        updateCart();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCart();
    showToast("Товар видалено з корзини.");
}

function openCart() {
    document.getElementById("cart-overlay").classList.add("active");
    updateCart();
}

function closeCart() {
    document.getElementById("cart-overlay").classList.remove("active");
}

function checkout() {
    if (cart.length === 0) {
        showToast("Корзина порожня.");
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const confirmed = confirm(`Підтвердити демонстраційне оформлення замовлення на суму ${formatPrice(total)}?`);

    if (!confirmed) return;

    cart = [];
    saveCart();
    updateCart();
    closeCart();
    showToast("Дякуємо за замовлення! Демонстраційну оплату виконано.");
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

async function loadProducts() {
    try {
        const response = await fetch("./products.json");

        if (!response.ok) {
            throw new Error(`Помилка завантаження JSON: ${response.status}`);
        }

        const data = await response.json();

        if (!data.title || !Array.isArray(data.products) || data.products.length < 6) {
            throw new Error("Файл JSON має містити заголовок і щонайменше 6 товарів.");
        }

        products = data.products;
        createPageLayout(data.title);
        renderProducts();
        updateCart();
    } catch (error) {
        console.error(error);
        productContainer.innerHTML = `
            <div class="load-error">
                <h2>Не вдалося завантажити товари</h2>
                <p>Перевірте наявність файлу products.json та правильність його розміщення.</p>
                <p>Для локального запуску відкрийте сторінку через Live Server.</p>
            </div>
        `;
    }
}

loadProducts();
