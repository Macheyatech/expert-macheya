const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


const script = document.createElement("script");

script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


script.onload = async () => {

    const supabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    /* =========================
       CHÈCHE CONTAINER PRODUIT LA
    ========================= */

    let productsContainer =
        document.getElementById("productsContainer") ||
        document.getElementById("products-grid") ||
        document.getElementById("productGrid") ||
        document.querySelector("[data-products]");


    if (!productsContainer) {

        productsContainer =
            document.createElement("div");

        productsContainer.id =
            "productsContainer";

        productsContainer.className =
            "products-grid";

        const main =
            document.querySelector("main");

        if (main) {
            main.appendChild(productsContainer);
        }
    }


    /* =========================
       CHARGE PRODUITS
    ========================= */

    async function loadProducts() {

        productsContainer.innerHTML = `
            <div class="products-loading">
                <span>⏳</span>
                <p>Nou ap chèche pwodwi yo...</p>
            </div>
        `;


        const {
            data: products,
            error
        } = await supabase
            .from("products")
            .select(`
                id,
                created_at,
                name,
                description,
                price,
                category,
                seller_id,
                image_url,
                product_type,
                digital_file_url,
                stock,
                is_active
            `)
            .eq("is_active", true)
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "Products error:",
                error
            );

            productsContainer.innerHTML = `
                <div class="products-error">
                    <div>⚠️</div>
                    <h3>Nou pa kapab chaje pwodwi yo.</h3>
                    <p>
                        ${escapeHTML(error.message)}
                    </p>
                    <button
                        id="reloadProductsButton"
                        type="button">
                        Eseye ankò
                    </button>
                </div>
            `;


            const reloadButton =
                document.getElementById(
                    "reloadProductsButton"
                );


            if (reloadButton) {

                reloadButton.addEventListener(
                    "click",
                    loadProducts
                );
            }

            return;
        }


        if (!products || products.length === 0) {

            productsContainer.innerHTML = `
                <div class="products-empty">
                    <div>🛍️</div>
                    <h3>Pa gen pwodwi ankò.</h3>
                    <p>
                        Vandè yo poko mete pwodwi sou Macheya.
                    </p>
                </div>
            `;

            return;
        }


        /* =========================
           CHÈCHE NON VANDÈ YO
        ========================= */

        const sellerIds = [
            ...new Set(
                products
                    .map(product => product.seller_id)
                    .filter(Boolean)
            )
        ];


        let sellers = [];


        if (sellerIds.length > 0) {

            const {
                data,
                error: sellerError
            } = await supabase
                .from("profiles")
                .select(`
                    id,
                    nom_complet
                `)
                .in(
                    "id",
                    sellerIds
                );


            if (!sellerError && data) {

                sellers = data;
            }
        }


        /* =========================
           MAP VANDÈ YO
        ========================= */

        const sellerMap = {};


        sellers.forEach(
            seller => {

                sellerMap[seller.id] =
                    seller.nom_complet ||
                    "Vandè Macheya";
            }
        );


        /* =========================
           AFFICHE PRODUITS
        ========================= */

        productsContainer.innerHTML = "";


        products.forEach(
            product => {

                const sellerName =
                    sellerMap[
                        product.seller_id
                    ] ||
                    "Vandè Macheya";


                const card =
                    document.createElement("article");


                card.className =
                    "product-card";


                card.dataset.productId =
                    product.id;


                /* =========================
                   FOTO
                ========================= */

                let imageHTML = "";


                if (product.image_url) {

                    imageHTML = `
                        <img
                            src="${escapeAttribute(
                                product.image_url
                            )}"
                            alt="${escapeAttribute(
                                product.name
                            )}"
                            class="product-image"
                            loading="lazy"
                            onerror="
                                this.style.display='none';
                                this.nextElementSibling.style.display='flex';
                            "
                        >

                        <div
                            class="product-image-placeholder"
                            style="display:none;">
                            🛍️
                        </div>
                    `;

                } else {

                    imageHTML = `
                        <div
                            class="product-image-placeholder">
                            🛍️
                        </div>
                    `;
                }


                /* =========================
                   STOCK
                ========================= */

                let stockHTML = "";


                if (
                    product.stock !== null &&
                    product.stock !== undefined
                ) {

                    if (Number(product.stock) <= 0) {

                        stockHTML = `
                            <span class="product-stock out">
                                Epwize
                            </span>
                        `;

                    } else {

                        stockHTML = `
                            <span class="product-stock">
                                ${product.stock} disponib
                            </span>
                        `;
                    }
                }


                /* =========================
                   CARD
                ========================= */

                card.innerHTML = `

                    <a
                        href="product.html?id=${encodeURIComponent(
                            product.id
                        )}"
                        class="product-card-link">

                        <div class="product-image-wrapper">

                            ${imageHTML}

                        </div>


                        <div class="product-content">

                            <span class="product-category">
                                ${escapeHTML(
                                    product.category ||
                                    "San kategori"
                                )}
                            </span>


                            <h3 class="product-name">
                                ${escapeHTML(
                                    product.name ||
                                    "Pwodwi san non"
                                )}
                            </h3>


                            <div class="product-price">
                                ${formatPrice(
                                    product.price
                                )} HTG
                            </div>


                            <p class="product-description">
                                ${escapeHTML(
                                    product.description ||
                                    "Pa gen deskripsyon."
                                )}
                            </p>


                            <div class="product-seller">

                                🏪 Vandè :
                                <strong>
                                    ${escapeHTML(
                                        sellerName
                                    )}
                                </strong>

                            </div>


                            <div class="product-bottom">

                                ${stockHTML}

                                <span class="product-view">
                                    Gade pwodwi →
                                </span>

                            </div>

                        </div>

                    </a>
                `;


                productsContainer.appendChild(
                    card
                );
            }
        );
    }


    /* =========================
       FORMAT PRI
    ========================= */

    function formatPrice(price) {

        const number =
            Number(price);


        if (Number.isNaN(number)) {
            return "0";
        }


        return new Intl.NumberFormat(
            "fr-FR"
        ).format(number);
    }


    /* =========================
       SEKIRIZE HTML
    ========================= */

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function escapeAttribute(value) {

        return escapeHTML(value);
    }


    /* =========================
       START
    ========================= */

    await loadProducts();

};


script.onerror = () => {

    console.error(
        "Supabase library could not load."
    );

};


document.head.appendChild(script);
