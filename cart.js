(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

        const db = window.supabaseClient;

        const emptyCart =
            document.getElementById("emptyCart");

        const cartContent =
            document.getElementById("cartContent");

        const cartItems =
            document.getElementById("cartItems");

        const cartItemCount =
            document.getElementById("cartItemCount");

        const cartQuantity =
            document.getElementById("cartQuantity");

        const cartTotal =
            document.getElementById("cartTotal");

        const checkoutButton =
            document.getElementById("checkoutButton");

        let cart = loadCart();

        function loadCart() {
            try {
                const saved =
                    localStorage.getItem("macheya_cart");

                if (!saved) {
                    return [];
                }

                const parsed =
                    JSON.parse(saved);

                return Array.isArray(parsed)
                    ? parsed
                    : [];

            } catch (error) {
                console.error(
                    "Macheya Cart Load Error:",
                    error
                );

                return [];
            }
        }

        function saveCart() {
            localStorage.setItem(
                "macheya_cart",
                JSON.stringify(cart)
            );
        }

        function money(value) {
            const number =
                Number(value || 0);

            if (!Number.isFinite(number)) {
                return "0 HTG";
            }

            return (
                new Intl.NumberFormat("fr-FR")
                    .format(number)
                + " HTG"
            );
        }

        function escapeHTML(value) {
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function normalizeQuantity(value) {
            const quantity =
                Number(value || 1);

            if (!Number.isFinite(quantity) || quantity < 1) {
                return 1;
            }

            return Math.floor(quantity);
        }

        function getAddProductIdFromUrl() {
            const params =
                new URLSearchParams(window.location.search);

            return (
                params.get("add") ||
                params.get("product") ||
                params.get("product_id") ||
                params.get("id")
            );
        }

        function clearAddParamFromUrl() {
            const url =
                new URL(window.location.href);

            url.searchParams.delete("add");
            url.searchParams.delete("product");
            url.searchParams.delete("product_id");
            url.searchParams.delete("id");

            window.history.replaceState(
                {},
                document.title,
                url.pathname + url.search
            );
        }

        async function fetchPublicProductsByIds(ids) {
            if (!db || !ids.length) {
                return [];
            }

            const { data, error } =
                await db
                    .from("products_public")
                    .select(`
                        id,
                        name,
                        description,
                        price,
                        category,
                        seller_id,
                        image_url,
                        product_type,
                        stock,
                        is_active,
                        created_at
                    `)
                    .in("id", ids);

            if (error) {
                console.error(
                    "MACHEYA CART PRODUCTS ERROR:",
                    error
                );

                return [];
            }

            return data || [];
        }

        async function addProductFromUrlIfNeeded() {
            const productId =
                getAddProductIdFromUrl();

            if (!productId) {
                return;
            }

            if (!db) {
                alert(
                    "Macheya pa kapab verifye pwodwi a kounye a."
                );

                clearAddParamFromUrl();
                return;
            }

            const { data: product, error } =
                await db
                    .from("products_public")
                    .select(`
                        id,
                        name,
                        price,
                        seller_id,
                        image_url,
                        product_type,
                        stock,
                        is_active
                    `)
                    .eq("id", productId)
                    .maybeSingle();

            if (error || !product) {
                console.error(
                    "MACHEYA ADD CART ERROR:",
                    error
                );

                alert(
                    "Pwodwi sa a pa disponib ankò."
                );

                clearAddParamFromUrl();
                return;
            }

            if (
                product.stock !== null &&
                Number(product.stock) <= 0
            ) {
                alert(
                    "Pwodwi sa a pa gen stock disponib."
                );

                clearAddParamFromUrl();
                return;
            }

            const existingIndex =
                cart.findIndex(function (item) {
                    return item.id === product.id;
                });

            if (existingIndex >= 0) {
                const currentQuantity =
                    normalizeQuantity(
                        cart[existingIndex].quantity
                    );

                const nextQuantity =
                    currentQuantity + 1;

                if (
                    product.stock !== null &&
                    nextQuantity > Number(product.stock)
                ) {
                    alert(
                        "Ou pa ka ajoute plis pase stock ki disponib la."
                    );
                } else {
                    cart[existingIndex].quantity =
                        nextQuantity;
                }

            } else {
                cart.push({
                    id: product.id,
                    name: product.name || "",
                    price: Number(product.price || 0),
                    image_url: product.image_url || "",
                    seller_id: product.seller_id || null,
                    product_type: product.product_type || null,
                    stock: product.stock,
                    quantity: 1
                });
            }

            saveCart();
            clearAddParamFromUrl();
        }

        async function refreshCartFromBackend() {
            cart =
                loadCart();

            if (!cart.length || !db) {
                return;
            }

            const ids =
                cart
                    .map(function (item) {
                        return item.id;
                    })
                    .filter(Boolean);

            if (!ids.length) {
                cart = [];
                saveCart();
                return;
            }

            const products =
                await fetchPublicProductsByIds(ids);

            const productMap =
                new Map();

            products.forEach(function (product) {
                productMap.set(product.id, product);
            });

            const refreshedCart = [];

            cart.forEach(function (item) {
                const product =
                    productMap.get(item.id);

                if (!product) {
                    return;
                }

                const stock =
                    product.stock;

                let quantity =
                    normalizeQuantity(item.quantity);

                if (
                    stock !== null &&
                    Number(stock) <= 0
                ) {
                    return;
                }

                if (
                    stock !== null &&
                    quantity > Number(stock)
                ) {
                    quantity =
                        Number(stock);
                }

                refreshedCart.push({
                    id: product.id,
                    name: product.name || "",
                    price: Number(product.price || 0),
                    image_url: product.image_url || "",
                    seller_id: product.seller_id || null,
                    product_type: product.product_type || null,
                    stock: product.stock,
                    quantity: quantity
                });
            });

            cart =
                refreshedCart;

            saveCart();
        }

        function renderCart() {
            cart =
                loadCart();

            if (!cart.length) {
                if (emptyCart) {
                    emptyCart.hidden = false;
                }

                if (cartContent) {
                    cartContent.hidden = true;
                }

                updateSummary();
                return;
            }

            if (emptyCart) {
                emptyCart.hidden = true;
            }

            if (cartContent) {
                cartContent.hidden = false;
            }

            if (!cartItems) {
                return;
            }

            cartItems.innerHTML = "";

            cart.forEach(function (item, index) {
                const quantity =
                    normalizeQuantity(item.quantity);

                const price =
                    Number(item.price || 0);

                const itemTotal =
                    price * quantity;

                const article =
                    document.createElement("article");

                article.className =
                    "cart-item";

                const image =
                    document.createElement("div");

                image.className =
                    "product-image";

                if (item.image_url) {
                    image.style.backgroundImage =
                        `url("${item.image_url}")`;
                } else {
                    image.textContent =
                        "🛍️";
                }

                const info =
                    document.createElement("div");

                info.className =
                    "item-info";

                const stockLabel =
                    item.stock !== null &&
                    item.stock !== undefined
                        ? `<small>Stock: ${escapeHTML(item.stock)}</small>`
                        : "";

                info.innerHTML = `
                    <h3>
                        ${escapeHTML(item.name || "Pwodwi san non")}
                    </h3>

                    <div class="item-price">
                        ${money(price)}
                    </div>

                    ${stockLabel}

                    <div class="quantity-controls">
                        <button
                            type="button"
                            data-action="minus"
                            data-index="${index}"
                            aria-label="Diminye kantite"
                        >
                            −
                        </button>

                        <span>
                            ${quantity}
                        </span>

                        <button
                            type="button"
                            data-action="plus"
                            data-index="${index}"
                            aria-label="Ogmante kantite"
                        >
                            +
                        </button>
                    </div>
                `;

                const right =
                    document.createElement("div");

                right.className =
                    "item-right";

                right.innerHTML = `
                    <div>
                        <div class="item-total">
                            ${money(itemTotal)}
                        </div>

                        <button
                            type="button"
                            class="buy-single-button"
                            data-action="buy"
                            data-index="${index}"
                        >
                            Achte kounye a
                        </button>

                        <button
                            type="button"
                            class="remove-button"
                            data-action="remove"
                            data-index="${index}"
                        >
                            Retire
                        </button>
                    </div>
                `;

                article.appendChild(image);
                article.appendChild(info);
                article.appendChild(right);

                cartItems.appendChild(article);
            });

            updateSummary();
        }

        function updateSummary() {
            let totalProducts = 0;
            let totalQuantity = 0;
            let totalPrice = 0;

            cart.forEach(function (item) {
                const quantity =
                    normalizeQuantity(item.quantity);

                const price =
                    Number(item.price || 0);

                totalProducts += 1;
                totalQuantity += quantity;
                totalPrice += price * quantity;
            });

            if (cartItemCount) {
                cartItemCount.textContent =
                    totalProducts;
            }

            if (cartQuantity) {
                cartQuantity.textContent =
                    totalQuantity;
            }

            if (cartTotal) {
                cartTotal.textContent =
                    money(totalPrice);
            }
        }

        function updateQuantity(index, nextQuantity) {
            if (!cart[index]) {
                return;
            }

            const stock =
                cart[index].stock;

            let quantity =
                normalizeQuantity(nextQuantity);

            if (
                stock !== null &&
                stock !== undefined &&
                quantity > Number(stock)
            ) {
                alert(
                    "Ou pa ka depase stock ki disponib la."
                );

                quantity =
                    Number(stock);
            }

            cart[index].quantity =
                Math.max(1, quantity);

            saveCart();
            renderCart();
        }

        if (cartItems) {
            cartItems.addEventListener(
                "click",
                function (event) {
                    const button =
                        event.target.closest(
                            "button[data-action]"
                        );

                    if (!button) {
                        return;
                    }

                    const action =
                        button.dataset.action;

                    const index =
                        Number(button.dataset.index);

                    if (
                        !Number.isInteger(index) ||
                        !cart[index]
                    ) {
                        return;
                    }

                    if (action === "plus") {
                        const current =
                            normalizeQuantity(
                                cart[index].quantity
                            );

                        updateQuantity(
                            index,
                            current + 1
                        );

                        return;
                    }

                    if (action === "minus") {
                        const current =
                            normalizeQuantity(
                                cart[index].quantity
                            );

                        updateQuantity(
                            index,
                            Math.max(1, current - 1)
                        );

                        return;
                    }

                    if (action === "remove") {
                        cart.splice(index, 1);
                        saveCart();
                        renderCart();
                        return;
                    }

                    if (action === "buy") {
                        buySingleProduct(cart[index]);
                    }
                }
            );
        }

        function buySingleProduct(product) {
            if (!product || !product.id) {
                alert(
                    "Pwodwi sa a pa gen ID."
                );

                return;
            }

            const checkoutProduct = {
                id: product.id,
                name: product.name || "",
                price: Number(product.price || 0),
                image_url: product.image_url || "",
                seller_id: product.seller_id || null,
                product_type: product.product_type || null,
                stock: product.stock,
                quantity: normalizeQuantity(product.quantity)
            };

            localStorage.setItem(
                "macheya_checkout_product",
                JSON.stringify(checkoutProduct)
            );

            window.location.href =
                "checkout.html?product=" +
                encodeURIComponent(product.id);
        }

        if (checkoutButton) {
            checkoutButton.addEventListener(
                "click",
                function () {
                    cart =
                        loadCart();

                    if (!cart.length) {
                        alert(
                            "Panier ou vid."
                        );

                        return;
                    }

                    localStorage.setItem(
                        "macheya_checkout_cart",
                        JSON.stringify(cart)
                    );

                    window.location.href =
                        "checkout.html?cart=all";
                }
            );
        }

        window.addEventListener(
            "storage",
            function (event) {
                if (event.key === "macheya_cart") {
                    cart =
                        loadCart();

                    renderCart();
                }
            }
        );

        async function start() {
            await addProductFromUrlIfNeeded();
            await refreshCartFromBackend();
            renderCart();
        }

        start();

    });

})();
