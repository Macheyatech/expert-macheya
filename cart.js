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
           LI PANIER
        ================================================== */

        function getCart() {

            const saved =
                localStorage.getItem("macheya_cart");

            if (!saved) {
                return [];
            }

            try {

                const parsed =
                    JSON.parse(saved);

                return Array.isArray(parsed)
                    ? parsed
                    : [];

            } catch (error) {

                console.error(
                    "Macheya: panier localStorage pa valid.",
                    error
                );

                return [];
            }
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
           MONEY
        ================================================== */

        function money(value) {

            return (
                new Intl.NumberFormat("fr-FR")
                    .format(Number(value) || 0)
                + " HTG"
            );

        }


        /* ==================================================
           ESCAPE
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
           AFFICHER PANIER
        ================================================== */

        function renderCart() {

            cart = getCart();

            console.log(
                "Macheya CART:",
                cart
            );


            if (!itemsContainer) {
                return;
            }


            itemsContainer.innerHTML = "";


            /* PANIER VID */

            if (cart.length === 0) {

                if (emptySection) {
                    emptySection.hidden = false;
                }

                if (contentSection) {
                    contentSection.hidden = false;
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


                article.className =
                    "cart-item";


                article.innerHTML = `

                    <div class="cart-item-image">

                        ${
                            product.image_url
                                ? `
                                    <img
                                        src="${escapeHtml(product.image_url)}"
                                        alt="${escapeHtml(product.name)}"
                                        style="width:100%;max-width:180px;height:150px;object-fit:cover;"
                                    >
                                  `
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


                        <div>

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


                        <br>


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


            addActions();

        }


        /* ==================================================
           ACTIONS
        ================================================== */

        function addActions() {

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


                        if (!cart[index]) {
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


                    if (
                        !confirm(
                            "Èske ou sèten ou vle vide panier la?"
                        )
                    ) {
                        return;
                    }


                    cart = [];

                    saveCart();

                    renderCart();

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

                    cart = getCart();


                    if (cart.length === 0) {

                        alert(
                            "Panier ou vid."
                        );

                        return;
                    }


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
           START
        ================================================== */

        renderCart();

    });

})();
