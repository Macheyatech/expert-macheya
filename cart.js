(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

        const emptyCart = document.getElementById("emptyCart");
        const cartContent = document.getElementById("cartContent");
        const cartItems = document.getElementById("cartItems");

        const cartItemCount =
            document.getElementById("cartItemCount");

        const cartQuantity =
            document.getElementById("cartQuantity");

        const cartTotal =
            document.getElementById("cartTotal");

        const checkoutButton =
            document.getElementById("checkoutButton");


        /* =========================
           LOAD CART
        ========================= */

        function getCart() {

            try {

                const savedCart =
                    localStorage.getItem("macheya_cart");

                if (!savedCart) {
                    return [];
                }

                const cart = JSON.parse(savedCart);

                return Array.isArray(cart)
                    ? cart
                    : [];

            } catch (error) {

                console.error(
                    "Macheya Cart Error:",
                    error
                );

                return [];
            }
        }


        /* =========================
           SAVE CART
        ========================= */

        function saveCart(cart) {

            localStorage.setItem(
                "macheya_cart",
                JSON.stringify(cart)
            );
        }


        /* =========================
           FORMAT PRICE
        ========================= */

        function formatPrice(value) {

            const number = Number(value);

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
           DISPLAY CART
        ========================= */

        function renderCart() {

            const cart = getCart();

            cartItems.innerHTML = "";

            if (cart.length === 0) {

                emptyCart.hidden = false;
                cartContent.hidden = true;

                updateSummary([]);

                return;
            }


            emptyCart.hidden = true;
            cartContent.hidden = false;


            cart.forEach(function (product, index) {

                const quantity =
                    Math.max(
                        1,
                        Number(product.quantity) || 1
                    );

                const productPrice =
                    Number(product.price) || 0;

                const productTotal =
                    productPrice * quantity;


                const item =
                    document.createElement("article");

                item.className = "cart-item";


                /* =========================
                   IMAGE
                ========================= */

                const image =
                    document.createElement("div");

                image.className =
                    "product-image";


                if (product.image_url) {

                    image.style.backgroundImage =
                        `url("${product.image_url}")`;

                } else {

                    image.textContent = "🛍️";
                }


                /* =========================
                   INFORMATION
                ========================= */

                const info =
                    document.createElement("div");

                info.className = "item-info";


                const title =
                    document.createElement("h3");

                title.textContent =
                    product.name ||
                    "Pwodwi san non";


                const price =
                    document.createElement("div");

                price.className =
                    "item-price";

                price.textContent =
                    formatPrice(productPrice);


                /* =========================
                   QUANTITY
                ========================= */

                const quantityControls =
                    document.createElement("div");

                quantityControls.className =
                    "quantity-controls";


                const decrease =
                    document.createElement("button");

                decrease.type = "button";
                decrease.textContent = "−";
                decrease.setAttribute(
                    "aria-label",
                    "Diminye kantite"
                );


                const quantityDisplay =
                    document.createElement("span");

                quantityDisplay.textContent =
                    quantity;


                const increase =
                    document.createElement("button");

                increase.type = "button";
                increase.textContent = "+";
                increase.setAttribute(
                    "aria-label",
                    "Ogmante kantite"
                );


                decrease.addEventListener(
                    "click",
                    function () {

                        changeQuantity(
                            index,
                            -1
                        );
                    }
                );


                increase.addEventListener(
                    "click",
                    function () {

                        changeQuantity(
                            index,
                            1
                        );
                    }
                );


                quantityControls.appendChild(
                    decrease
                );

                quantityControls.appendChild(
                    quantityDisplay
                );

                quantityControls.appendChild(
                    increase
                );


                info.appendChild(title);
                info.appendChild(price);
                info.appendChild(quantityControls);


                /* =========================
                   RIGHT SIDE
                ========================= */

                const right =
                    document.createElement("div");

                right.className =
                    "item-right";


                const total =
                    document.createElement("div");

                total.className =
                    "item-total";

                total.textContent =
                    formatPrice(productTotal);


                const remove =
                    document.createElement("button");

                remove.type = "button";

                remove.className =
                    "remove-button";

                remove.textContent =
                    "Retire";


                remove.addEventListener(
                    "click",
                    function () {

                        removeProduct(index);
                    }
                );


                right.appendChild(total);
                right.appendChild(remove);


                /* =========================
                   BUILD ITEM
                ========================= */

                item.appendChild(image);
                item.appendChild(info);
                item.appendChild(right);


                cartItems.appendChild(item);

            });


            updateSummary(cart);
        }


        /* =========================
           CHANGE QUANTITY
        ========================= */

        function changeQuantity(
            index,
            change
        ) {

            const cart = getCart();

            if (!cart[index]) {
                return;
            }


            let quantity =
                Number(cart[index].quantity) || 1;


            quantity += change;


            if (quantity <= 0) {

                cart.splice(index, 1);

            } else {

                cart[index].quantity =
                    quantity;
            }


            saveCart(cart);

            renderCart();
        }


        /* =========================
           REMOVE PRODUCT
        ========================= */

        function removeProduct(index) {

            const cart = getCart();

            if (!cart[index]) {
                return;
            }


            cart.splice(index, 1);

            saveCart(cart);

            renderCart();
        }


        /* =========================
           SUMMARY
        ========================= */

        function updateSummary(cart) {

            let totalQuantity = 0;
            let totalPrice = 0;


            cart.forEach(function (product) {

                const quantity =
                    Math.max(
                        1,
                        Number(product.quantity) || 1
                    );

                const price =
                    Number(product.price) || 0;


                totalQuantity += quantity;

                totalPrice +=
                    price * quantity;
            });


            if (cartItemCount) {

                cartItemCount.textContent =
                    cart.length;
            }


            if (cartQuantity) {

                cartQuantity.textContent =
                    totalQuantity;
            }


            if (cartTotal) {

                cartTotal.textContent =
                    formatPrice(totalPrice);
            }


            if (checkoutButton) {

                checkoutButton.disabled =
                    cart.length === 0;

                checkoutButton.style.opacity =
                    cart.length === 0
                        ? "0.55"
                        : "1";

                checkoutButton.style.cursor =
                    cart.length === 0
                        ? "not-allowed"
                        : "pointer";
            }
        }


        /* =========================
           CHECKOUT
        ========================= */

        if (checkoutButton) {

            checkoutButton.addEventListener(
                "click",
                function () {

                    const cart = getCart();

                    if (cart.length === 0) {

                        alert(
                            "Panier ou vid."
                        );

                        return;
                    }


                    /*
                     * Kenbe panier la tou.
                     * Checkout la ka li li.
                     */

                    localStorage.setItem(
                        "macheya_checkout_cart",
                        JSON.stringify(cart)
                    );


                    window.location.href =
                        "checkout.html";
                }
            );
        }


        /* =========================
           INITIALIZE
        ========================= */

        renderCart();


        /* =========================
           SYNCHRONIZE
           SI CART LA CHANJE NAN
           YON LÒT ONGLET
        ========================= */

        window.addEventListener(
            "storage",
            function (event) {

                if (
                    event.key ===
                    "macheya_cart"
                ) {

                    renderCart();
                }
            }
        );

    });

})();
