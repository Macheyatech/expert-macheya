document.addEventListener("DOMContentLoaded", async () => {

    const supabase = window.supabaseClient;

    if (!supabase) {
        showMessage(
            "Supabase pa konekte. Verifye supabase-config.js.",
            "error"
        );
        hideLoading();
        return;
    }

    const productsGrid = document.getElementById("productsGrid");
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const formMessage = document.getElementById("formMessage");
    const totalProducts = document.getElementById("totalProducts");
    const activeProducts = document.getElementById("activeProducts");
    const totalStock = document.getElementById("totalStock");

    async function getCurrentUser() {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            console.error("GET USER ERROR:", error);
            throw new Error("Nou pa ka verifye kont ou.");
        }

        if (!data.user) {
            window.location.href = "login.html?role=seller";
            return null;
        }

        return data.user;
    }

    async function verifySellerRole(userId) {
        const { data: profile, error } = await supabase
            .from("profiles")
            .select("role, est_vendeur")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.error("PROFILE ERROR:", error);
            throw new Error("Nou pa ka verifye wòl ou.");
        }

        if (!profile) {
            throw new Error("Pwofil ou pa jwenn.");
        }

        const role = String(profile.role || "").toLowerCase().trim();
        const isSeller = profile.est_vendeur === true;

        if (role !== "vendeur" && role !== "seller" && !isSeller) {
            throw new Error("Ou pa gen pèmisyon pou wè paj vandè sa a.");
        }

        return profile;
    }

    async function loadSellerProducts() {
        try {
            showLoading();
            hideMessage();

            const user = await getCurrentUser();
            if (!user) return;

            await verifySellerRole(user.id);

            console.log("SELLER ID:", user.id);

            const { data: products, error } = await supabase
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
                .eq("seller_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("LOAD PRODUCTS ERROR:", error);
                throw new Error("Pwodwi yo pa t ka chaje: " + error.message);
            }

            console.log("SELLER PRODUCTS:", products);

            updateStatistics(products || []);
            renderProducts(products || []);

        } catch (error) {
            console.error("SELLER PAGE ERROR:", error);

            productsGrid.innerHTML = "";
            emptyState.style.display = "none";

            showMessage(
                error.message || "Yon erè rive pandan pwodwi yo t ap chaje.",
                "error"
            );

            if (error.message.includes("pèmisyon")) {
                setTimeout(() => {
                    window.location.href = "marketplace.html";
                }, 2000);
            }

        } finally {
            hideLoading();
        }
    }

    function updateStatistics(products) {
        const total = products.length;

        const active = products.filter(
            product => product.is_active !== false
        ).length;

        const stock = products.reduce((totalStockValue, product) => {
            if (product.product_type === "physical") {
                return totalStockValue + Number(product.stock || 0);
            }
            return totalStockValue;
        }, 0);

        totalProducts.textContent = total;
        activeProducts.textContent = active;
        totalStock.textContent = stock;
    }

    function renderProducts(products) {
        productsGrid.innerHTML = "";

        if (!products.length) {
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";

        products.forEach(product => {
            const card = createProductCard(product);
            productsGrid.appendChild(card);
        });
    }

    function createProductCard(product) {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageContainer = document.createElement("div");
        imageContainer.className = "product-image-container";

        const image = document.createElement("img");
        image.className = "product-image";
        image.alt = product.name || "Foto pwodwi";
        image.loading = "lazy";

        if (product.image_url) {
            image.src = product.image_url;
        } else {
            image.src = createPlaceholderImage();
        }

        image.addEventListener("error", () => {
            image.src = createPlaceholderImage();
        });

        imageContainer.appendChild(image);

        const content = document.createElement("div");
        content.className = "product-content";

        const name = document.createElement("h2");
        name.className = "product-name";
        name.textContent = product.name || "Pwodwi san non";

        if (!product.is_active) {
            name.style.opacity = "0.5";
        }

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = formatPrice(product.price);

        const category = document.createElement("div");
        category.className = "product-category";
        category.textContent = "📂 " + (product.category || "Lòt");

        const type = document.createElement("span");
        type.className = "product-type";
        type.textContent = getProductTypeLabel(product.product_type);

        const stock = document.createElement("div");
        stock.className = "product-stock";

        if (product.product_type === "physical") {
            stock.textContent = "📦 Stock: " + Number(product.stock || 0);
        } else if (product.product_type === "digital") {
            stock.textContent = "💾 Pwodwi dijital";
        } else if (product.product_type === "service") {
            stock.textContent = "🛠️ Sèvis";
        } else {
            stock.textContent = "📦 Disponib";
        }

        const status = document.createElement("div");
        status.className = "product-status";
        status.textContent = product.is_active ? "🟢 Aktif" : "🔴 Dezaktive";
        status.style.color = product.is_active ? "#10b981" : "#ef4444";
        status.style.fontWeight = "600";
        status.style.fontSize = "13px";
        status.style.marginTop = "8px";

        const actions = document.createElement("div");
        actions.className = "product-actions";

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "view-button";
        viewButton.textContent = "👁 Gade";

        viewButton.addEventListener("click", () => {
            if (!product.id) return;
            window.location.href = "product-view.html?id=" + encodeURIComponent(product.id);
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "✏️ Modifye";

        editButton.addEventListener("click", () => {
            if (!product.id) return;
            window.location.href = "addproduct.html?id=" + encodeURIComponent(product.id);
        });

        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = "toggle-button";
        toggleButton.textContent = product.is_active ? "⏸ Dezaktive" : "▶ Aktive";

        toggleButton.addEventListener("click", async () => {
            await toggleProductActive(product, toggleButton);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "🗑 Efase";

        deleteButton.addEventListener("click", async () => {
            await deleteProduct(product, deleteButton);
        });

        actions.appendChild(viewButton);
        actions.appendChild(editButton);
        actions.appendChild(toggleButton);
        actions.appendChild(deleteButton);

        content.appendChild(name);
        content.appendChild(price);
        content.appendChild(category);
        content.appendChild(type);
        content.appendChild(stock);
        content.appendChild(status);
        content.appendChild(actions);

        card.appendChild(imageContainer);
        card.appendChild(content);

        return card;
    }

    async function toggleProductActive(product, button) {
        try {
            button.disabled = true;
            const originalText = button.textContent;
            button.textContent = "Ap chanje...";

            const user = await getCurrentUser();
            if (!user) return;

            const newStatus = !product.is_active;

            const { error } = await supabase
                .from("products")
                .update({ is_active: newStatus })
                .eq("id", product.id)
                .eq("seller_id", user.id);

            if (error) {
                console.error("TOGGLE PRODUCT ERROR:", error);
                throw new Error("Pa t ka chanje estati a: " + error.message);
            }

            showMessage(
                newStatus ? "Pwodwi a aktive avèk siksè." : "Pwodwi a dezaktive avèk siksè.",
                "success"
            );

            await loadSellerProducts();

        } catch (error) {
            console.error("TOGGLE ERROR:", error);
            showMessage(error.message || "Pa t ka chanje estati a.", "error");

            button.disabled = false;
            button.textContent = product.is_active ? "⏸ Dezaktive" : "▶ Aktive";
        }
    }

    async function deleteProduct(product, button) {
        const productName = product.name || "pwodwi sa a";

        const confirmed = window.confirm(
            `Èske ou sèten ou vle efase "${productName}"?\n\n` +
            `ATANSYON: Efase yon pwodwi pa ka defèt. Si gen kòmand ki refere l, sa ka kreye pwoblèm.`
        );

        if (!confirmed) return;

        try {
            button.disabled = true;
            button.textContent = "Ap efase...";

            const user = await getCurrentUser();
            if (!user) return;

            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", product.id)
                .eq("seller_id", user.id);

            if (error) {
                console.error("DELETE PRODUCT ERROR:", error);
                throw new Error("Pwodwi a pa t ka efase: " + error.message);
            }

            showMessage("Pwodwi a efase avèk siksè.", "success");
            await loadSellerProducts();

        } catch (error) {
            console.error("DELETE ERROR:", error);
            showMessage(error.message || "Pwodwi a pa t ka efase.", "error");

            button.disabled = false;
            button.textContent = "🗑 Efase";
        }
    }

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

    function formatPrice(price) {
        const number = Number(price || 0);
        return "💰 " + new Intl.NumberFormat("fr-FR").format(number) + " HTG";
    }

    function createPlaceholderImage() {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
                <rect width="800" height="600" fill="#f3f4f6"/>
                <text x="400" y="300" text-anchor="middle" dominant-baseline="middle" 
                      font-family="Arial" font-size="28" fill="#9ca3af">
                    Foto pa disponib
                </text>
            </svg>
        `;
        return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
    }

    function showLoading() {
        loadingState.style.display = "block";
        productsGrid.style.display = "none";
        emptyState.style.display = "none";
    }

    function hideLoading() {
        loadingState.style.display = "none";
        productsGrid.style.display = "grid";
    }

    function showMessage(message, type = "") {
        formMessage.textContent = message;
        formMessage.className = "form-message " + type;
        formMessage.style.display = "block";

        setTimeout(() => {
            hideMessage();
        }, 5000);
    }

    function hideMessage() {
        formMessage.style.display = "none";
        formMessage.textContent = "";
    }

    await loadSellerProducts();

});
