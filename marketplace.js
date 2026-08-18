(function () {
    "use strict";

    const supabase = window.supabaseClient;

    const grid = document.getElementById("marketplace-products-grid");
    const empty = document.getElementById("marketplace-empty-state");
    const count = document.getElementById("marketplace-results-count");
    const title = document.getElementById("marketplace-results-title");
    const searchForm = document.getElementById("marketplace-search-form");
    const searchInput = document.getElementById("marketplace-search-input");
    const sort = document.getElementById("marketplace-sort-select");
    const categories = document.querySelectorAll("#marketplace-category-list button");
    const back = document.getElementById("marketplace-buyer-back");

    let products = [];
    let category = "all";
    let search = "";

    if (!supabase) {
        count.textContent = "Erè koneksyon";
        return;
    }

    function clean(v) {
        return String(v || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function cat(v) {
        v = clean(v).replace(/[\s_-]/g, "");

        if (["electronique", "elektronik", "elektwonik"].includes(v))
            return "electronique";

        if (["beaute", "bote"].includes(v))
            return "beaute";

        if (["digital", "dijital"].includes(v))
            return "digital";

        if (["maison", "kay"].includes(v))
            return "maison";

        if (["mode", "vetman"].includes(v))
            return "mode";

        return v || "lot";
    }

    function categoryName(v) {
        return {
            mode: "Mode",
            electronique: "Elektwonik",
            maison: "Kay",
            beaute: "Bote",
            digital: "Dijital",
            lot: "Lòt"
        }[cat(v)] || v || "Lòt";
    }

    function price(v) {
        const n = Number(v);
        return Number.isNaN(n)
            ? "Pri pa disponib"
            : new Intl.NumberFormat("fr-FR").format(n) + " HTG";
    }

    async function buyerBack() {
        if (!back) return;

        const { data } = await supabase.auth.getUser();

        if (!data?.user) return;

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();

        const role = clean(profile?.role);

        if (
            role === "acheteur" ||
            role === "achte" ||
            role === "buyer"
        ) {
            back.style.display = "block";
        }
    }

    async function load() {
        count.textContent = "Ap chaje...";

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            count.textContent = "Erè chajman";
            return;
        }

        products = data || [];
        render();
    }

    function render() {
        let list = [...products];

        if (category !== "all")
            list = list.filter(p => cat(p.category) === category);

        const q = clean(search);

        if (q) {
            list = list.filter(p =>
                clean(p.name).includes(q) ||
                clean(p.description).includes(q) ||
                cat(p.category).includes(q)
            );
        }

        if (sort.value === "price-low")
            list.sort((a, b) => Number(a.price) - Number(b.price));

        if (sort.value === "price-high")
            list.sort((a, b) => Number(b.price) - Number(a.price));

        if (sort.value === "name")
            list.sort((a, b) =>
                String(a.name || "").localeCompare(String(b.name || ""))
            );

        grid.innerHTML = "";
        count.textContent = list.length + " pwodwi";

        title.textContent =
            category === "all"
                ? (q ? "Rezilta rechèch" : "Tout pwodwi")
                : categoryName(category);

        empty.setAttribute(
            "aria-hidden",
            list.length ? "true" : "false"
        );

        list.forEach(p => {
            const card = document.createElement("article");
            card.className = "marketplace-product-card";

            const image = document.createElement("div");
            image.className = "marketplace-product-image";

            if (p.image_url) {
                image.style.backgroundImage = `url("${p.image_url}")`;
                image.style.backgroundSize = "cover";
                image.style.backgroundPosition = "center";
            } else {
                image.textContent = "🛍️";
            }

            const content = document.createElement("div");
            content.className = "marketplace-product-content";

            content.innerHTML = `
                <span class="marketplace-product-category">
                    ${categoryName(p.category)}
                </span>

                <h3 class="marketplace-product-name">
                    ${p.name || "Pwodwi san non"}
                </h3>

                <p class="marketplace-product-description">
                    ${p.description || ""}
                </p>

                <div class="marketplace-product-bottom">
                    <strong class="marketplace-product-price">
                        ${price(p.price)}
                    </strong>

                    <button
                        class="marketplace-product-button"
                        type="button">
                        Gade
                    </button>
                </div>
            `;

            content
                .querySelector("button")
                .onclick = () => {
                    location.href =
                        "product-detail.html?id=" +
                        encodeURIComponent(p.id);
                };

            card.append(image, content);
            grid.appendChild(card);
        });
    }

    searchForm?.addEventListener("submit", e => {
        e.preventDefault();
        search = searchInput.value;
        render();
    });

    sort?.addEventListener("change", render);

    categories.forEach(btn => {
        btn.addEventListener("click", () => {
            category = cat(btn.dataset.categoryId);

            categories.forEach(b =>
                b.classList.toggle(
                    "is-active",
                    cat(b.dataset.categoryId) === category
                )
            );

            render();
        });
    });

    const menu = document.getElementById("marketplace-side-menu");
    const menuBtn = document.getElementById("marketplace-menu-button");
    const close = document.getElementById("marketplace-close-menu-button");
    const overlay = document.getElementById("marketplace-menu-overlay");

    function closeMenu() {
        menu?.classList.remove("is-open");
        overlay?.classList.remove("is-visible");
    }

    menuBtn?.addEventListener("click", () => {
        menu?.classList.add("is-open");
        overlay?.classList.add("is-visible");
    });

    close?.addEventListener("click", closeMenu);
    overlay?.addEventListener("click", closeMenu);

    categories[0]?.classList.add("is-active");

    buyerBack();
    load();

})();
