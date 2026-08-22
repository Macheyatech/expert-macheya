(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", async function () {

        const db = window.supabaseClient;

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

        const cartButton = document.getElementById("product-view-cart-button");
        const buyButton = document.getElementById("product-view-buy-button");

        const menuButton = document.getElementById("product-view-menu-button");
        const closeMenuButton = document.getElementById("product-view-close-menu-button");
        const sideMenu = document.getElementById("product-view-side-menu");
        const overlay = document.getElementById("product-view-menu-overlay");

        /* =========================
           MENU
        ========================= */

        function openMenu() {
            sideMenu?.classList.add("is-open");
            overlay?.classList.add("is-visible");

            sideMenu?.setAttribute("aria-hidden", "false");
            menuButton?.setAttribute("aria-expanded", "true");
        }

        function closeMenu() {
            sideMenu?.classList.remove("is-open");
            overlay?.classList.remove("is-visible");

            sideMenu?.setAttribute("aria-hidden", "true");
            menuButton?.setAttribute("aria-expanded", "false");
        }

        menuButton?.addEventListener("click", openMenu);
        closeMenuButton?.addEventListener("click", closeMenu);
        overlay?.addEventListener("click", closeMenu);

        /* =========================
           SUPABASE
        ========================= */

        if (!db) {
            console.error("Macheya: supabaseClient pa jwenn.");
            showNotFound("Sistèm nan pa konekte ak bazdone a.");
            return;
        }

        /* =========================
           PRODUCT ID
        ========================= */

        const params = new URLSearchParams(window.location.search);

        const productId =
            params.get("id") ||
            params.get("product_id") ||
            params.get("product");

        console.log("Macheya Product ID:", productId);

        if (!productId) {
            showNotFound("Pa gen ID pwodwi nan lyen an.");
            return;
        }

        /* =========================
           LOAD PRODUCT
        ========================= */

        try {

            const {
                data: product,
                error: productError
            } = await db
                .from("products")
                .select("*")
                .eq("id", productId)
                .maybeSingle();

            console.log("Macheya Product:", product);

            if (productError) {
                console.error("Product error:", productError);
                showNotFound("Nou pa kapab chaje pwodwi sa a.");
                return;
            }

            if (!product) {
                showNotFound("Pwodwi sa pa egziste.");
                return;
            }

            /* =========================
               PRODUCT INFORMATION
            ========================= */

            name.textContent =
                product.name || "Pwodwi san non";

            price.textContent =
                formatPrice(product.price);

            category.textContent =
                product.category || "San kategori";

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

                image.style.backgroundSize = "cover";
                image.style.backgroundPosition = "center";
                image.style.backgroundRepeat = "no-repeat";

                image.textContent = "";

            } else {

                image.style.backgroundImage = "";
                image.textContent = "🛍️";
            }

            /* =========================
               AVAILABILITY
            ========================= */

            /*
             * Macheya ap sèvi ak is_active
             * pou konnen si pwodwi a aktif.
             *
             * Nou PA itilize stock/quantity
             * pou bloke pwodwi a.
             */

            const available =
                product.is_active !== false;

            if (stock) {

                stock.textContent =
                    available
                        ? "Disponib"
                        : "Pa disponib";

                stock.style.color =
                    available
                        ? "#15803d"
                        : "#dc2626";
            }

            setButtonState(cartButton, available);
            setButtonState(buyButton, available);

            /* =========================
               SELLER
            ========================= */

            if (sellerName) {

                sellerName.textContent =
                    "Ap chèche vandè a...";

                const sellerId =
                    product.identifiant_vendeur ||
                    product.seller_id ||
                    null;

                if (sellerId) {

                    console.log(
                        "Macheya Seller ID:",
                        sellerId
                    );

                    const {
                        data: seller,
                        error: sellerError
                    } = await db
                        .from("seller_public")
                        .select(
                            "id, nom_complet, name"
                        )
                        .eq(
                            "id",
                            sellerId
                        )
                        .maybeSingle();

                    console.log(
                        "Macheya Seller:",
                        seller
                    );

                    if (sellerError) {

                        console.error(
                            "Seller error:",
                            sellerError
                        );

                        sellerName.textContent =
                            "Vandè pa idantifye";

                    } else if (seller) {

                        sellerName.textContent =
                            seller.nom_complet ||
                            seller.name ||
                            "Vandè pa idantifye";

                    } else {

                        sellerName.textContent =
                            "Vandè pa idantifye";
                    }

                } else {

                    console.warn(
                        "Macheya: Pa gen identifiant_vendeur ni seller_id sou pwodwi a."
                    );

                    sellerName.textContent =
                        "Vandè pa idantifye";
                }
            }

            /* =========================
               SHOW PRODUCT
            ========================= */

            if (loading) {
                loading.style.display = "none";
            }

            if (details) {

                details.style.display = "grid";

                details.setAttribute(
                    "aria-hidden",
                    "false"
                );
            }

            if (notFound) {
                notFound.style.display = "none";
            }

            /* =========================
               ADD TO CART
            ========================= */

            if (cartButton) {

                cartButton.onclick = function () {

                    if (!available) {

                        alert(
                            "Pwodwi sa a pa disponib kounye a."
                        );

                        return;
                    }

                    addToCart(product);
                };
            }

            /* =========================
               BUY NOW
            ========================= */

            if (buyButton) {

                buyButton.onclick = function () {

                    if (!available) {

                        alert(
                            "Pwodwi sa a pa disponib kounye a."
                        );

                        return;
                    }

                    /*
                     * Sove pwodwi a pou checkout la
                     */

                    localStorage.setItem(
                        "macheya_checkout_product",
                        JSON.stringify({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image_url:
                                product.image_url || "",
                            seller_id:
                                product.identifiant_vendeur ||
                                product.seller_id ||
                                null,
                            quantity: 1
                        })
                    );

                    /*
                     * ALE DIRÈKTEMAN CHECKOUT
                     */

                    window.location.href =
                        "checkout.html?product_id=" +
                        encodeURIComponent(product.id);
                };
            }

        } catch (error) {

            console.error(
                "Macheya Product View Error:",
                error
            );

            showNotFound(
                "Yon pwoblèm rive pandan n ap chaje pwodwi a."
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
           BUTTON STATE
        ========================= */

        function setButtonState(button, available) {

            if (!button) return;

            button.disabled = !available;

            button.style.opacity =
                available ? "1" : "0.55";

            button.style.cursor =
                available
                    ? "pointer"
                    : "not-allowed";
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
            }

            const text =
                document.getElementById(
                    "product-view-not-found-description"
                );

            if (text && message) {
                text.textContent = message;
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
                    (cart[existingIndex].quantity || 1) + 1;

            } else {

                cart.push({

                    id: product.id,

                    name: product.name,

                    price: product.price,

                    image_url:
                        product.image_url || "",

                    seller_id:
                        product.identifiant_vendeur ||
                        product.seller_id ||
                        null,

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

    });

})();
