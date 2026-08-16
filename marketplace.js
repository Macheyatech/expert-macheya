/* ============================================================
   MACHEYA — MARKETPLACE
   PRODUCTS + SEARCH + CATEGORY + SORT
============================================================ */

const marketplaceState = {
    products: [],
    filteredProducts: [],
    activeCategory: "all",
    searchQuery: "",
    sort: "default"
};


/* ============================================================
   ELEMENTS
============================================================ */

const marketplaceProductsGrid =
    document.getElementById("marketplace-products-grid");

const marketplaceEmptyState =
    document.getElementById("marketplace-empty-state");

const marketplaceResultsCount =
    document.getElementById("marketplace-results-count");

const marketplaceResultsTitle =
    document.getElementById("marketplace-results-title");

const marketplaceSearchForm =
    document.getElementById("marketplace-search-form");

const marketplaceSearchInput =
    document.getElementById("marketplace-search-input");

const marketplaceSortSelect =
    document.getElementById("marketplace-sort-select");

const marketplaceMenuButton =
    document.getElementById("marketplace-menu-button");

const marketplaceSideMenu =
    document.getElementById("marketplace-side-menu");

const marketplaceCloseMenuButton =
    document.getElementById(
        "marketplace-close-menu-button"
    );

const marketplaceMenuOverlay =
    document.getElementById(
        "marketplace-menu-overlay"
    );

const marketplaceCategoryButtons =
    document.querySelectorAll(
        "#marketplace-category-list button"
    );


/* ============================================================
   SUPABASE
============================================================ */

const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";

let supabaseClient = null;


/* ============================================================
   INITIALIZE SUPABASE
============================================================ */

function initializeSupabase() {

    if (
        typeof window.supabase === "undefined"
    ) {

        console.error(
            "Supabase JS pa chaje."
        );

        return false;
    }


    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    return true;
}


/* ============================================================
   LOAD PRODUCTS
============================================================ */

async function loadProducts() {

    if (!supabaseClient) {

        showEmptyState();

        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
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
            .eq("is_active", true)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        marketplaceState.products =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "Macheya products:",
            marketplaceState.products
        );


        filterProducts();


    } catch (error) {

        console.error(
            "Erè pandan chajman pwodwi yo:",
            error
        );


        marketplaceState.products = [];


        showEmptyState();

    }
}


/* ============================================================
   PRICE
============================================================ */

function formatPrice(price) {

    const numericPrice =
        Number(price);


    if (
        Number.isNaN(numericPrice)
    ) {

        return "Pri pa disponib";
    }


    return (
        new Intl.NumberFormat(
            "fr-FR"
        ).format(numericPrice) +
        " HTG"
    );
}


/* ============================================================
   CATEGORY NAME
============================================================ */

function getCategoryName(category) {

    const categories = {

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


/* ============================================================
   PRODUCT TYPE
============================================================ */

function getProductTypeName(type) {

    const types = {

        physical:
            "Pwodwi fizik",

        digital:
            "Pwodwi dijital",

        service:
            "Sèvis"
    };


    return (
        types[type] ||
        "Pwodwi"
    );
}


/* ============================================================
   RENDER PRODUCTS
============================================================ */

function renderProducts() {

    marketplaceProductsGrid.innerHTML = "";


    const products =
        marketplaceState.filteredProducts;


    marketplaceResultsCount.textContent =
        products.length +
        (
            products.length === 1
                ? " pwodwi"
                : " pwodwi"
        );


    if (
        products.length === 0
    ) {

        showEmptyState();

        return;
    }


    marketplaceEmptyState.setAttribute(
        "aria-hidden",
        "true"
    );


    products.forEach(
        function(product) {

            const productCard =
                document.createElement(
                    "article"
                );


            productCard.className =
                "marketplace-product-card";


            productCard.id =
                "product-card-" +
                product.id;


            /* IMAGE */

            const productImage =
                document.createElement(
                    "div"
                );


            productImage.className =
                "marketplace-product-image";


            if (product.image_url) {

                productImage.style.backgroundImage =
                    "url('" +
                    product.image_url +
                    "')";

                productImage.style.backgroundSize =
                    "cover";

                productImage.style.backgroundPosition =
                    "center";

            } else {

                productImage.textContent =
                    "🛍️";

                productImage.style.display =
                    "grid";

                productImage.style.placeItems =
                    "center";

                productImage.style.fontSize =
                    "45px";
            }


            /* CONTENT */

            const productContent =
                document.createElement(
                    "div"
                );


            productContent.className =
                "marketplace-product-content";


            /* CATEGORY */

            const category =
                document.createElement(
                    "span"
                );


            category.className =
                "marketplace-product-category";


            category.textContent =
                getCategoryName(
                    product.category
                );


            /* NAME */

            const name =
                document.createElement(
                    "h3"
                );


            name.className =
                "marketplace-product-name";


            name.textContent =
                product.name;


            /* DESCRIPTION */

            const description =
                document.createElement(
                    "p"
                );


            description.className =
                "marketplace-product-description";


            description.textContent =
                product.description ||
                "";


            /* BOTTOM */

            const bottom =
                document.createElement(
                    "div"
                );


            bottom.className =
                "marketplace-product-bottom";


            /* PRICE */

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


            /* BUTTON */

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "marketplace-product-button";


            button.type =
                "button";


            button.textContent =
                "Gade";


            button.addEventListener(
                "click",
                function() {

                    window.location.href =
                        "product-detail.html?id=" +
                        encodeURIComponent(
                            product.id
                        );
                }
            );


            bottom.appendChild(price);

            bottom.appendChild(button);


            productContent.appendChild(
                category
            );

            productContent.appendChild(
                name
            );

            productContent.appendChild(
                description
            );

            productContent.appendChild(
                bottom
            );


            productCard.appendChild(
                productImage
            );

            productCard.appendChild(
                productContent
            );


            marketplaceProductsGrid.appendChild(
                productCard
            );

        }
    );
}


/* ============================================================
   EMPTY STATE
============================================================ */

function showEmptyState() {

    marketplaceProductsGrid.innerHTML =
        "";


    marketplaceEmptyState.setAttribute(
        "aria-hidden",
        "false"
    );


    marketplaceResultsCount.textContent =
        "0 pwodwi";
}


/* ============================================================
   FILTER
============================================================ */

function filterProducts() {

    let products = [
        ...marketplaceState.products
    ];


    const query =
        marketplaceState.searchQuery
            .trim()
            .toLowerCase();


    /* CATEGORY */

    if (
        marketplaceState.activeCategory !==
        "all"
    ) {

        products =
            products.filter(
                function(product) {

                    return (
                        String(
                            product.category ||
                            ""
                        ).toLowerCase() ===
                        marketplaceState.activeCategory
                            .toLowerCase()
                    );
                }
            );
    }


    /* SEARCH */

    if (query) {

        products =
            products.filter(
                function(product) {

                    const name =
                        String(
                            product.name ||
                            ""
                        ).toLowerCase();


                    const description =
                        String(
                            product.description ||
                            ""
                        ).toLowerCase();


                    const category =
                        String(
                            product.category ||
                            ""
                        ).toLowerCase();


                    return (
                        name.includes(query) ||
                        description.includes(query) ||
                        category.includes(query)
                    );
                }
            );
    }


    /* SORT */

    if (
        marketplaceState.sort ===
        "price-low"
    ) {

        products.sort(
            function(a, b) {

                return (
                    Number(a.price || 0) -
                    Number(b.price || 0)
                );
            }
        );
    }


    if (
        marketplaceState.sort ===
        "price-high"
    ) {

        products.sort(
            function(a, b) {

                return (
                    Number(b.price || 0) -
                    Number(a.price || 0)
                );
            }
        );
    }


    if (
        marketplaceState.sort ===
        "name"
    ) {

        products.sort(
            function(a, b) {

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


    marketplaceState.filteredProducts =
        products;


    marketplaceResultsTitle.textContent =
        marketplaceState.activeCategory ===
        "all"

            ? (
                query
                    ? "Rezilta rechèch"
                    : "Tout pwodwi"
            )

            : getCategoryName(
                marketplaceState.activeCategory
            );


    renderProducts();
}


/* ============================================================
   CATEGORY
============================================================ */

function setCategory(category) {

    marketplaceState.activeCategory =
        category;


    marketplaceCategoryButtons.forEach(
        function(button) {

            button.classList.toggle(
                "is-active",
                button.dataset.categoryId ===
                category
            );
        }
    );


    filterProducts();
}


/* ============================================================
   SEARCH
============================================================ */

if (marketplaceSearchForm) {

    marketplaceSearchForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            marketplaceState.searchQuery =
                marketplaceSearchInput
                    ? marketplaceSearchInput.value
                    : "";


            filterProducts();
        }
    );
}


/* ============================================================
   SORT
============================================================ */

if (marketplaceSortSelect) {

    marketplaceSortSelect.addEventListener(
        "change",
        function() {

            marketplaceState.sort =
                marketplaceSortSelect.value;


            filterProducts();
        }
    );
}


/* ============================================================
   CATEGORY BUTTONS
============================================================ */

marketplaceCategoryButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function() {

                setCategory(
                    button.dataset.categoryId
                );
            }
        );
    }
);


/* ============================================================
   MENU
============================================================ */

function openMarketplaceMenu() {

    if (!marketplaceSideMenu) {
        return;
    }


    marketplaceSideMenu.classList.add(
        "is-open"
    );


    if (marketplaceMenuOverlay) {

        marketplaceMenuOverlay.classList.add(
            "is-visible"
        );
    }


    marketplaceSideMenu.setAttribute(
        "aria-hidden",
        "false"
    );


    if (marketplaceMenuButton) {

        marketplaceMenuButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }
}


function closeMarketplaceMenu() {

    if (!marketplaceSideMenu) {
        return;
    }


    marketplaceSideMenu.classList.remove(
        "is-open"
    );


    if (marketplaceMenuOverlay) {

        marketplaceMenuOverlay.classList.remove(
            "is-visible"
        );
    }


    marketplaceSideMenu.setAttribute(
        "aria-hidden",
        "true"
    );


    if (marketplaceMenuButton) {

        marketplaceMenuButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


if (marketplaceMenuButton) {

    marketplaceMenuButton.addEventListener(
        "click",
        openMarketplaceMenu
    );
}


if (marketplaceCloseMenuButton) {

    marketplaceCloseMenuButton.addEventListener(
        "click",
        closeMarketplaceMenu
    );
}


if (marketplaceMenuOverlay) {

    marketplaceMenuOverlay.addEventListener(
        "click",
        closeMarketplaceMenu
    );
}


/* ============================================================
   START
============================================================ */

if (
    initializeSupabase()
) {

    setCategory("all");

    loadProducts();

} else {

    showEmptyState();
        }
