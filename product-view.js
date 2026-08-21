(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", async function () {

        const supabaseClient = window.supabaseClient;

        if (!supabaseClient) {
            console.error("Supabase client pa jwenn.");
            showNotFound("Sistèm nan pa konekte ak bazdone a.");
            return;
        }

        const loading = document.getElementById("product-view-loading");
        const details = document.getElementById("product-view-details");
        const notFound = document.getElementById("product-view-not-found");

        const image = document.getElementById("product-view-image");
        const category = document.getElementById("product-view-category");
        const name = document.getElementById("product-view-name");
        const price = document.getElementById("product-view-price");
        const type = document.getElementById("product-view-type");
        const description = document.getElementById("product-view-description");
        const sellerName = document.getElementById("product-view-seller-name");
        const stock = document.getElementById("product-view-stock");

        const cartButton = document.getElementById(
            "product-view-cart-button"
        );

        const buyButton = document.getElementById(
            "product-view-buy-button"
        );

        /* =========================
           MENU
        ========================= */

        const menuButton = document.getElementById(
            "product-view-menu-button"
        );

        const closeMenuButton = document.getElementById(
            "product-view-close-menu-button"
        );

        const sideMenu = document.getElementById(
            "product-view-side-menu"
        );

        const overlay = document.getElementById(
            "product-view-menu-overlay"
        );

        function openMenu() {
            if (!sideMenu || !overlay) return;

            sideMenu.classList.add("is-open");
            overlay.classList.add("is-visible");

            sideMenu.setAttribute("aria-hidden", "false");

            if (menuButton) {
                menuButton.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }
        }

        function closeMenu() {
            if (!sideMenu || !overlay) return;

            sideMenu.classList.remove("is-open");
            overlay.classList.remove("is-visible");

            sideMenu.setAttribute("aria-hidden", "true");

            if (menuButton) {
                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        }

        if (menuButton) {
            menuButton.addEventListener("click", openMenu);
        }

        if (closeMenuButton) {
            closeMenuButton.addEventListener("click", closeMenu);
        }

        if (overlay) {
            overlay.addEventListener("click", closeMenu);
        }

        /* =========================
           PRODUCT ID
        ========================= */

        const params = new URLSearchParams(
            window.location.search
        );

        const productId =
            params.get("id") ||
            params.get("product_id") ||
            params.get("product");

        console.log("ID pwodwi a:", productId);

        if (!productId) {
            showNotFound(
                "Pa gen ID pwodwi nan lyen an."
            );
            return;
        }

        /* =========================
           LOAD PRODUCT
        ========================= */

        try {

            const {
                data: product,
                error: productError
            } = await supabaseClient
                .from("products")
                .select("*")
                .eq("id", productId)
                .maybeSingle();

            console.log("Pwodwi jwenn:", product);

            if (productError) {
                console.error(
                    "Erè pwodwi:",
                    productError
                );

                showNotFound(
                    "Nou pa kapab chaje pwodwi sa a."
                );

                return;
            }

            if (!product) {
                showNotFound(
                    "Pwodwi sa pa egziste."
                );

                return;
            }

            console.log(
                "Tout done pwodwi a:",
                product
            );

            /* =========================
               DISPLAY PRODUCT
            ========================= */

            name.textContent =
                product.name ||
                "Pwodwi san non";

            price.textContent =
                formatPrice(product.price);

            category.textContent =
                product.category ||
                "San kategori";

            type.textContent =
                product.type ||
                product.product_type ||
                "Pwodwi";

            description.textContent =
                product.description ||
                "Pa gen deskripsyon pou pwodwi sa a.";

            /* =========================
               IMAGE
            ========================= */

            if (product.image_url) {

                image.style.backgroundImage =
                    `url("${product.image_url}")`;

                image.textContent = "";

            } else {

                image.style.backgroundImage = "";

                image.textContent = "🛍️";
            }

            /* =========================
               AVAILABILITY
            ========================= */

            const availability =
                getAvailability(product);

            stock.textContent =
                availability.text;

            if (availability.available) {

                stock.style.color = "#15803d";

                if (cartButton) {
                    cartButton.disabled = false;
                    cartButton.style.opacity = "1";
                    cartButton.style.cursor = "pointer";
                }

                if (buyButton) {
                    buyButton.disabled = false;
                    buyButton.style.opacity = "1";
                    buyButton.style.cursor = "pointer";
                }

            } else {

                stock.style.color = "#dc2626";

                if (cartButton) {
                    cartButton.disabled = true;
                    cartButton.style.opacity = "0.55";
                    cartButton.style.cursor = "not-allowed";
                }

                if (buyButton) {
                    buyButton.disabled = true;
                    buyButton.style.opacity = "0.55";
                    buyButton.style.cursor = "not-allowed";
                }
            }

            /* =========================
               SELLER
            ========================= */

            sellerName.textContent =
                "Ap chèche vandè a...";

            if (!product.seller_id) {

                console.warn(
                    "Pwodwi a pa gen seller_id."
                );

                sellerName.textContent =
                    "Vandè pa idantifye";

            } else {

                console.log(
                    "Seller ID:",
                    product.seller_id
                );

                /*
                 * IMPORTANT:
                 * Nou itilize sèlman kolòn ki egziste
                 * nan profiles.
                 */

                const {
                    data: seller,
                    error: sellerError
                } = await supabaseClient
                    .from("profiles")
                    .select("id, nom_complet")
                    .eq(
                        "id",
                        product.seller_id
                    )
                    .maybeSingle();

                console.log(
                    "Vandè jwenn:",
                    seller
                );

                if (sellerError) {

                    console.error(
                        "Erè vandè:",
                        sellerError
                    );

                    sellerName.textContent =
                        "Vandè pa idantifye";

                } else if (seller) {

                    sellerName.textContent =
                        seller.nom_complet ||
                        "Vandè pa idantifye";

                } else {

                    console.warn(
                        "Pa gen profile pou seller_id:",
                        product.seller_id
                    );

                    sellerName.textContent =
                        "Vandè pa idantifye";
                }
            }

            /* =========================
               SHOW PRODUCT
            ========================= */

            loading.style.display = "none";

            details.style.display = "grid";

            details.setAttribute(
                "aria-hidden",
                "false"
            );

            notFound.style.display = "none";

            /* =========================
               CART BUTTON
            ========================= */

            if (cartButton) {

                cartButton.onclick = function () {

                    if (!availability.available) {

                        alert(
                            "Pwodwi sa a pa disponib kounye a."
                        );

                        return;
                    }

                    addToCart(product);
                };
            }

            /* =========================
               CHECKOUT BUTTON
            ========================= */

            if (buyButton) {

                buyButton.onclick = function () {

                    if (!availability.available) {

                        alert(
                            "Pwodwi sa a pa disponib kounye a."
                        );

                        return;
                    }

                    buyProduct(product);
                };
            }

        } catch (error) {

            console.error(
                "Erè jeneral:",
                error
            );

            showNotFound(
                "Yon pwoblèm rive pandan n ap chaje pwodwi a."
            );
        }


        /* =========================
           PRICE
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
           AVAILABILITY
        ========================= */

        function getAvailability(product) {

            /*
             * Si gen yon stock reyèl nan database la,
             * nou respekte li.
             *
             * Men null / undefined / vid pa vle di
             * pwodwi a pa disponib.
             */

            const possibleStockFields = [
                "stock",
                "quantity",
                "qty",
                "inventory",
                "stock_quantity"
            ];

            let stockField = null;

            for (const field of possibleStockFields) {

                if (
                    Object.prototype.hasOwnProperty.call(
                        product,
                        field
                    )
                ) {

                    stockField = field;
                    break;
                }
            }

            /*
             * Pa gen stock column:
             * pwodwi a disponib.
             */

            if (!stockField) {

                return {
                    available: true,
                    text: "Disponib"
                };
            }

            const rawValue =
                product[stockField];

            /*
             * Stock vid/null:
             * konsidere pwodwi a disponib.
             */

            if (
                rawValue === null ||
                rawValue === undefined ||
                rawValue === ""
            ) {

                return {
                    available: true,
                    text: "Disponib"
                };
            }

            const numericValue =
                Number(rawValue);

            /*
             * Sèlman stock 0 oswa mwens
             * fè pwodwi a pa disponib.
             */

            if (
                Number.isFinite(numericValue) &&
                numericValue <= 0
            ) {

                return {
                    available: false,
                    text: "Pa disponib"
                };
            }

            return {
                available: true,
                text: "Disponib"
            };
        }


        /* =========================
           NOT FOUND
        ========================= */

        function showNotFound(message) {

            if (loading) {
                loading.style.display = "none";
            }

            if (details) {

                details.style.display = "none";

                details.setAttribute(
                    "aria-hidden",
                    "true"
                );
            }

            if (notFound) {

                notFound.style.display = "block";

                notFound.setAttribute(
                    "aria-hidden",
                    "false"
                );

                const text =
                    document.getElementById(
                        "product-view-not-found-description"
                    );

                if (text && message) {
                    text.textContent = message;
                }
            }
        }


        /* =========================
           CART
        ========================= */

        function addToCart(product) {

            let cart = [];

            try {

                cart =
                    JSON.parse(
                        localStorage.getItem(
                            "macheya_cart"
                        )
                    ) || [];

            } catch (error) {

                cart = [];
            }

            const existingIndex =
                cart.findIndex(
                    item =>
                        item.id === product.id
                );

            if (existingIndex >= 0) {

                cart[existingIndex].quantity =
                    (cart[existingIndex].quantity || 1)
                    + 1;

            } else {

                cart.push({

                    id: product.id,

                    name: product.name,

                    price: product.price,

                    image_url:
                        product.image_url || "",

                    seller_id:
                        product.seller_id || null,

                    quantity: 1
                });
            }

            localStorage.setItem(
                "macheya_cart",
                JSON.stringify(cart)
            );

            alert(
                "Pwodwi a ajoute nan panier."
            );
        }


        /* =========================
           CHECKOUT
        ========================= */

        function buyProduct(product) {

            const checkoutProduct = {

                id: product.id,

                name: product.name,

                price: product.price,

                image_url:
                    product.image_url || "",

                seller_id:
                    product.seller_id || null,

                quantity: 1
            };

            localStorage.setItem(
                "macheya_checkout_product",
                JSON.stringify(
                    checkoutProduct
                )
            );

            console.log(
                "Pwodwi pou checkout:",
                checkoutProduct
            );

            /*
             * Kounye a nou ale dirèkteman
             * sou checkout.html.
             */

            window.location.href =
                "checkout.html?product_id=" +
                encodeURIComponent(
                    product.id
                );
        }

    });

})();
