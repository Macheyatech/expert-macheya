(function () {
    "use strict";

    const db = window.supabaseClient;

    const $ = id => document.getElementById(id);

    const details = $("product-details-section");
    const notFound = $("product-not-found");

    const image = $("product-image");
    const category = $("product-category");
    const name = $("product-name");
    const price = $("product-price");
    const description = $("product-description");
    const seller = $("product-seller-name");

    const menu = $("product-side-menu");
    const menuButton = $("product-menu-button");
    const closeButton = $("product-close-menu-button");
    const overlay = $("product-menu-overlay");

    const cartButton = $("product-add-cart-button");
    const buyButton = $("product-buy-button");

    function getId() {
        return new URLSearchParams(location.search).get("id");
    }

    function money(value) {
        const n = Number(value);

        if (!Number.isFinite(n)) {
            return "Pri pa disponib";
        }

        return new Intl.NumberFormat("fr-FR").format(n) + " HTG";
    }

    function categoryName(value) {
        const v = String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const map = {
            mode: "Mode",
            electronique: "Elektwonik",
            elektronik: "Elektwonik",
            elektwonik: "Elektwonik",
            maison: "Kay",
            kay: "Kay",
            beaute: "Bote",
            bote: "Bote",
            digital: "Dijital",
            dijital: "Dijital",
            lot: "Lòt"
        };

        return map[v] || "Lòt";
    }

    function showNotFound() {
        if (details) {
            details.style.display = "none";
        }

        if (notFound) {
            notFound.style.display = "block";
            notFound.setAttribute("aria-hidden", "false");
        }

        document.title = "Pwodwi pa disponib | Macheya";
    }

    function showProduct(product, sellerName) {
        if (!details) return;

        details.style.display = "grid";

        if (notFound) {
            notFound.style.display = "none";
            notFound.setAttribute("aria-hidden", "true");
        }

        category.textContent = categoryName(product.category);

        name.textContent =
            product.name || "Pwodwi san non";

        price.textContent =
            money(product.price);

        description.textContent =
            product.description ||
            "Pa gen deskripsyon disponib pou pwodwi sa a.";

        /*
         * NON VANDÈ A
         * Nou itilize nom_complet paske se kolòn ki
         * egziste nan profiles ou a.
         */
        seller.textContent =
            sellerName ||
            "Vandè pa idantifye";

        if (image) {
            image.textContent = "";

            if (product.image_url) {
                image.style.backgroundImage =
                    `url("${product.image_url}")`;

                image.style.backgroundSize = "cover";
                image.style.backgroundPosition = "center";
                image.style.backgroundRepeat = "no-repeat";
            } else {
                image.style.backgroundImage = "";
                image.textContent = "🛍️";
            }
        }

        document.title =
            `${product.name || "Pwodwi"} | Macheya`;

        document.body.dataset.productId =
            product.id;
    }

    async function loadProduct() {
        const id = getId();

        if (!id) {
            showNotFound();
            return;
        }

        if (!db) {
            console.error(
                "Macheya: supabaseClient pa jwenn."
            );

            showNotFound();
            return;
        }

        try {
            /*
             * 1. CHÈCHE PWODWI A
             */
            const {
                data: product,
                error: productError
            } = await db
                .from("products")
                .select(`
                    id,
                    name,
                    price,
                    category,
                    description,
                    image_url,
                    seller_id,
                    is_active
                `)
                .eq("id", id)
                .maybeSingle();

            if (productError) {
                console.error(
                    "MACHEYA PRODUCT ERROR:",
                    productError
                );

                showNotFound();
                return;
            }

            if (!product) {
                showNotFound();
                return;
            }

            /*
             * 2. VERIFYE SI PWODWI A AKTIF
             */
            if (product.is_active === false) {
                showNotFound();
                return;
            }

            /*
             * 3. CHÈCHE NON VANDÈ A
             *
             * seller_id nan products la deja ap refere
             * ak profiles.id.
             *
             * Kolòn non an se nom_complet.
             */
            let sellerName = null;

            if (product.seller_id) {
                const {
                    data: profile,
                    error: profileError
                } = await db
                    .from("profiles")
                    .select("nom_complet")
                    .eq("id", product.seller_id)
                    .maybeSingle();

                if (profileError) {
                    console.error(
                        "MACHEYA SELLER ERROR:",
                        profileError
                    );
                }

                if (profile) {
                    sellerName =
                        profile.nom_complet ||
                        null;
                }
            }

            /*
             * 4. AFFICHE PWODWI A + NON VANDÈ A
             */
            showProduct(
                product,
                sellerName
            );

        } catch (error) {
            console.error(
                "MACHEYA PRODUCT VIEW:",
                error
            );

            showNotFound();
        }
    }

    function openMenu() {
        menu?.classList.add("is-open");
        overlay?.classList.add("is-visible");

        menu?.setAttribute(
            "aria-hidden",
            "false"
        );

        menuButton?.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    function closeMenu() {
        menu?.classList.remove("is-open");
        overlay?.classList.remove("is-visible");

        menu?.setAttribute(
            "aria-hidden",
            "true"
        );

        menuButton?.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    menuButton?.addEventListener(
        "click",
        openMenu
    );

    closeButton?.addEventListener(
        "click",
        closeMenu
    );

    overlay?.addEventListener(
        "click",
        closeMenu
    );

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeMenu();
            }
        }
    );

    cartButton?.addEventListener(
        "click",
        () => {
            const id = getId();

            if (!id) return;

            location.href =
                "cart.html?add=" +
                encodeURIComponent(id);
        }
    );

    buyButton?.addEventListener(
        "click",
        () => {
            const id = getId();

            if (!id) return;

            location.href =
                "checkout.html?product=" +
                encodeURIComponent(id);
        }
    );

    loadProduct();

})();
