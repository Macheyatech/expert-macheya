// ============================================================
// MACHEYA — PRODUCT DETAIL
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    // ========================================================
    // ELEMENTS
    // ========================================================

    const productPage =
        document.getElementById("product-page");

    const productDetailsSection =
        document.getElementById("product-details-section");

    const productNotFound =
        document.getElementById("product-not-found");

    const productImage =
        document.getElementById("product-image");

    const productCategory =
        document.getElementById("product-category");

    const productName =
        document.getElementById("product-name");

    const productPrice =
        document.getElementById("product-price");

    const productDescription =
        document.getElementById("product-description");

    const productSellerName =
        document.getElementById("product-seller-name");

    const productMenuButton =
        document.getElementById("product-menu-button");

    const productSideMenu =
        document.getElementById("product-side-menu");

    const productCloseMenuButton =
        document.getElementById("product-close-menu-button");

    const productMenuOverlay =
        document.getElementById("product-menu-overlay");

    const productAddCartButton =
        document.getElementById(
            "product-add-cart-button"
        );

    const productBuyButton =
        document.getElementById(
            "product-buy-button"
        );


    // ========================================================
    // VERIFY HTML
    // ========================================================

    if (
        !productPage ||
        !productDetailsSection ||
        !productNotFound ||
        !productImage ||
        !productCategory ||
        !productName ||
        !productPrice ||
        !productDescription ||
        !productSellerName
    ) {

        console.error(
            "MACHEYA: Gen kèk eleman Product Detail ki manke nan HTML la."
        );

        return;
    }


    // ========================================================
    // SUPABASE
    // ========================================================

    const db =
        window.supabaseClient;

    if (!db) {

        console.error(
            "MACHEYA: Supabase client pa disponib."
        );

        showProductNotFound();

        return;
    }


    // ========================================================
    // PRODUCT ID
    // ========================================================

    function getProductId() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        return params.get("id");
    }


    // ========================================================
    // PRICE
    // ========================================================

    function formatPrice(price) {

        const value =
            Number(price);

        if (
            Number.isNaN(value)
        ) {

            return "Pri pa disponib";
        }

        return (
            new Intl.NumberFormat(
                "fr-FR"
            ).format(value) +
            " HTG"
        );
    }


    // ========================================================
    // CATEGORY
    // ========================================================

    function getCategoryName(category) {

        const categories = {

            "Rad":
                "Rad",

            "Soulye":
                "Soulye",

            "Akseswa":
                "Akseswa",

            "Elektronik":
                "Elektwonik",

            "Kay":
                "Kay",

            "Bote":
                "Bote",

            "Manje":
                "Manje",

            "Sèvis":
                "Sèvis",

            "Lòt":
                "Lòt",

            mode:
                "Mode",

            electronique:
                "Elektwonik",

            maison:
                "Kay",

            beaute:
                "Bote",

            digital:
                "Dijital",

            lot:
                "Lòt"
        };

        return (
            categories[category] ||
            category ||
            "Lòt"
        );
    }


    // ========================================================
    // SHOW PRODUCT
    // ========================================================

    function showProduct(product) {

        productDetailsSection.style.display =
            "grid";

        productNotFound.setAttribute(
            "aria-hidden",
            "true"
        );

        productCategory.textContent =
            getCategoryName(
                product.category
            );

        productName.textContent =
            product.name ||
            "Pwodwi san non";

        productPrice.textContent =
            formatPrice(
                product.price
            );

        productDescription.textContent =
            product.description ||
            "Pa gen deskripsyon disponib pou pwodwi sa a.";

        productSellerName.textContent =
            "Vandè Macheya";


        // ====================================================
        // IMAGE
        // ====================================================

        if (product.image_url) {

            productImage.textContent =
                "";

            productImage.style.backgroundImage =
                `url("${product.image_url}")`;

            productImage.style.backgroundSize =
                "cover";

            productImage.style.backgroundPosition =
                "center";

            productImage.style.backgroundRepeat =
                "no-repeat";

        } else {

            productImage.style.backgroundImage =
                "";

            productImage.textContent =
                "🛍️";
        }


        // ====================================================
        // PRODUCT ID
        // ====================================================

        productPage.dataset.productId =
            product.id;


        // ====================================================
        // SELLER
        // ====================================================

        if (product.seller_id) {

            try {

                const {
                    data: seller,
                    error: sellerError
                } = await db
                    .from("profiles")
                    .select("name")
                    .eq(
                        "id",
                        product.seller_id
                    )
                    .maybeSingle();

                if (
                    !sellerError &&
                    seller &&
                    seller.name
                ) {

                    productSellerName.textContent =
                        seller.name;
                }

            } catch (error) {

                console.warn(
                    "MACHEYA: Non vandè a pa disponib.",
                    error
                );
            }
        }


        // ====================================================
        // TITLE
        // ====================================================

        document.title =
            (
                product.name ||
                "Pwodwi"
            ) +
            " | Macheya";
    }


    // ========================================================
    // NOT FOUND
    // ========================================================

    function showProductNotFound() {

        productDetailsSection.style.display =
            "none";

        productNotFound.setAttribute(
            "aria-hidden",
            "false"
        );

        document.title =
            "Pwodwi pa disponib | Macheya";
    }


    // ========================================================
    // MENU
    // ========================================================

    function openProductMenu() {

        if (!productSideMenu) {
            return;
        }

        productSideMenu.classList.add(
            "is-open"
        );

        if (productMenuOverlay) {

            productMenuOverlay.classList.add(
                "is-visible"
            );
        }

        productSideMenu.setAttribute(
            "aria-hidden",
            "false"
        );

        if (productMenuButton) {

            productMenuButton.setAttribute(
                "aria-expanded",
                "true"
            );
        }
    }


    function closeProductMenu() {

        if (!productSideMenu) {
            return;
        }

        productSideMenu.classList.remove(
            "is-open"
        );

        if (productMenuOverlay) {

            productMenuOverlay.classList.remove(
                "is-visible"
            );
        }

        productSideMenu.setAttribute(
            "aria-hidden",
            "true"
        );

        if (productMenuButton) {

            productMenuButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }


    // ========================================================
    // MENU EVENTS
    // ========================================================

    if (productMenuButton) {

        productMenuButton.addEventListener(
            "click",
            openProductMenu
        );
    }

    if (productCloseMenuButton) {

        productCloseMenuButton.addEventListener(
            "click",
            closeProductMenu
        );
    }

    if (productMenuOverlay) {

        productMenuOverlay.addEventListener(
            "click",
            closeProductMenu
        );
    }


    // ========================================================
    // LOAD PRODUCT
    // ========================================================

    async function loadProduct() {

        const productId =
            getProductId();

        if (!productId) {

            console.error(
                "MACHEYA: Pa gen ID pwodwi nan URL la."
            );

            showProductNotFound();

            return;
        }


        console.log(
            "MACHEYA: Product ID:",
            productId
        );


        try {

            const {
                data: product,
                error: productError
            } = await db
                .from("products")
                .select(`
                    id,
                    name,
                    description,
                    price,
                    stock,
                    category,
                    product_type,
                    image_url,
                    seller_id,
                    is_active,
                    created_at
                `)
                .eq(
                    "id",
                    productId
                )
                .eq(
                    "is_active",
                    true
                )
                .maybeSingle();


            if (productError) {

                console.error(
                    "MACHEYA PRODUCT ERROR:",
                    productError
                );

                showProductNotFound();

                return;
            }


            if (!product) {

                console.error(
                    "MACHEYA: Pwodwi a pa jwenn pou ID:",
                    productId
                );

                showProductNotFound();

                return;
            }


            console.log(
                "MACHEYA: Pwodwi jwenn:",
                product
            );


            await showProduct(
                product
            );


        } catch (error) {

            console.error(
                "MACHEYA: Erè chajman pwodwi:",
                error
            );

            showProductNotFound();
        }
    }


    // ========================================================
    // CART
    // ========================================================

    if (productAddCartButton) {

        productAddCartButton.addEventListener(
            "click",
            function() {

                const productId =
                    getProductId();

                if (!productId) {
                    return;
                }

                window.location.href =
                    "cart.html?add=" +
                    encodeURIComponent(
                        productId
                    );
            }
        );
    }


    // ========================================================
    // BUY
    // ========================================================

    if (productBuyButton) {

        productBuyButton.addEventListener(
            "click",
            function() {

                const productId =
                    getProductId();

                if (!productId) {
                    return;
                }

                window.location.href =
                    "checkout.html?product=" +
                    encodeURIComponent(
                        productId
                    );
            }
        );
    }


    // ========================================================
    // START
    // ========================================================

    await loadProduct();

});
