// ============================================================
// MACHEYA — MARKETPLACE.JS
// ============================================================

(function () {

    "use strict";


    const state = {
        products: [],
        filteredProducts: [],
        category: "all",
        search: "",
        sort: "default"
    };


    // ========================================================
    // ELEMENTS
    // ========================================================

    const grid =
        document.getElementById(
            "marketplace-products-grid"
        );

    const empty =
        document.getElementById(
            "marketplace-empty-state"
        );

    const count =
        document.getElementById(
            "marketplace-results-count"
        );

    const title =
        document.getElementById(
            "marketplace-results-title"
        );

    const searchForm =
        document.getElementById(
            "marketplace-search-form"
        );

    const searchInput =
        document.getElementById(
            "marketplace-search-input"
        );

    const sortSelect =
        document.getElementById(
            "marketplace-sort-select"
        );

    const categoryButtons =
        document.querySelectorAll(
            "#marketplace-category-list button"
        );


    // ========================================================
    // SUPABASE
    // ========================================================

    const supabase =
        window.supabaseClient;


    if (!supabase) {

        console.error(
            "MACHEYA: Supabase client pa disponib."
        );

        showEmpty(
            "Macheya pa kapab chaje pwodwi yo kounye a."
        );

        return;
    }


    // ========================================================
    // BUYER BACK BUTTON
    // ========================================================

    const backBox =
        document.getElementById(
            "marketplace-buyer-back"
        );


    async function setupBuyerBack() {

        if (!backBox) {
            return;
        }


        try {

            const {
                data
            } =
                await supabase.auth.getUser();


            if (data?.user) {

                backBox.style.display =
                    "block";

            }

        } catch (error) {

            console.error(
                "MACHEYA: Erè pandan verifikasyon achtè:",
                error
            );

        }

    }


    // ========================================================
    // LOAD PRODUCTS
    // ========================================================

    async function loadProducts() {

        grid.innerHTML = "";


        try {

            const {
                data,
                error
            } =
                await supabase
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
                        "is_active",
                        true
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                console.error(
                    "MACHEYA PRODUCTS ERROR:",
                    error
                );

                throw error;
            }


            state.products =
                Array.isArray(data)
                    ? data
                    : [];


            console.log(
                "MACHEYA: Pwodwi jwenn:",
                state.products.length
            );


            filterProducts();


        } catch (error) {

            console.error(
                "MACHEYA: Load products error:",
                error
            );


            state.products = [];

            showEmpty(
                "Nou pa kapab chaje pwodwi yo kounye a."
            );

        }

    }


    // ========================================================
    // EMPTY
    // ========================================================

    function showEmpty(message) {

        grid.innerHTML = "";

        empty.setAttribute(
            "aria-hidden",
            "false"
        );


        if (message) {

            const description =
                document.getElementById(
                    "marketplace-empty-description"
                );

            if (description) {
                description.textContent =
                    message;
            }

        }


        count.textContent =
            "0 pwodwi";

    }


    // ========================================================
    // PRICE
    // ========================================================

    function formatPrice(price) {

        const number =
            Number(price);


        if (Number.isNaN(number)) {
            return "Pri pa disponib";
        }


        return (
            new Intl.NumberFormat(
                "fr-FR"
            ).format(number) +
            " HTG"
        );

    }


    // ========================================================
    // CATEGORY
    // ========================================================

    function categoryName(category) {

        const names = {

            mode: "Mode",

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
            names[
                String(
                    category || ""
                ).toLowerCase()
            ] ||
            category ||
            "Lòt"
        );

    }


    // ========================================================
    // FILTER
    // ========================================================

    function filterProducts() {

        let products =
            [...state.products];


        if (
            state.category !== "all"
        ) {

            products =
                products.filter(
                    function (product) {

                        return (
                            String(
                                product.category || ""
                            )
                            .trim()
                            .toLowerCase() ===
                            state.category
                        );

                    }
                );

        }


        const query =
            state.search
                .trim()
                .toLowerCase();


        if (query) {

            products =
                products.filter(
                    function (product) {

                        return (

                            String(
                                product.name || ""
                            )
                            .toLowerCase()
                            .includes(query)

                            ||

                            String(
                                product.description || ""
                            )
                            .toLowerCase()
                            .includes(query)

                            ||

                            String(
                                product.category || ""
                            )
                            .toLowerCase()
                            .includes(query)

                        );

                    }
                );

        }


        // SORT

        if (
            state.sort === "price-low"
        ) {

            products.sort(
                function (a, b) {

                    return (
                        Number(a.price || 0) -
                        Number(b.price || 0)
                    );

                }
            );

        }


        if (
            state.sort === "price-high"
        ) {

            products.sort(
                function (a, b) {

                    return (
                        Number(b.price || 0) -
                        Number(a.price || 0)
                    );

                }
            );

        }


        if (
            state.sort === "name"
        ) {

            products.sort(
                function (a, b) {

                    return String(
                        a.name || ""
                    ).localeCompare(
                        String(
                            b.name || ""
                        )
                    );

                }
            );

        }


        state.filteredProducts =
            products;


        title.textContent =
            state.category === "all"
                ? (
                    query
                        ? "Rezilta rechèch"
                        : "Tout pwodwi"
                )
                : categoryName(
                    state.category
                );


        renderProducts();

    }


    // ========================================================
    // RENDER
    // ========================================================

    function renderProducts() {

        grid.innerHTML = "";


        const products =
            state.filteredProducts;


        count.textContent =
            products.length +
            " pwodwi";


        if (!products.length) {

            showEmpty();

            return;
        }


        empty.setAttribute(
            "aria-hidden",
            "true"
        );


        products.forEach(
            function (product) {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "marketplace-product-card";


                card.id =
                    "product-card-" +
                    product.id;


                // IMAGE

                const image =
                    document.createElement(
                        "div"
                    );


                image.className =
                    "marketplace-product-image";


                if (product.image_url) {

                    image.style.backgroundImage =
                        "url('" +
                        product.image_url +
                        "')";

                    image.style.backgroundSize =
                        "cover";

                    image.style.backgroundPosition =
                        "center";

                } else {

                    image.textContent =
                        "🛍️";

                    image.style.display =
                        "grid";

                    image.style.placeItems =
                        "center";

                    image.style.fontSize =
                        "45px";

                }


                // CONTENT

                const content =
                    document.createElement(
                        "div"
                    );


                content.className =
                    "marketplace-product-content";


                // CATEGORY

                const category =
                    document.createElement(
                        "span"
                    );


                category.className =
                    "marketplace-product-category";


                category.textContent =
                    categoryName(
                        product.category
                    );


                // NAME

                const name =
                    document.createElement(
                        "h3"
                    );


                name.className =
                    "marketplace-product-name";


                name.textContent =
                    product.name ||
                    "Pwodwi san non";


                // DESCRIPTION

                const description =
                    document.createElement(
                        "p"
                    );


                description.className =
                    "marketplace-product-description";


                description.textContent =
                    product.description ||
                    "";


                // BOTTOM

                const bottom =
                    document.createElement(
                        "div"
                    );


                bottom.className =
                    "marketplace-product-bottom";


                // PRICE

                const price =
                    document.createElement(
                        "strong"
                    );


                price.className =
                    "marketplace-product-price";


                price.textContent =
                    formatPrice(
                        product.price
                    );


                // BUTTON

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "marketplace-product-button";


                button.textContent =
                    "Gade";


                button.addEventListener(
                    "click",
                    function () {

                        window.location.href =
                            "product-detail.html?id=" +
                            encodeURIComponent(
                                product.id
                            );

                    }
                );


                bottom.appendChild(
                    price
                );

                bottom.appendChild(
                    button
                );


                content.appendChild(
                    category
                );

                content.appendChild(
                    name
                );

                content.appendChild(
                    description
                );

                content.appendChild(
                    bottom
                );


                card.appendChild(
                    image
                );

                card.appendChild(
                    content
                );


                grid.appendChild(
                    card
                );

            }
        );

    }


    // ========================================================
    // SEARCH
    // ========================================================

    if (searchForm) {

        searchForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                state.search =
                    searchInput
                        ? searchInput.value
                        : "";


                filterProducts();

            }
        );

    }


    // ========================================================
    // SORT
    // ========================================================

    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            function () {

                state.sort =
                    sortSelect.value;


                filterProducts();

            }
        );

    }


    // ========================================================
    // CATEGORY
    // ========================================================

    categoryButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    state.category =
                        button.dataset.categoryId ||
                        "all";


                    categoryButtons.forEach(
                        function (item) {

                            item.classList.toggle(
                                "is-active",
                                item === button
                            );

                        }
                    );


                    filterProducts();

                }
            );

        }
    );


    // ========================================================
    // MENU
    // ========================================================

    const menuButton =
        document.getElementById(
            "marketplace-menu-button"
        );

    const sideMenu =
        document.getElementById(
            "marketplace-side-menu"
        );

    const closeButton =
        document.getElementById(
            "marketplace-close-menu-button"
        );

    const overlay =
        document.getElementById(
            "marketplace-menu-overlay"
        );


    function openMenu() {

        if (!sideMenu) return;


        sideMenu.classList.add(
            "is-open"
        );


        if (overlay) {

            overlay.classList.add(
                "is-visible"
            );

        }


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

        if (!sideMenu) return;


        sideMenu.classList.remove(
            "is-open"
        );


        if (overlay) {

            overlay.classList.remove(
                "is-visible"
            );

        }


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


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openMenu
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeMenu
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMenu
        );

    }


    // ========================================================
    // START
    // ========================================================

    setupBuyerBack();

    categoryButtons.forEach(
        function (button) {

            if (
                button.dataset.categoryId ===
                "all"
            ) {

                button.classList.add(
                    "is-active"
                );

            }

        }
    );


    loadProducts();


})();
