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

    const menu = $("product-view-side-menu");
    const menuBtn = $("product-view-menu-button");
    const closeBtn = $("product-view-close-menu-button");
    const overlay = $("product-view-menu-overlay");

    const cartBtn = $("product-view-cart-button");
    const buyBtn = $("product-view-buy-button");

    const id = new URLSearchParams(location.search).get("id");

    function money(value) {
        const n = Number(value);
        return Number.isFinite(n)
            ? new Intl.NumberFormat("fr-FR").format(n) + " HTG"
            : "Pri pa disponib";
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

    function notFoundPage() {
        if (loading) loading.style.display = "none";
        if (details) details.style.display = "none";

        if (notFound) {
            notFound.style.display = "block";
            notFound.setAttribute("aria-hidden", "false");
        }

        document.title = "Pwodwi pa disponib | Macheya";
    }

    function showProduct(p) {
        if (loading) loading.style.display = "none";
        if (notFound) {
            notFound.style.display = "none";
            notFound.setAttribute("aria-hidden", "true");
        }

        if (details) {
            details.style.display = "grid";
            details.setAttribute("aria-hidden", "false");
        }

        category.textContent = categoryName(p.category);
        name.textContent = p.name || "Pwodwi san non";
        price.textContent = money(p.price);

        type.textContent =
            p.product_type ||
            p.type ||
            (categoryName(p.category) === "Dijital"
                ? "Pwodwi dijital"
                : "Pwodwi fizik");

        description.textContent =
            p.description ||
            "Pa gen deskripsyon disponib pou pwodwi sa a.";

        stock.textContent =
            p.is_active ? "Disponib" : "Pa disponib";

        seller.textContent =
            p.seller_name || "Vandè Macheya";

        image.textContent = "";

        if (p.image_url) {
            image.style.backgroundImage =
                `url("${p.image_url}")`;
            image.style.backgroundSize = "cover";
            image.style.backgroundPosition = "center";
            image.style.backgroundRepeat = "no-repeat";
        } else {
            image.style.backgroundImage = "";
            image.textContent = "🛍️";
        }

        document.title =
            `${p.name || "Pwodwi"} | Macheya`;
    }

    async function loadProduct() {
        if (!id || !db) {
            notFoundPage();
            return;
        }

        try {
            const { data, error } = await db
                .from("products")
                .select("*")
                .eq("id", id)
                .eq("is_active", true)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                notFoundPage();
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
            console.error("MACHEYA PRODUCT:", error);
            notFoundPage();
        }
    }

    function openMenu() {
        menu?.classList.add("is-open");
        overlay?.classList.add("is-visible");
        menu?.setAttribute("aria-hidden", "false");
        menuBtn?.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
        menu?.classList.remove("is-open");
        overlay?.classList.remove("is-visible");
        menu?.setAttribute("aria-hidden", "true");
        menuBtn?.setAttribute("aria-expanded", "false");
    }

    menuBtn?.addEventListener("click", openMenu);
    closeBtn?.addEventListener("click", closeMenu);
    overlay?.addEventListener("click", closeMenu);

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeMenu();
    });

    cartBtn?.addEventListener("click", () => {
        if (!id) return;
        location.href =
            "cart.html?add=" + encodeURIComponent(id);
    });

    buyBtn?.addEventListener("click", () => {
        if (!id) return;
        location.href =
            "checkout.html?id=" + encodeURIComponent(id);
    });

    loadProduct();

})();
