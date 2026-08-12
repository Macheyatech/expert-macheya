const SUPABASE_URL = "METE_URL_SUPABASE_LA";
const SUPABASE_ANON_KEY = "METE_ANON_KEY_SUPABASE_LA";

let supabaseClient = null;

const productPage = document.getElementById("product-page");
const productDetailsSection = document.getElementById("product-details-section");
const productNotFound = document.getElementById("product-not-found");

const productImage = document.getElementById("product-image");
const productCategory = document.getElementById("product-category");
const productName = document.getElementById("product-name");
const productPrice = document.getElementById("product-price");
const productDescription = document.getElementById("product-description");
const productSellerName = document.getElementById("product-seller-name");

const productMenuButton = document.getElementById("product-menu-button");
const productSideMenu = document.getElementById("product-side-menu");
const productCloseMenuButton = document.getElementById("product-close-menu-button");
const productMenuOverlay = document.getElementById("product-menu-overlay");

const productAddCartButton = document.getElementById(
    "product-add-cart-button"
);

const productBuyButton = document.getElementById(
    "product-buy-button"
);


function initializeSupabase() {
    if (
        typeof window.supabase === "undefined" ||
        !SUPABASE_URL ||
        !SUPABASE_ANON_KEY
    ) {
        console.error("Supabase pa disponib.");
        return false;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    return true;
}


function getProductId() {
    const params = new URLSearchParams(
        window.location.search
    );

    return params.get("id");
}


function formatPrice(price) {
    const value = Number(price);

    if (Number.isNaN(value)) {
        return "Pri pa disponib";
    }

    return (
        new Intl.NumberFormat("fr-FR").format(value) +
        " HTG"
    );
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


function showProduct(product) {
    productDetailsSection.style.display = "grid";

    productNotFound.setAttribute(
        "aria-hidden",
        "true"
    );

    productCategory.textContent =
        getCategoryName(product.category);

    productName.textContent =
        product.name || "Pwodwi san non";

    productPrice.textContent =
        formatPrice(product.price);

    productDescription.textContent =
        product.description ||
        "Pa gen deskripsyon disponib pou pwodwi sa a.";

    productSellerName.textContent =
        product.seller_name ||
        "Vandè Macheya";

    if (product.image_url) {
        productImage.textContent = "";

        productImage.style.backgroundImage =
            "url('" +
            product.image_url +
            "')";

        productImage.style.backgroundSize =
            "cover";

        productImage.style.backgroundPosition =
            "center";
    } else {
        productImage.style.backgroundImage = "";
        productImage.textContent = "🛍️";
    }

    document.title =
        (product.name || "Pwodwi") +
        " | Macheya";

    productPage.dataset.productId =
        product.id;
}


function showProductNotFound() {
    productDetailsSection.style.display = "none";

    productNotFound.setAttribute(
        "aria-hidden",
        "false"
    );

    document.title =
        "Pwodwi pa disponib | Macheya";
}


async function loadProduct() {
    const productId = getProductId();

    if (!productId) {
        showProductNotFound();
        return;
    }

    if (!supabaseClient) {
        showProductNotFound();
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
                .eq("id", productId)
                .eq("status", "published")
                .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            showProductNotFound();
            return;
        }

        showProduct(data);

    } catch (error) {
        console.error(
            "Erè pandan chajman pwodwi a:",
            error
        );

        showProductNotFound();
    }
}


function openProductMenu() {
    productSideMenu.classList.add("is-open");

    productMenuOverlay.classList.add(
        "is-visible"
    );

    productSideMenu.setAttribute(
        "aria-hidden",
        "false"
    );

    productMenuButton.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeProductMenu() {
    productSideMenu.classList.remove(
        "is-open"
    );

    productMenuOverlay.classList.remove(
        "is-visible"
    );

    productSideMenu.setAttribute(
        "aria-hidden",
        "true"
    );

    productMenuButton.setAttribute(
        "aria-expanded",
        "false"
    );
}


function requireProductId() {
    const productId = getProductId();

    if (!productId) {
        return null;
    }

    return productId;
}


productMenuButton.addEventListener(
    "click",
    openProductMenu
);


productCloseMenuButton.addEventListener(
    "click",
    closeProductMenu
);


productMenuOverlay.addEventListener(
    "click",
    closeProductMenu
);


productAddCartButton.addEventListener(
    "click",
    function() {
        const productId = requireProductId();

        if (!productId) {
            return;
        }

        window.location.href =
            "cart.html?add=" +
            encodeURIComponent(productId);
    }
);


productBuyButton.addEventListener(
    "click",
    function() {
        const productId = requireProductId();

        if (!productId) {
            return;
        }

        window.location.href =
            "checkout.html?product=" +
            encodeURIComponent(productId);
    }
);


initializeSupabase();
loadProduct();
