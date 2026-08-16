/* ============================================================
   MACHEYA — PRODUCT DETAIL
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async function() {


        /* ====================================================
           ELEMENTS
        ==================================================== */

        const loadingSection =
            document.getElementById(
                "loadingSection"
            );

        const productSection =
            document.getElementById(
                "productSection"
            );

        const errorSection =
            document.getElementById(
                "errorSection"
            );

        const errorMessage =
            document.getElementById(
                "errorMessage"
            );

        const productImage =
            document.getElementById(
                "productImage"
            );

        const productCategory =
            document.getElementById(
                "productCategory"
            );

        const productName =
            document.getElementById(
                "productName"
            );

        const productPrice =
            document.getElementById(
                "productPrice"
            );

        const productDescription =
            document.getElementById(
                "productDescription"
            );

        const sellerName =
            document.getElementById(
                "sellerName"
            );

        const productInfo =
            document.getElementById(
                "productInfo"
            );

        const buyButton =
            document.getElementById(
                "buyButton"
            );


        /* ====================================================
           HELPERS
        ==================================================== */

        function showError(message) {

            loadingSection.hidden =
                true;

            productSection.hidden =
                true;

            errorSection.hidden =
                false;

            errorMessage.textContent =
                message;
        }


        function formatPrice(price) {

            const number =
                Number(price);


            if (
                Number.isNaN(number)
            ) {

                return "Pri pa disponib";
            }


            return (
                new Intl.NumberFormat(
                    "fr-FR"
                ).format(number) +
                " HTG"
            );
        }


        function categoryName(category) {

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


        function typeName(type) {

            const types = {

                physical:
                    "📦 Pwodwi fizik",

                digital:
                    "💻 Pwodwi dijital",

                service:
                    "🛠️ Sèvis"
            };


            return (
                types[type] ||
                "Pwodwi"
            );
        }


        /* ====================================================
           PRODUCT ID
        ==================================================== */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const productId =
            params.get("id");


        if (!productId) {

            showError(
                "Pa gen ID pwodwi nan lyen an."
            );

            return;
        }


        /* ====================================================
           SUPABASE
        ==================================================== */

        let db =
            window.supabaseClient;


        /*
         * Si supabase.config.js pa kreye
         * window.supabaseClient, nou kreye
         * kliyan an dirèkteman.
         */

        if (!db) {

            if (
                typeof window.supabase ===
                "undefined"
            ) {

                showError(
                    "Supabase pa chaje sou paj la."
                );

                return;
            }


            const SUPABASE_URL =
                "https://iscktsymqntjgqaxcitv.supabase.co";


            const SUPABASE_ANON_KEY =
                "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


            db =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_ANON_KEY
                );
        }


        /* ====================================================
           LOAD PRODUCT
        ==================================================== */

        try {

            const {
                data: product,
                error: productError
            } = await db
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
                    "id",
                    productId
                )
                .eq(
                    "is_active",
                    true
                )
                .single();


            if (productError) {

                console.error(
                    "Product error:",
                    productError
                );


                throw new Error(
                    "Pwodwi sa a pa egziste oswa li pa disponib ankò."
                );
            }


            if (!product) {

                throw new Error(
                    "Nou pa jwenn pwodwi sa a."
                );
            }


            /* =================================================
               IMAGE
            ================================================= */

            if (product.image_url) {

                productImage.src =
                    product.image_url;

                productImage.alt =
                    product.name ||
                    "Foto pwodwi";


                productImage.style.display =
                    "block";

            } else {

                productImage.style.display =
                    "none";
            }


            /* =================================================
               BASIC INFO
            ================================================= */

            productCategory.textContent =
                categoryName(
                    product.category
                );


            productName.textContent =
                product.name ||
                "Pwodwi san non";


            productPrice.textContent =
                formatPrice(
                    product.price
                );


            productDescription.textContent =
                product.description ||
                "Pa gen deskripsyon pou pwodwi sa a.";


            /* =================================================
               SELLER
            ================================================= */

            sellerName.textContent =
                "Vandè Macheya";


            if (product.seller_id) {

                try {

                    const {
                        data: seller
                    } = await db
                        .from("profiles")
                        .select("name")
                        .eq(
                            "id",
                            product.seller_id
                        )
                        .maybeSingle();


                    if (
                        seller &&
                        seller.name
                    ) {

                        sellerName.textContent =
                            seller.name;
                    }

                } catch (sellerError) {

                    console.warn(
                        "Seller profile pa disponib:",
                        sellerError
                    );
                }
            }


            /* =================================================
               TYPE / STOCK
            ================================================= */

            productInfo.innerHTML =
                "";


            const typeBadge =
                document.createElement(
                    "span"
                );


            typeBadge.className =
                "info-badge";


            typeBadge.textContent =
                typeName(
                    product.product_type
                );


            productInfo.appendChild(
                typeBadge
            );


            /*
             * FIZIK
             */

            if (
                product.product_type ===
                "physical"
            ) {

                const stockBadge =
                    document.createElement(
                        "span"
                    );


                stockBadge.className =
                    "info-badge";


                const stock =
                    Number(
                        product.stock || 0
                    );


                if (stock > 0) {

                    stockBadge.classList.add(
                        "stock-badge"
                    );


                    stockBadge.textContent =
                        "✓ " +
                        stock +
                        " disponib";


                    buyButton.disabled =
                        false;


                    buyButton.textContent =
                        "🛒 Achte pwodwi sa";

                } else {

                    stockBadge.classList.add(
                        "out-stock"
                    );


                    stockBadge.textContent =
                        "✕ Pa gen stock";


                    buyButton.disabled =
                        true;


                    buyButton.textContent =
                        "Pwodwi a fini";
                }


                productInfo.appendChild(
                    stockBadge
                );
            }


            /*
             * DIJITAL
             */

            if (
                product.product_type ===
                "digital"
            ) {

                const digitalBadge =
                    document.createElement(
                        "span"
                    );


                digitalBadge.className =
                    "info-badge stock-badge";


                digitalBadge.textContent =
                    "✓ Disponib imedyatman";


                productInfo.appendChild(
                    digitalBadge
                );


                buyButton.disabled =
                    false;


                buyButton.textContent =
                    "🛒 Achte pwodwi sa";
            }


            /*
             * SERVICE
             */

            if (
                product.product_type ===
                "service"
            ) {

                const serviceBadge =
                    document.createElement(
                        "span"
                    );


                serviceBadge.className =
                    "info-badge";


                serviceBadge.textContent =
                    "🛠️ Sèvis";


                productInfo.appendChild(
                    serviceBadge
                );


                buyButton.disabled =
                    false;


                buyButton.textContent =
                    "📩 Kontinye";
            }


            /* =================================================
               SHOW PRODUCT
            ================================================= */

            loadingSection.hidden =
                true;

            errorSection.hidden =
                true;

            productSection.hidden =
                false;


            /* =================================================
               BUY BUTTON
            ================================================= */

            buyButton.addEventListener(
                "click",
                function() {

                    /*
                     * Pou kounye a nou voye
                     * enfòmasyon pwodwi a nan
                     * checkout.
                     */

                    const checkoutUrl =
                        "checkout.html?id=" +
                        encodeURIComponent(
                            product.id
                        );


                    window.location.href =
                        checkoutUrl;
                }
            );


        } catch (error) {

            console.error(
                "MACHEYA PRODUCT DETAIL ERROR:",
                error
            );


            showError(
                error.message ||
                "Nou pa kapab chaje pwodwi sa a."
            );
        }

    }
);
