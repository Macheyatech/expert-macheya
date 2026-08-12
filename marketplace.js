const marketplaceState = {
    products: [],
    filteredProducts: [],
    activeCategory: "all",
    searchQuery: "",
    sort: "default"
};

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
    document.getElementById("marketplace-close-menu-button");

const marketplaceMenuOverlay =
    document.getElementById("marketplace-menu-overlay");

const marketplaceCategoryButtons =
    document.querySelectorAll(
        "#marketplace-category-list button"
    );


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL = "METE_URL_SUPABASE_LA";
const SUPABASE_ANON_KEY = "METE_ANON_KEY_SUPABASE_LA";

let supabaseClient = null;


function initializeSupabase() {
    if (
        typeof window.supabase === "undefined" ||
        !SUPABASE_URL ||
        !SUPABASE_ANON_KEY
    ) {
        console.error(
            "Supabase pa configure."
        );
        return false;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    return true;
}


/* =========================================================
   CHARGE PRODUCTS
   ========================================================= */

async function loadProducts() {

    if (!supabaseClient) {
        showEmptyState();
        return;
    }

    try {

        const { data, error } =
            await supabaseClient
                .from("products")
                .select(`
                    id,
                    name,
                    description,
                    price,
                    category,
                    image_url,
                    seller_id
                `)
                .eq("status", "published")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        marketplaceState.products =
            Array.isArray(data) ? data : [];

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


/* =========================================================
   PRI
   ========================================================= */

function formatPrice(price) {

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
        return "Pri pa disponib";
    }

    return (
        new Intl.NumberFormat("fr-FR")
            .format(numericPrice) +
        " HTG"
    );
}


/* =========================================================
   KATEGORI
   ========================================================= */

function getCategoryName(category) {

    const categories = {
        mode: "Mode",
        electronique: "Elektwonik",
        maison: "Kay",
        beaute: "Bote",
        digital: "Dijital",
        lot: "Lòt"
    };

    return categories[category] || "Lòt";
}


/* =========================================================
   AFFICHE PRODUITS
   ========================================================= */

function renderProducts() {

    marketplaceProductsGrid.innerHTML = "";

    const products =
        marketplaceState.filteredProducts;

    marketplaceResultsCount.textContent =
        products.length + " pwodwi";

    if (products.length === 0) {
        showEmptyState();
        return;
    }

    marketplaceEmptyState.setAttribute(
        "aria-hidden",
        "true"
    );

    products.forEach(function(product) {

        const productCard =
            document.createElement("article");

        productCard.className =
            "marketplace-product-card";

        productCard.id =
            "product-card-" + product.id;


        const productImage =
            document.createElement("div");

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

            productImage.textContent = "🛍️";

            productImage.style.display =
                "grid";

            productImage.style.placeItems =
                "center";

            productImage.style.fontSize =
                "45px";
        }


        const productContent =
            document.createElement("div");

        productContent.className =
            "marketplace-product-content";


        const category =
            document.createElement("span");

        category.className =
            "marketplace-product-category";

        category.textContent =
            getCategoryName(product.category);


        const name =
            document.createElement("h3");

        name.className =
            "marketplace-product-name";

        name.textContent =
            product.name;


        const description =
            document.createElement("p");

        description.className =
            "marketplace-product-description";

        description.textContent =
            product.description || "";


        const bottom =
            document.createElement("div");

        bottom.className =
            "marketplace-product-bottom";


        const price =
            document.createElement("strong");

        price.className =
            "marketplace-product-price";

        price.textContent =
            formatPrice(product.price);


        const button =
            document.createElement("button");

        button.className =
            "marketplace-product-button";

        button.id =
            "view-product-" + product.id;

        button.type = "button";

        button.textContent = "Gade";


        button.addEventListener(
            "click",
            function() {

                window.location.href =
                    "product.html?id=" +
                    encodeURIComponent(product.id);
            }
        );


        bottom.appendChild(price);
        bottom.appendChild(button);

        productContent.appendChild(category);
        productContent.appendChild(name);
        productContent.appendChild(description);
        productContent.appendChild(bottom);

        productCard.appendChild(productImage);
        productCard.appendChild(productContent);

        marketplaceProductsGrid.appendChild(
            productCard
        );
    });
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function showEmptyState() {

    marketplaceProductsGrid.innerHTML = "";

    marketplaceEmptyState.setAttribute(
        "aria-hidden",
        "false"
    );

    marketplaceResultsCount.textContent =
        "0 pwodwi";
}


/* =========================================================
   FILTER
   ========================================================= */

function filterProducts() {

    let products = [
        ...marketplaceState.products
    ];

    const query =
        marketplaceState.searchQuery
            .trim()
            .toLowerCase();


    if (
        marketplaceState.activeCategory !==
        "all"
    ) {

        products = products.filter(
            function(product) {

                return (
                    product.category ===
                    marketplaceState.activeCategory
                );
            }
        );
    }


    if (query) {

        products = products.filter(
            function(product) {

                const name =
                    String(
                        product.name || ""
                    ).toLowerCase();

                const description =
                    String(
                        product.description || ""
                    ).toLowerCase();

                return (
                    name.includes(query) ||
                    description.includes(query)
                );
            }
        );
    }


    if (
        marketplaceState.sort ===
        "price-low"
    ) {

        products.sort(
            function(a, b) {

                return (
                    Number(a.price) -
                    Number(b.price)
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
                    Number(b.price) -
                    Number(a.price)
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
                    String(b.name || "")
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


/* =========================================================
   KATEGORI
   ========================================================= */

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


/* =========================================================
   MENU
   ========================================================= */

function openMarketplaceMenu() {

    marketplaceSideMenu.classList.add(
        "is-open"
    );

    marketplaceMenuOverlay.classList.add(
        "is-visible"
    );

    marketplaceSideMenu.setAttribute(
        "aria-hidden",
        "false"
    );

    marketplaceMenuButton.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeMarketplaceMenu() {

    marketplaceSideMenu.classList.remove(
        "is-open"
    );

    marketplaceMenuOverlay.classList.remove(
        "is-visible"
    );

    marketplaceSideMenu.setAttribute(
        "aria-hidden",
        "true"
    );

    marketplaceMenuButton.setAttribute(
        "aria-expanded",
        "false"
    );
}


/* =========================================================
   RECHÈCH
   ========================================================= */

marketplaceSearchForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        marketplaceState.searchQuery =
            marketplaceSearchInput.value;

        filterProducts();
    }
);


/* =========================================================
   TRI
   ========================================================= */

marketplaceSortSelect.addEventListener(
    "change",
    function() {

        marketplaceState.sort =
            marketplaceSortSelect.value;

        filterProducts();
    }
);


/* =========================================================
   KATEGORI BUTTONS
   ========================================================= */

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


/* =========================================================
   MENU EVENTS
   ========================================================= */

marketplaceMenuButton.addEventListener(
    "click",
    openMarketplaceMenu
);

marketplaceCloseMenuButton.addEventListener(
    "click",
    closeMarketplaceMenu
);

marketplaceMenuOverlay.addEventListener(
    "click",
    closeMarketplaceMenu
);


/* =========================================================
   START
   ========================================================= */

initializeSupabase();

setCategory("all");

loadProducts();
