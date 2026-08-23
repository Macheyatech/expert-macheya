(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

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


        /* =========================
           LOAD CART
        ========================= */

        function loadCart() {

            try {

                const saved =
                    localStorage.getItem(
                        "macheya_cart"
                    );

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


        /* =========================
           SAVE CART
        ========================= */

        function saveCart() {

            localStorage.setItem(
                "macheya_cart",
                JSON.stringify(cart)
            );
        }


        /* =========================
           MONEY
        ========================= */

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


        /* =========================
           ESCAPE HTML
        ========================= */

        function escapeHTML(value) {

            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }


        /* =========================
           RENDER CART
        ========================= */

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
                    Math.max(
                        1,
                        Number(item.quantity || 1)
                    );

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


                info.innerHTML = `

                    <h3>
                        ${escapeHTML(
                            item.name ||
                            "Pwodwi san non"
                        )}
                    </h3>

                    <div class="item-price">
                        ${money(price)}
                    </div>

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


        /* =========================
           SUMMARY
        ========================= */

        function updateSummary() {

            let totalProducts = 0;
            let totalQuantity = 0;
            let totalPrice = 0;


            cart.forEach(function (item) {

                const quantity =
                    Math.max(
                        1,
                        Number(item.quantity || 1)
                    );

                const price =
                    Number(item.price || 0);


                totalProducts += 1;

                totalQuantity += quantity;

                totalPrice +=
                    price * quantity;

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


        /* =========================
           CART ACTIONS
        ========================= */

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
                        Number(
                            button.dataset.index
                        );


                    if (
                        !Number.isInteger(index) ||
                        !cart[index]
                    ) {
                        return;
                    }


                    /* PLUS */

                    if (action === "plus") {

                        cart[index].quantity =
                            Math.max(
                                1,
                                Number(
                                    cart[index].quantity || 1
                                )
                            ) + 1;

                        saveCart();
                        renderCart();

                        return;
                    }


                    /* MINUS */

                    if (action === "minus") {

                        const current =
                            Math.max(
                                1,
                                Number(
                                    cart[index].quantity || 1
                                )
                            );


                        if (current > 1) {

                            cart[index].quantity =
                                current - 1;

                        }

                        saveCart();
                        renderCart();

                        return;
                    }


                    /* REMOVE */

                    if (action === "remove") {

                        cart.splice(
                            index,
                            1
                        );

                        saveCart();
                        renderCart();

                        return;
                    }


                    /* BUY SINGLE */

                    if (action === "buy") {

                        buySingleProduct(
                            cart[index]
                        );

                    }

                }
            );
        }


        /* =========================
           BUY SINGLE PRODUCT
        ========================= */

        function buySingleProduct(product) {

            if (!product || !product.id) {

                alert(
                    "Pwodwi sa a pa gen ID."
                );

                return;
            }


            const checkoutProduct = {

                id:
                    product.id,

                name:
                    product.name || "",

                price:
                    Number(
                        product.price || 0
                    ),

                image_url:
                    product.image_url || "",

                seller_id:
                    product.seller_id ||
                    product.identifiant_vendeur ||
                    null,

                quantity:
                    Math.max(
                        1,
                        Number(
                            product.quantity || 1
                        )
                    )
            };


            localStorage.setItem(
                "macheya_checkout_product",
                JSON.stringify(
                    checkoutProduct
                )
            );


            window.location.href =
                "checkout.html?product_id=" +
                encodeURIComponent(
                    product.id
                );
        }


        /* =========================
           BUY ALL CART
        ========================= */

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


                    /*
                     * Nou sove tout panier an
                     * pou checkout la ka itilize l.
                     */

                    localStorage.setItem(
                        "macheya_checkout_cart",
                        JSON.stringify(cart)
                    );


                    /*
                     * Pou kounye a nou ale
                     * sou checkout la.
                     *
                     * checkout.js ap bezwen
                     * sipòte plizyè pwodwi pou
                     * bouton sa a pase tout
                     * panier la ansanm.
                     */

                    window.location.href =
                        "checkout.html?cart=all";

                }
            );
        }


        /* =========================
           STORAGE UPDATE
        ========================= */

        window.addEventListener(
            "storage",
            function (event) {

                if (
                    event.key ===
                    "macheya_cart"
                ) {

                    cart =
                        loadCart();

                    renderCart();
                }
            }
        );


        /* =========================
           START
        ========================= */

        renderCart();

    });

})();
