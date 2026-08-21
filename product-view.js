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
        if (details) details.style.display = "none";

        if (notFound) {
            notFound.style.display = "block";
            notFound.setAttribute("aria-hidden", "false");
        }

        document.title = "Pwodwi pa disponib | Macheya";
    }

    function showProduct(product) {
        if (!details) return;

        details.style.display = "grid";

        if (notFound) {
            notFound.style.display = "none";
            notFound.setAttribute("aria-hidden", "true");
        }

        category.textContent =
            categoryName(product.category);

        name.textContent =
            product.name || "Pwodwi san non";

        price.textContent =
            money(product.price);

        description.textContent =
            product.description ||
            "Pa gen deskripsyon disponib pou pwodwi sa a.";

        seller.textContent =
            product.seller_name ||
            "Vandè Macheya";

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

        document.title =
            `${product.name || "Pwodwi"} | Macheya`;

        document.body.dataset.productId =
            product.id;
    }

    async function loadProduct() {
        const id = getId();

        if (!id || !db) {
            showNotFound();
            return;
        }

        try {
            const { data, error } = await db
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
                .eq("is_active", true)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                showNotFound();
                return;
            }

            let sellerName = null;

            if (data.seller_id) {
                const { data: profile } = await db
                    .from("profiles")
                    .select("full_name,name,username")
                    .eq("id", data.seller_id)
                    .maybeSingle();

                sellerName =
                    profile?.full_name ||
                    profile?.name ||
                    profile?.username ||
                    null;
            }

            data.seller_name = sellerName;

            showProduct(data);

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

    if (!db) {
        console.error(
            "Macheya: supabaseClient pa jwenn."
        );
        showNotFound();
        return;
    }

    loadProduct();

})();
