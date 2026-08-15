document.addEventListener("DOMContentLoaded", async () => {

    // =========================================================
    // SUPABASE
    // =========================================================

    const supabase = window.supabaseClient;

    if (!supabase) {
        showMessage(
            "Supabase pa konekte. Verifye supabase-config.js.",
            "error"
        );

        hideLoading();
        return;
    }


    // =========================================================
    // ELEMENTS
    // =========================================================

    const productsGrid =
        document.getElementById("productsGrid");

    const loadingState =
        document.getElementById("loadingState");

    const emptyState =
        document.getElementById("emptyState");

    const formMessage =
        document.getElementById("formMessage");

    const totalProducts =
        document.getElementById("totalProducts");

    const activeProducts =
        document.getElementById("activeProducts");

    const totalStock =
        document.getElementById("totalStock");


    // =========================================================
    // CURRENT USER
    // =========================================================

    async function getCurrentUser() {

        const {
            data,
            error
        } = await supabase.auth.getUser();


        if (error) {

            console.error(
                "GET USER ERROR:",
                error
            );

            throw new Error(
                "Nou pa ka verifye kont ou."
            );
        }


        if (!data.user) {

            window.location.href =
                "login.html?role=seller";

            return null;
        }


        return data.user;
    }


    // =========================================================
    // LOAD SELLER PRODUCTS
    // =========================================================

    async function loadSellerProducts() {

        try {

            showLoading();
            hideMessage();


            const user =
                await getCurrentUser();


            if (!user) {
                return;
            }


            console.log(
                "SELLER ID:",
                user.id
            );


            const {
                data: products,
                error
            } = await supabase
                .from("products")
                .select(`
                    id,
                    name,
                    description,
                    price,
                    category,
                    seller_id,
                    image_url,
                    product_type,
                    stock,
                    is_active,
                    created_at
                `)
                .eq(
                    "seller_id",
                    user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


            if (error) {

                console.error(
                    "LOAD PRODUCTS ERROR:",
                    error
                );

                throw new Error(
                    "Pwodwi yo pa t ka chaje: " +
                    error.message
                );
            }


            console.log(
                "SELLER PRODUCTS:",
                products
            );


            updateStatistics(
                products || []
            );


            renderProducts(
                products || []
            );


        } catch (error) {

            console.error(
                "SELLER PAGE ERROR:",
                error
            );


            productsGrid.innerHTML = "";

            emptyState.style.display =
                "none";


            showMessage(
                error.message ||
                "Yon erè rive pandan pwodwi yo t ap chaje.",
                "error"
            );


        } finally {

            hideLoading();

        }

    }


    // =========================================================
    // STATISTICS
    // =========================================================

    function updateStatistics(products) {

        const total =
            products.length;


        const active =
            products.filter(
                product =>
                    product.is_active !== false
            ).length;


        const stock =
            products.reduce(
                (
                    totalStockValue,
                    product
                ) => {

                    if (
                        product.product_type ===
                        "physical"
                    ) {

                        return (
                            totalStockValue +
                            Number(
                                product.stock || 0
                            )
                        );

                    }

                    return totalStockValue;

                },
                0
            );


        totalProducts.textContent =
            total;

        activeProducts.textContent =
            active;

        totalStock.textContent =
            stock;
    }


    // =========================================================
    // RENDER PRODUCTS
    // =========================================================

    function renderProducts(products) {

        productsGrid.innerHTML = "";


        if (!products.length) {

            emptyState.style.display =
                "block";

            return;
        }


        emptyState.style.display =
            "none";


        products.forEach(
            product => {

                const card =
                    createProductCard(product);

                productsGrid.appendChild(card);

            }
        );

    }


    // =========================================================
    // CREATE PRODUCT CARD
    // =========================================================

    function createProductCard(product) {

        const card =
            document.createElement("article");

        card.className =
            "product-card";


        // IMAGE

        const imageContainer =
            document.createElement("div");

        imageContainer.className =
            "product-image-container";


        const image =
            document.createElement("img");

        image.className =
            "product-image";

        image.alt =
            product.name || "Foto pwodwi";

        image.loading =
            "lazy";


        if (product.image_url) {

            image.src =
                product.image_url;

        } else {

            image.src =
                createPlaceholderImage();

        }


        image.addEventListener(
            "error",
            () => {

                image.src =
                    createPlaceholderImage();

            }
        );


        imageContainer.appendChild(image);


        // CONTENT

        const content =
            document.createElement("div");

        content.className =
            "product-content";


        // NAME

        const name =
            document.createElement("h2");

        name.className =
            "product-name";

        name.textContent =
            product.name ||
            "Pwodwi san non";


        // PRICE

        const price =
            document.createElement("div");

        price.className =
            "product-price";

        price.textContent =
            formatPrice(product.price);


        // CATEGORY

        const category =
            document.createElement("div");

        category.className =
            "product-category";

        category.textContent =
            "📂 " +
            (
                product.category ||
                "Lòt"
            );


        // TYPE

        const type =
            document.createElement("span");

        type.className =
            "product-type";

        type.textContent =
            getProductTypeLabel(
                product.product_type
            );


        // STOCK

        const stock =
            document.createElement("div");

        stock.className =
            "product-stock";


        if (
            product.product_type ===
            "physical"
        ) {

            stock.textContent =
                "📦 Stock: " +
                Number(
                    product.stock || 0
                );

        } else if (
            product.product_type ===
            "digital"
        ) {

            stock.textContent =
                "💾 Pwodwi dijital";

        } else if (
            product.product_type ===
            "service"
        ) {

            stock.textContent =
                "🛠️ Sèvis";

        } else {

            stock.textContent =
                "📦 Disponib";

        }


        // ACTIONS

        const actions =
            document.createElement("div");

        actions.className =
            "product-actions";


        // VIEW

        const viewButton =
            document.createElement("button");

        viewButton.type =
            "button";

        viewButton.className =
            "view-button";

        viewButton.textContent =
            "👁 Gade";


        viewButton.addEventListener(
            "click",
            () => {

                if (!product.id) {
                    return;
                }


                window.location.href =
                    "product-detail.html?id=" +
                    encodeURIComponent(
                        product.id
                    );

            }
        );


        // DELETE

        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "delete-button";

        deleteButton.textContent =
            "🗑 Efase";


        deleteButton.addEventListener(
            "click",
            async () => {

                await deleteProduct(
                    product,
                    deleteButton
                );

            }
        );


        actions.appendChild(viewButton);
        actions.appendChild(deleteButton);


        // BUILD

        content.appendChild(name);
        content.appendChild(price);
        content.appendChild(category);
        content.appendChild(type);
        content.appendChild(stock);
        content.appendChild(actions);


        card.appendChild(imageContainer);
        card.appendChild(content);


        return card;
    }


    // =========================================================
    // DELETE PRODUCT
    // =========================================================

    async function deleteProduct(
        product,
        button
    ) {

        const productName =
            product.name ||
            "pwodwi sa a";


        const confirmed =
            window.confirm(
                `Èske ou sèten ou vle efase "${productName}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            button.disabled =
                true;

            button.textContent =
                "Ap efase...";


            const user =
                await getCurrentUser();


            if (!user) {
                return;
            }


            const {
                error
            } = await supabase
                .from("products")
                .delete()
                .eq(
                    "id",
                    product.id
                )
                .eq(
                    "seller_id",
                    user.id
                );


            if (error) {

                console.error(
                    "DELETE PRODUCT ERROR:",
                    error
                );

                throw new Error(
                    "Pwodwi a pa t ka efase: " +
                    error.message
                );
            }


            showMessage(
                "Pwodwi a efase avèk siksè.",
                "success"
            );


            await loadSellerProducts();


        } catch (error) {

            console.error(
                "DELETE ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Pwodwi a pa t ka efase.",
                "error"
            );


            button.disabled =
                false;

            button.textContent =
                "🗑 Efase";
        }

    }


    // =========================================================
    // PRODUCT TYPE
    // =========================================================

    function getProductTypeLabel(type) {

        switch (type) {

            case "physical":
                return "📦 Pwodwi fizik";

            case "digital":
                return "💾 Pwodwi dijital";

            case "service":
                return "🛠️ Sèvis";

            default:
                return "📦 Pwodwi";
        }

    }


    // =========================================================
    // PRICE
    // =========================================================

    function formatPrice(price) {

        const number =
            Number(price || 0);


        return (
            "💰 " +
            number.toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            ) +
            " HTG"
        );

    }


    // =========================================================
    // PLACEHOLDER
    // =========================================================

    function createPlaceholderImage() {

        const svg = `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="800"
                height="600"
                viewBox="0 0 800 600">

                <rect
                    width="800"
                    height="600"
                    fill="#f3f4f6"/>

                <text
                    x="400"
                    y="300"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    font-family="Arial"
                    font-size="28"
                    fill="#9ca3af">

                    Foto pa disponib

                </text>

            </svg>
        `;


        return (
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(svg)
        );

    }


    // =========================================================
    // LOADING
    // =========================================================

    function showLoading() {

        loadingState.style.display =
            "block";

        productsGrid.style.display =
            "none";

        emptyState.style.display =
            "none";
    }


    function hideLoading() {

        loadingState.style.display =
            "none";

        productsGrid.style.display =
            "grid";
    }


    // =========================================================
    // MESSAGE
    // =========================================================

    function showMessage(
        message,
        type = ""
    ) {

        formMessage.textContent =
            message;

        formMessage.className =
            "form-message " +
            type;

        formMessage.style.display =
            "block";


        setTimeout(
            () => {
                hideMessage();
            },
            5000
        );

    }


    function hideMessage() {

        formMessage.style.display =
            "none";

        formMessage.textContent =
            "";
    }


    // =========================================================
    // START
    // =========================================================

    await loadSellerProducts();

});
