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
    const categories = document.querySelectorAll(
        "#marketplace-category-list button"
    );
    const back = document.getElementById("marketplace-buyer-back");

    let products = [];
    let category = "all";
    let search = "";

    if (!supabase) {
        count.textContent = "Erè koneksyon";
        return;
    }

    function clean(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function cat(value) {
        const v = clean(value).replace(/[\s_-]/g, "");

        if (
            ["electronique", "elektronik", "elektwonik"].includes(v)
        ) {
            return "electronique";
        }

        if (["beaute", "bote"].includes(v)) {
            return "beaute";
        }

        if (["digital", "dijital"].includes(v)) {
            return "digital";
        }

        if (["maison", "kay"].includes(v)) {
            return "maison";
        }

        if (["mode", "vetman"].includes(v)) {
            return "mode";
        }

        return v || "lot";
    }

    function categoryName(value) {
        return {
            mode: "Mode",
            electronique: "Elektwonik",
            maison: "Kay",
            beaute: "Bote",
            digital: "Dijital",
            lot: "Lòt"
        }[cat(value)] || "Lòt";
    }

    function money(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "Pri pa disponib";
        }

        return new Intl.NumberFormat("fr-FR").format(number) + " HTG";
    }

    async function showBuyerBack() {
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

    async function loadProducts() {
        count.textContent = "Ap chaje...";

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("is_active", true)
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error(
                "MACHEYA MARKETPLACE:",
                error
            );

            count.textContent = "Erè chajman";
            return;
        }

        products = data || [];

        renderProducts();
    }

    function renderProducts() {
        let list = [...products];

        if (category !== "all") {
            list = list.filter(
                product =>
                    cat(product.category) === category
            );
        }

        const query = clean(search);

        if (query) {
            list = list.filter(product => {
                return (
                    clean(product.name).includes(query) ||
                    clean(product.description).includes(query) ||
                    clean(product.category).includes(query)
                );
            });
        }

        if (sort?.value === "price-low") {
            list.sort(
                (a, b) =>
                    Number(a.price || 0) -
                    Number(b.price || 0)
            );
        }

        if (sort?.value === "price-high") {
            list.sort(
                (a, b) =>
                    Number(b.price || 0) -
                    Number(a.price || 0)
            );
        }

        if (sort?.value === "name") {
            list.sort((a, b) =>
                String(a.name || "").localeCompare(
                    String(b.name || ""),
                    "fr"
                )
            );
        }

        grid.innerHTML = "";

        count.textContent =
            list.length +
            (list.length > 1 ? " pwodwi" : " pwodwi");

        title.textContent =
            category === "all"
                ? query
                    ? "Rezilta rechèch"
                    : "Tout pwodwi"
                : categoryName(category);

        empty.setAttribute(
            "aria-hidden",
            list.length ? "true" : "false"
        );

        list.forEach(renderProduct);
    }

    function renderProduct(product) {
        const card =
            document.createElement("article");

        card.className =
            "marketplace-product-card";

        const image =
            document.createElement("div");

        image.className =
            "marketplace-product-image";

        if (product.image_url) {
            image.style.backgroundImage =
                `url("${product.image_url}")`;

            image.style.backgroundSize = "cover";
            image.style.backgroundPosition = "center";
        } else {
            image.textContent = "🛍️";
        }

        const content =
            document.createElement("div");

        content.className =
            "marketplace-product-content";

        const categoryElement =
            document.createElement("span");

        categoryElement.className =
            "marketplace-product-category";

        categoryElement.textContent =
            categoryName(product.category);

        const nameElement =
            document.createElement("h3");

        nameElement.className =
            "marketplace-product-name";

        nameElement.textContent =
            product.name || "Pwodwi san non";

        const descriptionElement =
            document.createElement("p");

        descriptionElement.className =
            "marketplace-product-description";

        descriptionElement.textContent =
            product.description || "";

        const bottom =
            document.createElement("div");

        bottom.className =
            "marketplace-product-bottom";

        const priceElement =
            document.createElement("strong");

        priceElement.className =
            "marketplace-product-price";

        priceElement.textContent =
            money(product.price);

        const actions =
            document.createElement("div");

        actions.className =
            "marketplace-product-actions";

        const viewButton =
            document.createElement("button");

        viewButton.type = "button";
        viewButton.className =
            "marketplace-product-button marketplace-view-button";
        viewButton.textContent =
            "Gade pwodwi";

        viewButton.title =
            "Gade detay pwodwi sa a";

        viewButton.setAttribute(
            "aria-label",
            "Gade detay " +
            (product.name || "pwodwi")
        );

        viewButton.addEventListener(
            "click",
            function () {
                location.href =
                    "product-detail.html?id=" +
                    encodeURIComponent(product.id);
            }
        );

        const buyButton =
            document.createElement("button");

        buyButton.type = "button";
        buyButton.className =
            "marketplace-product-button marketplace-buy-button";
        buyButton.textContent =
            "Achte kounye a";

        buyButton.title =
            "Ale nan checkout pou achte pwodwi sa a";

        buyButton.setAttribute(
            "aria-label",
            "Achte " +
            (product.name || "pwodwi") +
            " kounye a"
        );

        buyButton.addEventListener(
            "click",
            function () {
                location.href =
                    "checkout.html?id=" +
                    encodeURIComponent(product.id);
            }
        );

        actions.append(
            viewButton,
            buyButton
        );

        bottom.append(
            priceElement,
            actions
        );

        content.append(
            categoryElement,
            nameElement,
            descriptionElement,
            bottom
        );

        card.append(
            image,
            content
        );

        grid.appendChild(card);
    }

    searchForm?.addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            search =
                searchInput?.value || "";

            renderProducts();
        }
    );

    searchInput?.addEventListener(
        "input",
        function () {
            if (!this.value.trim()) {
                search = "";
                renderProducts();
            }
        }
    );

    sort?.addEventListener(
        "change",
        renderProducts
    );

    categories.forEach(
        function (button) {
            button.addEventListener(
                "click",
                function () {
                    category =
                        cat(
                            button.dataset.categoryId
                        );

                    categories.forEach(
                        function (item) {
                            item.classList.toggle(
                                "is-active",
                                cat(
                                    item.dataset.categoryId
                                ) === category
                            );
                        }
                    );

                    renderProducts();
                }
            );
        }
    );

    const menu =
        document.getElementById(
            "marketplace-side-menu"
        );

    const menuButton =
        document.getElementById(
            "marketplace-menu-button"
        );

    const closeButton =
        document.getElementById(
            "marketplace-close-menu-button"
        );

    const overlay =
        document.getElementById(
            "marketplace-menu-overlay"
        );

    function closeMenu() {
        menu?.classList.remove("is-open");
        overlay?.classList.remove("is-visible");

        menuButton?.setAttribute(
            "aria-expanded",
            "false"
        );

        menu?.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    function openMenu() {
        menu?.classList.add("is-open");
        overlay?.classList.add("is-visible");

        menuButton?.setAttribute(
            "aria-expanded",
            "true"
        );

        menu?.setAttribute(
            "aria-hidden",
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

    categories[0]?.classList.add(
        "is-active"
    );

    showBuyerBack();
    loadProducts();

})();
