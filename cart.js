(function () {

    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

        const itemsContainer =
            document.getElementById("cart-items");

        const emptySection =
            document.getElementById("cart-empty");

        const contentSection =
            document.getElementById("cart-content");

        const itemsCount =
            document.getElementById("cart-items-count");

        const totalElement =
            document.getElementById("cart-total");

        const checkoutButton =
            document.getElementById("cart-checkout-button");

        const clearButton =
            document.getElementById("cart-clear-button");

        const message =
            document.getElementById("cart-message");


        let cart = [];


        /* ==================================================
           CHARGE PANIER
        ================================================== */

        function loadCart() {

            try {

                cart =
                    JSON.parse(
                        localStorage.getItem(
                            "macheya_cart"
                        )
                    ) || [];

                if (!Array.isArray(cart)) {
                    cart = [];
                }

            } catch (error) {

                console.error(
                    "Macheya Cart Error:",
                    error
                );

                cart = [];
            }

            renderCart();
        }


        /* ==================================================
           SAVE PANIER
        ================================================== */

        function saveCart() {

            localStorage.setItem(
                "macheya_cart",
                JSON.stringify(cart)
            );
        }


        /* ==================================================
           FORMAT PRI
        ================================================== */

        function money(value) {

            return (
                new Intl.NumberFormat("fr-FR")
                    .format(Number(value) || 0)
                + " HTG"
            );
        }


        /* ==================================================
           AFFICHAGE
        ================================================== */

        function renderCart() {

            if (!itemsContainer) return;

            itemsContainer.innerHTML = "";


            if (cart.length === 0) {

                if (emptySection) {
                    emptySection.hidden = false;
                }

                if (contentSection) {
                    contentSection.hidden = true;
                }

                if (itemsCount) {
                    itemsCount.textContent = "0";
                }

                if (totalElement) {
                    totalElement.textContent = "0 HTG";
                }

                return;
            }


            if (emptySection) {
                emptySection.hidden = true;
            }

            if (contentSection) {
                contentSection.hidden = false;
            }


            let total = 0;
            let quantityTotal = 0;


            cart.forEach(function (product, index) {

                const quantity =
                    Number(product.quantity) || 1;

                const price =
                    Number(product.price) || 0;

                const productTotal =
                    price * quantity;


                total += productTotal;

                quantityTotal += quantity;


                const article =
                    document.createElement("article");

                article.id =
                    "cart-item-" + product.id;

                article.className =
                    "cart-item";


                article.innerHTML = `

                    <div class="cart-item-image">

                        ${
                            product.image_url
                                ? `<img
                                    src="${escapeHtml(product.image_url)}"
                                    alt="${escapeHtml(product.name || "Pwodwi")}"
                                >`
                                : "🛍️"
                        }

                    </div>


                    <div class="cart-item-info">

                        <h3>
                            ${escapeHtml(
                                product.name ||
                                "Pwodwi san non"
                            )}
                        </h3>


                        <p>
                            ${money(price)}
                        </p>


                        <div class="cart-item-quantity">

                            <button
                                type="button"
                                data-action="minus"
                                data-index="${index}"
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
                            >
                                +
                            </button>

                        </div>


                        <strong>
                            ${money(productTotal)}
                        </strong>


                        <button
                            type="button"
                            data-action="remove"
                            data-index="${index}"
                        >
                            Retire
                        </button>

                    </div>

                `;


                itemsContainer.appendChild(article);

            });


            if (itemsCount) {
                itemsCount.textContent =
                    quantityTotal;
            }


            if (totalElement) {
                totalElement.textContent =
                    money(total);
            }


            addItemActions();

        }


        /* ==================================================
           ACTION PRODUWI
        ================================================== */

        function addItemActions() {

            const buttons =
                itemsContainer.querySelectorAll(
                    "[data-action]"
                );


            buttons.forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        const action =
                            button.dataset.action;


                        if (
                            !Number.isInteger(index) ||
                            !cart[index]
                        ) {
                            return;
                        }


                        if (action === "minus") {

                            const quantity =
                                Number(
                                    cart[index].quantity
                                ) || 1;


                            if (quantity > 1) {

                                cart[index].quantity =
                                    quantity - 1;

                            } else {

                                cart.splice(
                                    index,
                                    1
                                );

                            }

                        }


                        if (action === "plus") {

                            cart[index].quantity =
                                (
                                    Number(
                                        cart[index].quantity
                                    ) || 1
                                ) + 1;

                        }


                        if (action === "remove") {

                            cart.splice(
                                index,
                                1
                            );

                        }


                        saveCart();

                        renderCart();

                    }
                );

            });

        }


        /* ==================================================
           VIDE PANIER
        ================================================== */

        if (clearButton) {

            clearButton.addEventListener(
                "click",
                function () {

                    if (cart.length === 0) {
                        return;
                    }


                    const confirmed =
                        confirm(
                            "Èske ou sèten ou vle retire tout pwodwi yo nan panier la?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    cart = [];

                    saveCart();

                    renderCart();


                    if (message) {

                        message.textContent =
                            "Panier ou vid kounye a.";

                    }

                }
            );

        }


        /* ==================================================
           CHECKOUT
        ================================================== */

        if (checkoutButton) {

            checkoutButton.addEventListener(
                "click",
                function () {

                    if (cart.length === 0) {

                        alert(
                            "Panier ou vid."
                        );

                        return;
                    }


                    /*
                     * Pou kounye a checkout la
                     * itilize yon sèl pwodwi.
                     *
                     * Nou pran premye pwodwi a
                     * epi sove l nan menm sistèm
                     * checkout ki deja egziste a.
                     */

                    const product =
                        cart[0];


                    localStorage.setItem(
                        "macheya_checkout_product",
                        JSON.stringify({

                            id:
                                product.id,

                            name:
                                product.name,

                            price:
                                product.price,

                            image_url:
                                product.image_url || "",

                            seller_id:
                                product.seller_id || null,

                            quantity:
                                Number(
                                    product.quantity
                                ) || 1

                        })
                    );


                    window.location.href =
                        "checkout.html?product_id=" +
                        encodeURIComponent(
                            product.id
                        );

                }
            );

        }


        /* ==================================================
           ESCAPE HTML
        ================================================== */

        function escapeHtml(value) {

            return String(value || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        }


        /* ==================================================
           START
        ================================================== */

        loadCart();

    });

})();
