(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", async function () {

        const supabaseClient = window.supabaseClient;

        /* =========================
           ELEMENTS
        ========================= */

        const loading =
            document.getElementById("product-view-loading");

        const details =
            document.getElementById("product-view-details");

        const notFound =
            document.getElementById("product-view-not-found");

        const image =
            document.getElementById("product-view-image");

        const category =
            document.getElementById("product-view-category");

        const name =
            document.getElementById("product-view-name");

        const price =
            document.getElementById("product-view-price");

        const type =
            document.getElementById("product-view-type");

        const description =
            document.getElementById("product-view-description");

        const sellerName =
            document.getElementById("product-view-seller-name");

        const stock =
            document.getElementById("product-view-stock");

        const cartButton =
            document.getElementById("product-view-cart-button");

        const buyButton =
            document.getElementById("product-view-buy-button");


        /* =========================
           SUPABASE CHECK
        ========================= */

        if (!supabaseClient) {

            console.error(
                "Macheya: Supabase client pa jwenn."
            );

            showNotFound(
                "Sistèm nan pa konekte ak bazdone a."
            );

            return;
        }


        /* =========================
           MENU
        ========================= */

        const menuButton =
            document.getElementById(
                "product-view-menu-button"
            );

        const closeMenuButton =
            document.getElementById(
                "product-view-close-menu-button"
            );

        const sideMenu =
            document.getElementById(
                "product-view-side-menu"
            );

        const overlay =
            document.getElementById(
                "product-view-menu-overlay"
            );


        function openMenu() {

            if (!sideMenu || !overlay) return;

            sideMenu.classList.add("is-open");

            overlay.classList.add("is-visible");

            sideMenu.setAttribute(
                "aria-hidden",
                "false"
            );

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

            sideMenu.setAttribute(
                "aria-hidden",
                "true"
            );

            if (menuButton) {

                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        }


        menuButton?.addEventListener(
            "click",
            openMenu
        );

        closeMenuButton?.addEventListener(
            "click",
            closeMenu
        );

        overlay?.addEventListener(
            "click",
            closeMenu
        );

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {
                    closeMenu();
                }
            }
        );


        /* =========================
           PRODUCT ID
        ========================= */

        const params =
            new URLSearchParams(
                window.location.search
            );

        const productId =
            params.get("id") ||
            params.get("product_id") ||
            params.get("product");


        console.log(
            "MACHEYA PRODUCT ID:",
            productId
        );


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

                .eq(
                    "id",
                    productId
                )

                .maybeSingle();


            console.log(
                "MACHEYA PRODUCT:",
                product
            );


            if (productError) {

                console.error(
                    "MACHEYA PRODUCT ERROR:",
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


            /* =========================
               PRODUCT DISPLAY
            ========================= */

            name.textContent =
                product.name ||
                "Pwodwi san non";


            price.textContent =
                formatPrice(
                    product.price
                );


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

                image.style.backgroundSize =
                    "cover";

                image.style.backgroundPosition =
                    "center";

                image.style.backgroundRepeat =
                    "no-repeat";

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

                stock.style.color =
                    "#15803d";


                if (cartButton) {

                    cartButton.disabled =
                        false;

                    cartButton.style.opacity =
                        "1";

                    cartButton.style.cursor =
                        "pointer";
                }


                if (buyButton) {

                    buyButton.disabled =
                        false;

                    buyButton.style.opacity =
                        "1";

                    buyButton.style.cursor =
                        "pointer";
                }

            } else {

                stock.style.color =
                    "#dc2626";


                if (cartButton) {

                    cartButton.disabled =
                        true;

                    cartButton.style.opacity =
                        "0.55";

                    cartButton.style.cursor =
                        "not-allowed";
                }


                if (buyButton) {

                    buyButton.disabled =
                        true;

                    buyButton.style.opacity =
                        "0.55";

                    buyButton.style.cursor =
                        "not-allowed";
                }
            }


            /* =========================
               SELLER
            ========================= */

            sellerName.textContent =
                "Ap chèche vandè a...";


            if (product.seller_id) {

                console.log(
                    "MACHEYA SELLER ID:",
                    product.seller_id
                );


                const {
                    data: seller,
                    error: sellerError
                } = await supabaseClient

                    .from("profiles")

                    .select(
                        "id, nom_complet, name, username"
                    )

                    .eq(
                        "id",
                        product.seller_id
                    )

                    .maybeSingle();


                console.log(
                    "MACHEYA SELLER:",
                    seller
                );


                if (sellerError) {

                    console.error(
                        "MACHEYA SELLER ERROR:",
                        sellerError
                    );

                    sellerName.textContent =
                        "Vandè pa idantifye";

                } else if (seller) {

                    sellerName.textContent =
                        seller.nom_complet ||
                        seller.name ||
                        seller.username ||
                        "Vandè pa idantifye";

                } else {

                    sellerName.textContent =
                        "Vandè pa idantifye";
                }

            } else {

                sellerName.textContent =
                    "Vandè pa idantifye";
            }


            /* =========================
               SHOW PRODUCT
            ========================= */

            if (loading) {

                loading.style.display =
                    "none";
            }


            if (details) {

                details.style.display =
                    "grid";

                details.setAttribute(
                    "aria-hidden",
                    "false"
                );
            }


            if (notFound) {

                notFound.style.display =
                    "none";

                notFound.setAttribute(
                    "aria-hidden",
                    "true"
                );
            }


            /* =========================
               ADD TO CART
            ========================= */

            if (cartButton) {

                cartButton.onclick =
                    function () {

                        if (
                            !availability.available
                        ) {

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

                buyButton.onclick =
                    function () {

                        if (
                            !availability.available
                        ) {

                            alert(
                                "Pwodwi sa a pa disponib kounye a."
                            );

                            return;
                        }


                        buyProduct(product);
                    };
            }


            document.title =
                `${product.name || "Pwodwi"} | Macheya`;


        } catch (error) {

            console.error(
                "MACHEYA GENERAL ERROR:",
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

            const number =
                Number(value);


            if (
                !Number.isFinite(number)
            ) {

                return "0 HTG";
            }


            return (
                new Intl.NumberFormat(
                    "fr-FR"
                ).format(number)
                + " HTG"
            );
        }


        /* =========================
           AVAILABILITY
        ========================= */

        function getAvailability(product) {

            /*
             * is_active se sous prensipal
             * pou konnen si pwodwi a pibliye.
             */

            if (
                Object.prototype.hasOwnProperty.call(
                    product,
                    "is_active"
                )
            ) {

                return {
                    available:
                        product.is_active === true,

                    text:
                        product.is_active === true
                            ? "Disponib"
                            : "Pa disponib"
                };
            }


            /*
             * Si products pa genyen is_active,
             * nou gade stock si li egziste.
             */

            const stockFields = [
                "stock",
                "quantity",
                "qty",
                "inventory",
                "stock_quantity"
            ];


            for (
                const field of stockFields
            ) {

                if (
                    Object.prototype.hasOwnProperty.call(
                        product,
                        field
                    )
                ) {

                    const value =
                        product[field];


                    if (
                        typeof value ===
                        "boolean"
                    ) {

                        return {
                            available: value,

                            text:
                                value
                                    ? "Disponib"
                                    : "Pa disponib"
                        };
                    }


                    const number =
                        Number(value);


                    if (
                        Number.isFinite(
                            number
                        )
                    ) {

                        return {
                            available:
                                number > 0,

                            text:
                                number > 0
                                    ? "Disponib"
                                    : "Pa disponib"
                        };
                    }
                }
            }


            /*
             * Si pa gen okenn enfòmasyon
             * sou stock, pwodwi a disponib.
             */

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

                loading.style.display =
                    "none";
            }


            if (details) {

                details.style.display =
                    "none";

                details.setAttribute(
                    "aria-hidden",
                    "true"
                );
            }


            if (notFound) {

                notFound.style.display =
                    "block";

                notFound.setAttribute(
                    "aria-hidden",
                    "false"
                );


                const text =
                    document.getElementById(
                        "product-view-not-found-description"
                    );


                if (
                    text &&
                    message
                ) {

                    text.textContent =
                        message;
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

                console.error(
                    "MACHEYA CART ERROR:",
                    error
                );

                cart = [];
            }


            const existingIndex =
                cart.findIndex(
                    item =>
                        item.id ===
                        product.id
                );


            if (
                existingIndex >= 0
            ) {

                cart[
                    existingIndex
                ].quantity =
                    (
                        cart[
                            existingIndex
                        ].quantity || 1
                    ) + 1;

            } else {

                cart.push({

                    id:
                        product.id,

                    name:
                        product.name,

                    price:
                        product.price,

                    image_url:
                        product.image_url ||
                        "",

                    seller_id:
                        product.seller_id ||
                        null,

                    quantity:
                        1
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
           BUY NOW
        ========================= */

        function buyProduct(product) {

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
                        product.image_url ||
                        "",

                    seller_id:
                        product.seller_id ||
                        null,

                    quantity:
                        1
                })
            );


            window.location.href =
                "checkout.html?product_id=" +
                encodeURIComponent(
                    product.id
                );
        }

    });

})();
