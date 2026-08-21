(function () {
    "use strict";

    const db = window.supabaseClient;
    const $ = id => document.getElementById(id);

    const loading = $("product-view-loading");
    const details = $("product-view-details");
    const notFound = $("product-view-not-found");

    const image = $("product-view-image");
    const category = $("product-view-category");
    const name = $("product-view-name");
    const price = $("product-view-price");
    const type = $("product-view-type");
    const description = $("product-view-description");
    const stock = $("product-view-stock");
    const seller = $("product-view-seller-name");

    const cartButton = $("product-view-cart-button");
    const buyButton = $("product-view-buy-button");

    const menu = $("product-view-side-menu");
    const menuButton = $("product-view-menu-button");
    const closeButton = $("product-view-close-menu-button");
    const overlay = $("product-view-menu-overlay");

    function getProductId() {
        return new URLSearchParams(location.search).get("id");
    }

    function clean(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function money(value) {
        const n = Number(value);

        if (!Number.isFinite(n)) {
            return "Pri pa disponib";
        }

        return new Intl.NumberFormat("fr-FR").format(n) + " HTG";
    }

    function categoryName(value) {
        const v = clean(value).replace(/[\s_-]/g, "");

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

    function showLoading(show) {
        if (!loading) return;
        loading.style.display = show ? "block" : "none";
    }

    function showNotFound() {
        showLoading(false);

        if (details) {
            details.style.display = "none";
            details.setAttribute("aria-hidden", "true");
        }

        if (notFound) {
            notFound.style.display = "block";
            notFound.setAttribute("aria-hidden", "false");
        }

        document.title = "Pwodwi pa disponib | Macheya";
    }

    function showProduct(product, sellerName) {
        showLoading(false);

        if (notFound) {
            notFound.style.display = "none";
            notFound.setAttribute("aria-hidden", "true");
        }

        if (!details) return;

        details.style.display = "grid";
        details.setAttribute("aria-hidden", "false");

        category.textContent =
            categoryName(product.category);

        name.textContent =
            product.name || "Pwodwi san non";

        price.textContent =
            money(product.price);

        type.textContent =
            product.product_type ||
            product.type ||
            "Pwodwi";

        description.textContent =
            product.description ||
            "Pa gen deskripsyon disponib pou pwodwi sa a.";

        seller.textContent =
            sellerName ||
            "Vandè pa idantifye";

        stock.textContent =
            product.stock === 0 ||
            product.stock === "0"
                ? "Pa disponib"
                : "Disponib";

        image.style.backgroundImage = "";

        if (product.image_url) {
            image.textContent = "";
            image.style.backgroundImage =
                `url("${product.image_url}")`;
        } else {
            image.style.backgroundImage = "";
            image.textContent = "🛍️";
        }

        document.title =
            `${product.name || "Pwodwi"} | Macheya`;

        document.body.dataset.productId =
            product.id;
    }

    async function getSellerName(sellerId) {
        if (!sellerId) return null;

        const { data, error } = await db
            .from("profiles")
            .select("nom_complet")
            .eq("id", sellerId)
            .maybeSingle();

        if (error) {
            console.error(
                "MACHEYA SELLER:",
                error
            );
            return null;
        }

        return data?.nom_complet || null;
    }

    async function loadProduct() {
        const id = getProductId();

        if (!id || !db) {
            showNotFound();
            return;
        }

        showLoading(true);

        try {
            const { data: product, error } = await db
                .from("products")
                .select("*")
                .eq("id", id)
                .eq("is_active", true)
                .maybeSingle();

            if (error) {
                console.error(
                    "MACHEYA PRODUCT:",
                    error
                );

                showNotFound();
                return;
            }

            if (!product) {
                showNotFound();
                return;
            }

            const sellerName =
                await getSellerName(product.seller_id);

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
        function (event) {
            if (event.key === "Escape") {
                closeMenu();
            }
        }
    );

    cartButton?.addEventListener(
        "click",
        function () {
            const id = getProductId();

            if (!id) return;

            location.href =
                "cart.html?add=" +
                encodeURIComponent(id);
        }
    );

    buyButton?.addEventListener(
        "click",
        function () {
            const id = getProductId();

            if (!id) return;

            location.href =
                "checkout.html?product=" +
                encodeURIComponent(id);
        }
    );

    if (!db) {
        console.error(
            "Macheya: supabaseClient pa jwenn."
        );

        showNotFound();
        return;
    }

    loadProduct();

})();
