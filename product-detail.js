/* ============================================================
   MACHEYA — PRODUCT DETAIL
============================================================ */

document.addEventListener("DOMContentLoaded", async function () {

    "use strict";

    /* ========================================================
       ELEMENTS
    ======================================================== */

    const loadingSection =
        document.getElementById("loadingSection");

    const productSection =
        document.getElementById("productSection");

    const errorSection =
        document.getElementById("errorSection");

    const errorMessage =
        document.getElementById("errorMessage");

    const productImage =
        document.getElementById("productImage");

    const productCategory =
        document.getElementById("productCategory");

    const productName =
        document.getElementById("productName");

    const productPrice =
        document.getElementById("productPrice");

    const productDescription =
        document.getElementById("productDescription");

    const sellerName =
        document.getElementById("sellerName");

    const productInfo =
        document.getElementById("productInfo");

    const buyButton =
        document.getElementById("buyButton");


    /* ========================================================
       ERROR DISPLAY
    ======================================================== */

    function showError(message) {

        if (loadingSection) {
            loadingSection.hidden = true;
        }

        if (productSection) {
            productSection.hidden = true;
        }

        if (errorSection) {
            errorSection.hidden = false;
        }

        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }


    /* ========================================================
       PRICE
    ======================================================== */

    function formatPrice(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "Pri pa disponib";
        }

        return (
            new Intl.NumberFormat("fr-FR").format(number)
            + " HTG"
        );
    }


    /* ========================================================
       CATEGORY
    ======================================================== */

    function normalizeCategory(value) {

        return String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\s_-]/g, "");
    }


    function categoryName(value) {

        const category =
            normalizeCategory(value);

        const categories = {

            mode:
                "Mode",

            electronique:
                "Elektwonik",

            elektronik:
                "Elektwonik",

            elektwonik:
                "Elektwonik",

            maison:
                "Kay",

            kay:
                "Kay",

            beaute:
                "Bote",

            bote:
                "Bote",

            digital:
                "Dijital",

            dijital:
                "Dijital",

            lot:
                "Lòt"
        };

        return (
            categories[category] ||
            value ||
            "Lòt"
        );
    }


    /* ========================================================
       PRODUCT TYPE
    ======================================================== */

    function normalizeType(value) {

        return String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\s_-]/g, "");
    }


    function typeName(value) {

        const type =
            normalizeType(value);

        if (
            type === "physical" ||
            type === "physique" ||
            type === "physicalproduct"
        ) {
            return "📦 Pwodwi fizik";
        }

        if (
            type === "digital" ||
            type === "dijital"
        ) {
            return "💻 Pwodwi dijital";
        }

        if (
            type === "service" ||
            type === "sèvis" ||
            type === "servis"
        ) {
            return "🛠️ Sèvis";
        }

        return "📦 Pwodwi";
    }


    /* ========================================================
       PRODUCT ID
    ======================================================== */

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


    console.log(
        "Macheya Product ID:",
        productId
    );


    /* ========================================================
       SUPABASE
    ======================================================== */

    let db =
        window.supabaseClient;


    /*
       marketplace.html itilize:

       supabase-config.js

       Se menm non sa a nou dwe itilize
       sou product-detail.html.
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


    /* ========================================================
       LOAD PRODUCT
    ======================================================== */

    try {

        console.log(
            "Macheya ap chèche pwodwi:",
            productId
        );


        const result =
            await db
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
                .eq("id", productId)
                .maybeSingle();


        const product =
            result.data;

        const productError =
            result.error;


        console.log(
            "Macheya product result:",
            result
        );


        /* ====================================================
           DATABASE ERROR
        ==================================================== */

        if (productError) {

            console.error(
                "Macheya Supabase product error:",
                productError
            );


            showError(
                "Nou pa kapab chaje pwodwi sa a. "
                + productError.message
            );

            return;
        }


        /* ====================================================
           PRODUCT NOT FOUND
        ==================================================== */

        if (!product) {

            console.error(
                "Pwodwi pa jwenn pou ID:",
                productId
            );


            showError(
                "Pwodwi sa a pa egziste nan bazdone a."
            );

            return;
        }


        /* ====================================================
           CHECK ACTIVE STATUS
        ==================================================== */

        /*
           Nou pa itilize .eq("is_active", true)
           nan rechèch la.

           Sa pèmèt nou konnen si pwodwi a egziste
           menm lè is_active NULL oswa false.
        */

        if (
            product.is_active === false
        ) {

            console.warn(
                "Pwodwi sa a gen is_active = false:",
                product.id
            );

            /*
               Pou kounye a nou toujou montre pwodwi a,
               paske Marketplace la deja montre li.
            */
        }


        /* ====================================================
           IMAGE
        ==================================================== */

        if (
            product.image_url &&
            String(product.image_url).trim()
        ) {

            productImage.src =
                product.image_url;

            productImage.alt =
                product.name ||
                "Foto pwodwi";

            productImage.style.display =
                "block";

        } else {

            productImage.removeAttribute(
                "src"
            );

            productImage.alt =
                "Pa gen foto";

            productImage.style.display =
                "none";
        }


        /* ====================================================
           BASIC INFORMATION
        ==================================================== */

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


        /* ====================================================
           SELLER
        ==================================================== */

        sellerName.textContent =
            "Vandè Macheya";


        if (
            product.seller_id
        ) {

            try {

                const {
                    data: seller,
                    error: sellerError
                } = await db
                    .from("profiles")
                    .select("name")
                    .eq(
                        "id",
                        product.seller_id
                    )
                    .maybeSingle();


                if (sellerError) {

                    console.warn(
                        "Profile vandè pa jwenn:",
                        sellerError
                    );

                } else if (
                    seller &&
                    seller.name
                ) {

                    sellerName.textContent =
                        seller.name;
                }

            } catch (error) {

                console.warn(
                    "Erè profile vandè:",
                    error
                );
            }
        }


        /* ====================================================
           PRODUCT INFO
        ==================================================== */

        productInfo.innerHTML =
            "";


        const type =
            normalizeType(
                product.product_type
            );


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


        /* ====================================================
           PHYSICAL PRODUCT
        ==================================================== */

        if (
            type === "physical" ||
            type === "physique"
        ) {

            const stockBadge =
                document.createElement(
                    "span"
                );


            stockBadge.className =
                "info-badge";


            const stock =
                Number(
                    product.stock
                );


            if (
                Number.isFinite(stock) &&
                stock > 0
            ) {

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


        /* ====================================================
           DIGITAL PRODUCT
        ==================================================== */

        else if (
            type === "digital" ||
            type === "dijital"
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


        /* ====================================================
           SERVICE
        ==================================================== */

        else if (
            type === "service" ||
            type === "servis"
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


        /* ====================================================
           UNKNOWN TYPE
        ==================================================== */

        else {

            buyButton.disabled =
                false;


            buyButton.textContent =
                "🛒 Achte pwodwi sa";
        }


        /* ====================================================
           SHOW PRODUCT
        ==================================================== */

        loadingSection.hidden =
            true;


        errorSection.hidden =
            true;


        productSection.hidden =
            false;


        /* ====================================================
           BUY BUTTON
        ==================================================== */

        buyButton.onclick =
            function () {

                if (
                    buyButton.disabled
                ) {
                    return;
                }


                const checkoutUrl =
                    "checkout.html?id=" +
                    encodeURIComponent(
                        product.id
                    );


                window.location.href =
                    checkoutUrl;
            };


        console.log(
            "Macheya: pwodwi chaje avèk siksè.",
            product
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

});
