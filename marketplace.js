const marketplaceState = {
    products: [],
    filteredProducts: [],
    activeCategory: "all",
    searchQuery: "",
    sort: "default"
};

const marketplaceProductsGrid = document.getElementById(
    "marketplace-products-grid"
);

const marketplaceEmptyState = document.getElementById(
    "marketplace-empty-state"
);

const marketplaceResultsCount = document.getElementById(
    "marketplace-results-count"
);

const marketplaceResultsTitle = document.getElementById(
    "marketplace-results-title"
);

const marketplaceSearchForm = document.getElementById(
    "marketplace-search-form"
);

const marketplaceSearchInput = document.getElementById(
    "marketplace-search-input"
);

const marketplaceSortSelect = document.getElementById(
    "marketplace-sort-select"
);

const marketplaceMenuButton = document.getElementById(
    "marketplace-menu-button"
);

const marketplaceSideMenu = document.getElementById(
    "marketplace-side-menu"
);

const marketplaceCloseMenuButton = document.getElementById(
    "marketplace-close-menu-button"
);

const marketplaceMenuOverlay = document.getElementById(
    "marketplace-menu-overlay"
);

const marketplaceCategoryButtons = document.querySelectorAll(
    "#marketplace-category-list button"
);


function createProductId() {
    return "product_" + crypto.randomUUID();
}


function loadProducts() {
    const savedProducts = localStorage.getItem("macheya_products");

    if (!savedProducts) {
        marketplaceState.products = [];
        return;
    }

    try {
        const parsedProducts = JSON.parse(savedProducts);

        if (Array.isArray(parsedProducts)) {
            marketplaceState.products = parsedProducts;
        } else {
            marketplaceState.products = [];
        }
    } catch (error) {
        marketplaceState.products = [];
    }
}


function saveProducts() {
    localStorage.setItem(
        "macheya_products",
        JSON.stringify(marketplaceState.products)
    );
}


function createDemoProducts() {
    return [
        {
            id: createProductId(),
            name: "T-shirt Macheya",
            description: "T-shirt pou chak jou.",
            price: 1500,
            category: "mode",
            image: "",
            sellerId: "demo_seller_001"
        },
        {
            id: createProductId(),
            name: "Casque Bluetooth",
            description: "Casque san fil pou mizik ak apèl.",
            price: 2500,
            category: "electronique",
            image: "",
            sellerId: "demo_seller_002"
        },
        {
            id: createProductId(),
            name: "Dekorasyon Kay",
            description: "Yon bèl akseswa pou kay ou.",
            price: 1800,
            category: "maison",
            image: "",
            sellerId: "demo_seller_003"
        }
    ];
}


function formatPrice(price) {
    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
        return "Pri pa disponib";
    }

    return new Intl.NumberFormat("fr-FR").format(numericPrice) + " HTG";
}


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


function renderProducts() {
    marketplaceProductsGrid.innerHTML = "";

    if (marketplaceState.filteredProducts.length === 0) {
        marketplaceEmptyState.setAttribute(
            "aria-hidden",
            "false"
        );

        marketplaceResultsCount.textContent = "0 pwodwi";

        return;
    }

    marketplaceEmptyState.setAttribute(
        "aria-hidden",
        "true"
    );

    marketplaceResultsCount.textContent =
        marketplaceState.filteredProducts.length +
        " pwodwi";

    marketplaceState.filteredProducts.forEach(function(product) {

        const productCard = document.createElement("article");

        productCard.className = "marketplace-product-card";
        productCard.id = "product-card-" + product.id;

        const productImage = document.createElement("div");

        productImage.className = "marketplace-product-image";

        if (product.image) {
            productImage.style.backgroundImage =
                "url('" + product.image + "')";

            productImage.style.backgroundSize = "cover";
            productImage.style.backgroundPosition = "center";
        } else {
            productImage.textContent = "🛍️";

            productImage.style.display = "grid";
            productImage.style.placeItems = "center";
            productImage.style.fontSize = "45px";
        }

        const productContent = document.createElement("div");

        productContent.className =
            "marketplace-product-content";

        const productCategory =
            document.createElement("span");

        productCategory.className =
            "marketplace-product-category";

        productCategory.textContent =
            getCategoryName(product.category);

        const productName =
            document.createElement("h3");

        productName.className =
            "marketplace-product-name";

        productName.textContent =
            product.name;

        const productDescription =
            document.createElement("p");

        productDescription.className =
            "marketplace-product-description";

        productDescription.textContent =
            product.description || "";

        const productBottom =
            document.createElement("div");

        productBottom.className =
            "marketplace-product-bottom";

        const productPrice =
            document.createElement("strong");

        productPrice.className =
            "marketplace-product-price";

        productPrice.textContent =
            formatPrice(product.price);

        const productButton =
            document.createElement("button");

        productButton.className =
            "marketplace-product-button";

        productButton.id =
            "view-product-" + product.id;

        productButton.type = "button";

        productButton.textContent =
            "Gade";

        productButton.addEventListener(
            "click",
            function() {
                openProduct(product.id);
            }
        );

        productBottom.appendChild(productPrice);
        productBottom.appendChild(productButton);

        productContent.appendChild(productCategory);
        productContent.appendChild(productName);
        productContent.appendChild(productDescription);
        productContent.appendChild(productBottom);

        productCard.appendChild(productImage);
        productCard.appendChild(productContent);

        marketplaceProductsGrid.appendChild(productCard);
    });
}


function filterProducts() {
    let products = [...marketplaceState.products];

    const query =
        marketplaceState.searchQuery
            .trim()
            .toLowerCase();

    if (marketplaceState.activeCategory !== "all") {
        products = products.filter(function(product) {
            return product.category ===
                marketplaceState.activeCategory;
        });
    }

    if (query) {
        products = products.filter(function(product) {

            const name =
                String(product.name || "").toLowerCase();

            const description =
                String(product.description || "").toLowerCase();

            return (
                name.includes(query) ||
                description.includes(query)
            );
        });
    }

    if (marketplaceState.sort === "price-low") {
        products.sort(function(a, b) {
            return Number(a.price) - Number(b.price);
        });
    }

    if (marketplaceState.sort === "price-high") {
        products.sort(function(a, b) {
            return Number(b.price) - Number(a.price);
        });
    }

    if (marketplaceState.sort === "name") {
        products.sort(function(a, b) {
            return String(a.name).localeCompare(
                String(b.name)
            );
        });
    }

    marketplaceState.filteredProducts = products;

    if (marketplaceState.activeCategory === "all") {
        marketplaceResultsTitle.textContent =
            query ? "Rezilta rechèch" : "Tout pwodwi";
    } else {
        marketplaceResultsTitle.textContent =
            getCategoryName(
                marketplaceState.activeCategory
            );
    }

    renderProducts();
}


function setCategory(category) {
    marketplaceState.activeCategory = category;

    marketplaceCategoryButtons.forEach(
        function(button) {

            const buttonCategory =
                button.dataset.categoryId;

            button.classList.toggle(
                "is-active",
                buttonCategory === category
            );
        }
    );

    filterProducts();
}


function openProduct(productId) {
    const product =
        marketplaceState.products.find(
            function(item) {
                return item.id === productId;
            }
        );

    if (!product) {
        return;
    }

    localStorage.setItem(
        "macheya_selected_product",
        JSON.stringify(product)
    );

    window.location.href =
        "product.html?id=" +
        encodeURIComponent(product.id);
}


function openMarketplaceMenu() {
    marketplaceSideMenu.classList.add("is-open");

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


marketplaceSearchForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        marketplaceState.searchQuery =
            marketplaceSearchInput.value;

        filterProducts();
    }
);


marketplaceSortSelect.addEventListener(
    "change",
    function() {

        marketplaceState.sort =
            marketplaceSortSelect.value;

        filterProducts();
    }
);


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


loadProducts();

if (marketplaceState.products.length === 0) {
    marketplaceState.products =
        createDemoProducts();

    saveProducts();
}

setCategory("all");
