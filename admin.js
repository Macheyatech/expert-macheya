(function () {

    "use strict";

    const supabase = window.supabaseClient;

    let currentUser = null;

    let adminProfile = null;

    let settings = {
        purchaseFeePercentage: 0,
        withdrawalFeePercentage: 0
    };


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function money(value) {

        const amount =
            Number(value) || 0;

        return new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount) + " HTG";

    }


    function formatDate(value) {

        if (!value) {
            return "Dat pa disponib";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);

    }


    function showMessage(text, type) {

        const element =
            document.getElementById(
                "adminSettingsMessage"
            );

        if (!element) {
            return;
        }

        element.textContent =
            text || "";

        element.className =
            "admin-form-message show " +
            (type || "");

    }


    function hideMessage() {

        const element =
            document.getElementById(
                "adminSettingsMessage"
            );

        if (!element) {
            return;
        }

        element.textContent = "";

        element.className =
            "admin-form-message";

    }


    function setLoading(visible) {

        const loading =
            document.getElementById(
                "adminLoading"
            );

        const content =
            document.getElementById(
                "adminContent"
            );

        if (loading) {
            loading.hidden = !visible;
        }

        if (content) {
            content.hidden = visible;
        }

    }


    function showAdminError(message) {

        const loading =
            document.getElementById(
                "adminLoading"
            );

        const content =
            document.getElementById(
                "adminContent"
            );

        const errorSection =
            document.getElementById(
                "adminError"
            );

        const errorMessage =
            document.getElementById(
                "adminErrorMessage"
            );


        if (loading) {
            loading.hidden = true;
        }


        if (content) {
            content.hidden = true;
        }


        if (errorMessage) {
            errorMessage.textContent =
                message ||
                "Aksè refize.";
        }


        if (errorSection) {
            errorSection.hidden = false;
        }

    }


    function hideAdminError() {

        const errorSection =
            document.getElementById(
                "adminError"
            );

        if (errorSection) {
            errorSection.hidden = true;
        }

    }


    async function verifyAdmin() {

        if (!supabase) {

            showAdminError(
                "Supabase client pa disponib."
            );

            return false;

        }


        try {

            const {
                data,
                error
            } =
                await supabase.auth.getUser();


            if (error) {

                console.error(
                    "Auth error:",
                    error
                );

                location.href =
                    "login.html";

                return false;

            }


            if (
                !data ||
                !data.user
            ) {

                location.href =
                    "login.html";

                return false;

            }


            currentUser =
                data.user;


            const {
                data: profile,
                error: profileError
            } =
                await supabase
                    .from("profiles")
                    .select(`
                        id,
                        role,
                        email,
                        name,
                        full_name,
                        nom_complet
                    `)
                    .eq(
                        "id",
                        currentUser.id
                    )
                    .maybeSingle();


            if (profileError) {

                console.error(
                    "Profile error:",
                    profileError
                );

                showAdminError(
                    "Nou pa kapab verifye pwofil admin lan."
                );

                return false;

            }


            if (!profile) {

                showAdminError(
                    "Pwofil itilizatè a pa jwenn."
                );

                return false;

            }


            const role =
                String(
                    profile.role || ""
                ).toLowerCase();


            if (
                role !== "admin" &&
                role !== "super_admin"
            ) {

                showAdminError(
                    "Aksè sa a rezève pou Super Admin sèlman."
                );

                return false;

            }


            adminProfile =
                profile;


            const roleBadge =
                document.getElementById(
                    "adminRoleBadge"
                );


            if (roleBadge) {

                roleBadge.textContent =
                    role === "super_admin"
                        ? "SUPER ADMIN"
                        : "ADMIN";

            }


            const adminName =
                profile.name ||
                profile.full_name ||
                profile.nom_complet ||
                profile.email ||
                currentUser.email ||
                "Super Admin";


            const welcomeText =
                document.querySelector(
                    ".admin-welcome p"
                );


            if (welcomeText) {

                welcomeText.textContent =
                    "Byenveni " +
                    adminName +
                    ". Jere aktivite platfòm nan, vandè, achtè, kòmand, wallet ak retrè.";

            }


            return true;


        } catch (error) {

            console.error(
                "Verify admin error:",
                error
            );

            showAdminError(
                "Yon pwoblèm rive pandan verifikasyon aksè admin lan."
            );

            return false;

        }

                     }
        async function loadSettings() {

        if (!supabase) {
            return;
        }


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("macheya_settings")
                    .select(`
                        id,
                        purchase_fee_percentage,
                        withdrawal_fee_percentage,
                        updated_at
                    `)
                    .eq(
                        "id",
                        1
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (data) {

                settings.purchaseFeePercentage =
                    Number(
                        data.purchase_fee_percentage
                    ) || 0;


                settings.withdrawalFeePercentage =
                    Number(
                        data.withdrawal_fee_percentage
                    ) || 0;

            }


            const purchaseInput =
                document.getElementById(
                    "purchaseFeePercentage"
                );


            const withdrawalInput =
                document.getElementById(
                    "withdrawalFeePercentage"
                );


            if (purchaseInput) {

                purchaseInput.value =
                    settings.purchaseFeePercentage;

            }


            if (withdrawalInput) {

                withdrawalInput.value =
                    settings.withdrawalFeePercentage;

            }


        } catch (error) {

            console.error(
                "Load settings error:",
                error
            );


            showMessage(
                "Nou pa kapab chaje paramèt komisyon yo.",
                "error"
            );

        }

    }


    function validPercentage(value) {

        const number =
            Number(value);


        if (!Number.isFinite(number)) {
            return false;
        }


        if (
            number < 0 ||
            number > 100
        ) {
            return false;
        }


        return true;

    }


    async function saveSettings() {

        hideMessage();


        const purchaseInput =
            document.getElementById(
                "purchaseFeePercentage"
            );


        const withdrawalInput =
            document.getElementById(
                "withdrawalFeePercentage"
            );


        const button =
            document.getElementById(
                "saveAdminSettings"
            );


        const purchaseFee =
            Number(
                purchaseInput?.value
            );


        const withdrawalFee =
            Number(
                withdrawalInput?.value
            );


        if (
            !validPercentage(
                purchaseFee
            )
        ) {

            showMessage(
                "Komisyon sou acha a dwe ant 0% ak 100%.",
                "error"
            );

            return;

        }


        if (
            !validPercentage(
                withdrawalFee
            )
        ) {

            showMessage(
                "Frè retrè a dwe ant 0% ak 100%.",
                "error"
            );

            return;

        }


        if (button) {

            button.disabled = true;

            button.textContent =
                "Ap sove...";

        }


        try {

            const {
                error
            } =
                await supabase
                    .from("macheya_settings")
                    .upsert(
                        {
                            id: 1,

                            purchase_fee_percentage:
                                purchaseFee,

                            withdrawal_fee_percentage:
                                withdrawalFee,

                            updated_at:
                                new Date().toISOString()
                        },
                        {
                            onConflict: "id"
                        }
                    );


            if (error) {
                throw error;
            }


            settings.purchaseFeePercentage =
                purchaseFee;


            settings.withdrawalFeePercentage =
                withdrawalFee;


            showMessage(
                "Paramèt Macheya yo sove avèk siksè.",
                "success"
            );


            if (
                document
                    .getElementById(
                        "adminWithdrawalsSection"
                    )
                    ?.hidden === false
            ) {

                await loadWithdrawalRequests();

            }


        } catch (error) {

            console.error(
                "Save settings error:",
                error
            );


            showMessage(
                error.message ||
                "Nou pa kapab sove paramèt yo.",
                "error"
            );


        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "💾 Sove paramèt yo";

            }

        }

    }


    async function loadStatistics() {

        if (!supabase) {
            return;
        }


        try {

            const [
                usersResult,
                sellersResult,
                buyersResult,
                productsResult,
                ordersResult,
                transactionsResult
            ] =
                await Promise.all([

                    supabase
                        .from("profiles")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        ),


                    supabase
                        .from("profiles")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        )
                        .eq(
                            "role",
                            "seller"
                        ),


                    supabase
                        .from("profiles")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        )
                        .eq(
                            "role",
                            "buyer"
                        ),


                    supabase
                        .from("products")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        ),


                    supabase
                        .from("orders")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        ),


                    supabase
                        .from("wallet_transactions")
                        .select(
                            "amount"
                        )

                ]);


            if (usersResult.error) {
                console.error(
                    "Users statistics:",
                    usersResult.error
                );
            }


            if (sellersResult.error) {
                console.error(
                    "Sellers statistics:",
                    sellersResult.error
                );
            }


            if (buyersResult.error) {
                console.error(
                    "Buyers statistics:",
                    buyersResult.error
                );
            }


            if (productsResult.error) {
                console.error(
                    "Products statistics:",
                    productsResult.error
                );
            }


            if (ordersResult.error) {
                console.error(
                    "Orders statistics:",
                    ordersResult.error
                );
            }


            if (transactionsResult.error) {
                console.error(
                    "Transactions statistics:",
                    transactionsResult.error
                );
            }


            const usersCount =
                usersResult.count || 0;


            const sellersCount =
                sellersResult.count || 0;


            const buyersCount =
                buyersResult.count || 0;


            const productsCount =
                productsResult.count || 0;


            const ordersCount =
                ordersResult.count || 0;


            const transactionVolume =
                (transactionsResult.data || [])
                    .reduce(
                        function (
                            total,
                            transaction
                        ) {

                            return total +
                                (
                                    Number(
                                        transaction.amount
                                    ) || 0
                                );

                        },
                        0
                    );


            const usersElement =
                document.getElementById(
                    "adminTotalUsers"
                );


            const sellersElement =
                document.getElementById(
                    "adminTotalSellers"
                );


            const buyersElement =
                document.getElementById(
                    "adminTotalBuyers"
                );


            const productsElement =
                document.getElementById(
                    "adminTotalProducts"
                );


            const ordersElement =
                document.getElementById(
                    "adminTotalOrders"
                );


            const volumeElement =
                document.getElementById(
                    "adminTransactionVolume"
                );


            if (usersElement) {

                usersElement.textContent =
                    usersCount;

            }


            if (sellersElement) {

                sellersElement.textContent =
                    sellersCount;

            }


            if (buyersElement) {

                buyersElement.textContent =
                    buyersCount;

            }


            if (productsElement) {

                productsElement.textContent =
                    productsCount;

            }


            if (ordersElement) {

                ordersElement.textContent =
                    ordersCount;

            }


            if (volumeElement) {

                volumeElement.textContent =
                    money(
                        transactionVolume
                    );

            }


        } catch (error) {

            console.error(
                "Statistics error:",
                error
            );

        }

    }


    function showAdminSection(sectionName) {

        const sections = {

            users:
                "adminUsersSection",

            products:
                "adminProductsSection",

            orders:
                "adminOrdersSection",

            wallets:
                "adminWalletsSection",

            withdrawals:
                "adminWithdrawalsSection",

            settings:
                "adminSettingsSection"

        };


        Object.values(sections).forEach(
            function (id) {

                const section =
                    document.getElementById(id);


                if (section) {

                    section.hidden = true;

                }

            }
        );


        const targetId =
            sections[sectionName];


        if (!targetId) {
            return;
        }


        const target =
            document.getElementById(
                targetId
            );


        if (!target) {
            return;
        }


        target.hidden = false;


        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        if (sectionName === "users") {
            loadUsers();
        }


        if (sectionName === "products") {
            loadProducts();
        }


        if (sectionName === "orders") {
            loadOrders();
        }


        if (sectionName === "wallets") {
            loadWallets();
        }


        if (sectionName === "withdrawals") {
            loadWithdrawalRequests();
        }


        if (sectionName === "settings") {
            loadSettings();
        }

    }


    function setupAdminNavigation() {

        const buttons =
            document.querySelectorAll(
                ".admin-menu-button"
            );


        buttons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const section =
                            button.dataset.section;


                        if (!section) {
                            return;
                        }


                        showAdminSection(
                            section
                        );

                    }
                );

            }
        );

        }
        async function loadUsers() {

        const container =
            document.getElementById(
                "adminUsersList"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">
                    ⏳
                </div>

                <p>
                    Ap chaje itilizatè yo...
                </p>
            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .select(`
                        id,
                        name,
                        full_name,
                        nom_complet,
                        email,
                        role,
                        created_at
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(100);


            if (error) {
                throw error;
            }


            renderUsers(
                data || []
            );


        } catch (error) {

            console.error(
                "Admin users error:",
                error
            );


            container.innerHTML = `
                <div class="admin-empty">
                    <div class="admin-empty-icon">
                        ⚠️
                    </div>

                    <p>
                        Nou pa kapab chaje itilizatè yo.
                    </p>

                    <small>
                        ${escapeHtml(
                            error.message ||
                            "Erè enkoni."
                        )}
                    </small>
                </div>
            `;

        }

    }


    function renderUsers(users) {

        const container =
            document.getElementById(
                "adminUsersList"
            );


        if (!container) {
            return;
        }


        if (!users.length) {

            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        👥
                    </div>

                    <p>
                        Pa gen itilizatè pou kounya.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML = "";


        users.forEach(
            function (user) {

                const role =
                    String(
                        user.role ||
                        "buyer"
                    ).toLowerCase();


                const name =
                    user.name ||
                    user.full_name ||
                    user.nom_complet ||
                    "Itilizatè";


                const email =
                    user.email ||
                    "Pa gen email";


                let roleText =
                    "Achtè";


                if (
                    role === "seller"
                ) {

                    roleText =
                        "Vandè";

                }


                if (
                    role === "admin" ||
                    role === "super_admin"
                ) {

                    roleText =
                        "Admin";

                }


                const firstLetter =
                    String(name)
                        .trim()
                        .charAt(0)
                        .toUpperCase() ||
                    "U";


                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "admin-user-item";


                item.innerHTML = `

                    <div class="admin-user-avatar">
                        ${escapeHtml(
                            firstLetter
                        )}
                    </div>


                    <div class="admin-user-main">

                        <strong>
                            ${escapeHtml(
                                name
                            )}
                        </strong>


                        <span>
                            ${escapeHtml(
                                email
                            )}
                        </span>


                        <small>
                            ID:
                            ${escapeHtml(
                                user.id
                            )}
                        </small>

                    </div>


                    <div class="admin-user-side">

                        <span
                            class="admin-role ${escapeHtml(
                                role
                            )}"
                        >
                            ${escapeHtml(
                                roleText
                            )}
                        </span>


                        <span
                            class="admin-user-date"
                        >
                            ${escapeHtml(
                                formatDate(
                                    user.created_at
                                )
                            )}
                        </span>

                    </div>

                `;


                container.appendChild(
                    item
                );

            }
        );

    }


    async function loadProducts() {

        const container =
            document.getElementById(
                "adminProductsList"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="admin-empty">

                <div class="admin-empty-icon">
                    ⏳
                </div>

                <p>
                    Ap chaje pwodwi yo...
                </p>

            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("products")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(100);


            if (error) {
                throw error;
            }


            renderProducts(
                data || []
            );


        } catch (error) {

            console.error(
                "Admin products error:",
                error
            );


            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        ⚠️
                    </div>

                    <p>
                        Nou pa kapab chaje pwodwi yo.
                    </p>

                    <small>
                        ${escapeHtml(
                            error.message ||
                            "Erè enkoni."
                        )}
                    </small>

                </div>
            `;

        }

    }


    function getProductImage(product) {

        return (
            product.image_url ||
            product.image ||
            product.photo_url ||
            product.product_image ||
            product.imageUrl ||
            ""
        );

    }


    function getProductName(product) {

        return (
            product.name ||
            product.product_name ||
            product.title ||
            "Pwodwi san non"
        );

    }


    function getProductPrice(product) {

        return (
            product.price ??
            product.product_price ??
            product.amount ??
            0
        );

    }


    function renderProducts(products) {

        const container =
            document.getElementById(
                "adminProductsList"
            );


        if (!container) {
            return;
        }


        if (!products.length) {

            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        📦
                    </div>

                    <p>
                        Pa gen pwodwi pou kounya.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML = "";


        products.forEach(
            function (product) {

                const image =
                    getProductImage(
                        product
                    );


                const name =
                    getProductName(
                        product
                    );


                const price =
                    getProductPrice(
                        product
                    );


                const status =
                    String(
                        product.status ||
                        "published"
                    ).toLowerCase();


                const sellerId =
                    product.seller_id ||
                    product.user_id ||
                    product.owner_id ||
                    "—";


                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "admin-product-item";


                item.innerHTML = `

                    <div class="admin-product-image">

                        ${
                            image
                                ? `
                                    <img
                                        src="${escapeHtml(
                                            image
                                        )}"
                                        alt="${escapeHtml(
                                            name
                                        )}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div
                                        class="admin-product-placeholder"
                                    >
                                        📦
                                    </div>
                                `
                        }

                    </div>


                    <div class="admin-product-main">

                        <strong>
                            ${escapeHtml(
                                name
                            )}
                        </strong>


                        <span
                            class="admin-product-price"
                        >
                            ${money(
                                price
                            )}
                        </span>


                        <span>
                            Kategori:
                            ${escapeHtml(
                                product.category ||
                                "—"
                            )}
                        </span>


                        <small>
                            Vandè:
                            ${escapeHtml(
                                sellerId
                            )}
                        </small>

                    </div>


                    <div class="admin-product-side">

                        <span
                            class="admin-product-status ${escapeHtml(
                                status
                            )}"
                        >
                            ${escapeHtml(
                                status
                            )}
                        </span>


                        <span
                            class="admin-product-date"
                        >
                            ${escapeHtml(
                                formatDate(
                                    product.created_at
                                )
                            )}
                        </span>

                    </div>

                `;


                container.appendChild(
                    item
                );

            }
        );

    }


    async function loadOrders() {

        const container =
            document.getElementById(
                "adminOrdersList"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="admin-empty">

                <div class="admin-empty-icon">
                    ⏳
                </div>

                <p>
                    Ap chaje kòmand yo...
                </p>

            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("orders")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(100);


            if (error) {
                throw error;
            }


            renderOrders(
                data || []
            );


        } catch (error) {

            console.error(
                "Admin orders error:",
                error
            );


            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        ⚠️
                    </div>

                    <p>
                        Nou pa kapab chaje kòmand yo.
                    </p>

                    <small>
                        ${escapeHtml(
                            error.message ||
                            "Erè enkoni."
                        )}
                    </small>

                </div>
            `;

        }

    }


    function renderOrders(orders) {

        const container =
            document.getElementById(
                "adminOrdersList"
            );


        if (!container) {
            return;
        }


        if (!orders.length) {

            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        🛒
                    </div>

                    <p>
                        Pa gen kòmand pou kounya.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML = "";


        orders.forEach(
            function (order) {

                const status =
                    String(
                        order.status ||
                        "pending"
                    ).toLowerCase();


                const amount =
                    Number(
                        order.total_amount ??
                        order.total ??
                        order.amount ??
                        0
                    ) || 0;


                const orderId =
                    String(
                        order.id ||
                        ""
                    );


                const buyerId =
                    order.buyer_id ||
                    order.user_id ||
                    order.customer_id ||
                    "—";


                const sellerId =
                    order.seller_id ||
                    "—";


                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "admin-order-item";


                item.innerHTML = `

                    <div class="admin-order-icon">
                        🛒
                    </div>


                    <div class="admin-order-main">

                        <strong>
                            Kòmand #${escapeHtml(
                                orderId.slice(
                                    0,
                                    12
                                )
                            )}
                        </strong>


                        <span>
                            Achtè:
                            ${escapeHtml(
                                buyerId
                            )}
                        </span>


                        <span>
                            Vandè:
                            ${escapeHtml(
                                sellerId
                            )}
                        </span>


                        <small>
                            ${escapeHtml(
                                formatDate(
                                    order.created_at
                                )
                            )}
                        </small>

                    </div>


                    <div class="admin-order-side">

                        <strong>
                            ${money(
                                amount
                            )}
                        </strong>


                        <span
                            class="admin-order-status ${escapeHtml(
                                status
                            )}"
                        >
                            ${escapeHtml(
                                status
                            )}
                        </span>

                    </div>

                `;


                container.appendChild(
                    item
                );

            }
        );

            async function loadWallets() {

        const container =
            document.getElementById(
                "adminWalletsList"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="admin-empty">

                <div class="admin-empty-icon">
                    ⏳
                </div>

                <p>
                    Ap chaje wallet yo...
                </p>

            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("wallets")
                    .select(`
                        id,
                        user_id,
                        balance,
                        currency,
                        updated_at
                    `)
                    .order(
                        "updated_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(100);


            if (error) {
                throw error;
            }


            renderWallets(
                data || []
            );


        } catch (error) {

            console.error(
                "Admin wallets error:",
                error
            );


            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        ⚠️
                    </div>

                    <p>
                        Nou pa kapab chaje wallet yo.
                    </p>

                    <small>
                        ${escapeHtml(
                            error.message ||
                            "Erè enkoni."
                        )}
                    </small>

                </div>
            `;

        }

    }


    function renderWallets(wallets) {

        const container =
            document.getElementById(
                "adminWalletsList"
            );


        if (!container) {
            return;
        }


        if (!wallets.length) {

            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        💰
                    </div>

                    <p>
                        Pa gen wallet pou kounya.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML = "";


        wallets.forEach(
            function (wallet) {

                const balance =
                    Number(
                        wallet.balance
                    ) || 0;


                const currency =
                    wallet.currency ||
                    "HTG";


                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "admin-wallet-item";


                item.innerHTML = `

                    <div class="admin-wallet-icon">
                        💰
                    </div>


                    <div class="admin-wallet-main">

                        <strong>
                            Wallet
                        </strong>


                        <span>
                            User:
                            ${escapeHtml(
                                wallet.user_id ||
                                "—"
                            )}
                        </span>


                        <small>
                            ID:
                            ${escapeHtml(
                                wallet.id ||
                                "—"
                            )}
                        </small>

                    </div>


                    <div class="admin-wallet-side">

                        <strong>
                            ${money(
                                balance
                            )}
                        </strong>


                        <span>
                            ${escapeHtml(
                                currency
                            )}
                        </span>


                        <small>
                            Mizajou:
                            ${escapeHtml(
                                formatDate(
                                    wallet.updated_at
                                )
                            )}
                        </small>

                    </div>

                `;


                container.appendChild(
                    item
                );

            }
        );

    }


    async function loadWithdrawalRequests() {

        const container =
            document.getElementById(
                "adminWithdrawalsList"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="admin-empty">

                <div class="admin-empty-icon">
                    ⏳
                </div>

                <p>
                    Ap chaje demann retrè yo...
                </p>

            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("withdrawal_requests")
                    .select(`
                        id,
                        user_id,
                        wallet_id,
                        amount,
                        method,
                        phone_number,
                        status,
                        created_at
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(100);


            if (error) {
                throw error;
            }


            renderWithdrawals(
                data || []
            );


        } catch (error) {

            console.error(
                "Admin withdrawals error:",
                error
            );


            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        ⚠️
                    </div>

                    <p>
                        Nou pa kapab chaje demann retrè yo.
                    </p>

                    <small>
                        ${escapeHtml(
                            error.message ||
                            "Erè enkoni."
                        )}
                    </small>

                </div>
            `;

        }

    }


    function renderWithdrawals(requests) {

        const container =
            document.getElementById(
                "adminWithdrawalsList"
            );


        if (!container) {
            return;
        }


        if (!requests.length) {

            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        📭
                    </div>

                    <p>
                        Pa gen demann retrè pou kounya.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML = "";


        requests.forEach(
            function (request) {

                const status =
                    String(
                        request.status ||
                        "pending"
                    ).toLowerCase();


                const amount =
                    Number(
                        request.amount
                    ) || 0;


                const fee =
                    amount *
                    (
                        settings.withdrawalFeePercentage /
                        100
                    );


                const net =
                    Math.max(
                        0,
                        amount - fee
                    );


                const statusText =
                    status === "approved"
                        ? "Apwouve"
                        : status === "rejected"
                            ? "Rejte"
                            : "An atant";


                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "admin-withdrawal-item";


                item.innerHTML = `

                    <div class="admin-withdrawal-top">

                        <div>

                            <strong>
                                ${money(
                                    amount
                                )}
                            </strong>


                            <span>
                                Demann retrè
                            </span>

                        </div>


                        <span
                            class="admin-withdrawal-status ${escapeHtml(
                                status
                            )}"
                        >
                            ${escapeHtml(
                                statusText
                            )}
                        </span>

                    </div>


                    <div class="admin-withdrawal-details">

                        <div>

                            <span>
                                User ID
                            </span>

                            <strong>
                                ${escapeHtml(
                                    request.user_id ||
                                    "—"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Wallet ID
                            </span>

                            <strong>
                                ${escapeHtml(
                                    request.wallet_id ||
                                    "—"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Metòd
                            </span>

                            <strong>
                                ${escapeHtml(
                                    request.method ||
                                    "—"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Nimewo
                            </span>

                            <strong>
                                ${escapeHtml(
                                    request.phone_number ||
                                    "—"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Frè Macheya
                            </span>

                            <strong>
                                ${money(
                                    fee
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Montan net
                            </span>

                            <strong>
                                ${money(
                                    net
                                )}
                            </strong>

                        </div>

                    </div>


                    <div class="admin-withdrawal-footer">

                        <span>
                            ${escapeHtml(
                                formatDate(
                                    request.created_at
                                )
                            )}
                        </span>


                        ${
                            status === "pending"
                                ? `
                                    <div
                                        class="admin-withdrawal-actions"
                                    >

                                        <button
                                            type="button"
                                            class="admin-approve-button"
                                            data-withdrawal-id="${escapeHtml(
                                                request.id
                                            )}"
                                        >
                                            ✓ Apwouve
                                        </button>


                                        <button
                                            type="button"
                                            class="admin-reject-button"
                                            data-withdrawal-id="${escapeHtml(
                                                request.id
                                            )}"
                                        >
                                            ✕ Rejte
                                        </button>

                                    </div>
                                `
                                : ""
                        }

                    </div>

                `;


                container.appendChild(
                    item
                );

            }
        );


        setupWithdrawalActions();

    }


    function setupWithdrawalActions() {

        const approveButtons =
            document.querySelectorAll(
                ".admin-approve-button"
            );


        const rejectButtons =
            document.querySelectorAll(
                ".admin-reject-button"
            );


        approveButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.dataset
                                .withdrawalId;


                        if (!id) {
                            return;
                        }


                        updateWithdrawalStatus(
                            id,
                            "approved"
                        );

                    }
                );

            }
        );


        rejectButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.dataset
                                .withdrawalId;


                        if (!id) {
                            return;
                        }


                        updateWithdrawalStatus(
                            id,
                            "rejected"
                        );

                    }
                );

            }
        );

    }


    async function updateWithdrawalStatus(
        withdrawalId,
        newStatus
    ) {

        if (!withdrawalId) {
            return;
        }


        if (
            newStatus !== "approved" &&
            newStatus !== "rejected"
        ) {
            return;
        }


        const action =
            newStatus === "approved"
                ? "apwouve"
                : "rejte";


        const confirmed =
            window.confirm(
                `Èske ou sèten ou vle ${action} demann retrè sa a?`
            );


        if (!confirmed) {
            return;
        }


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("withdrawal_requests")
                    .update({
                        status:
                            newStatus
                    })
                    .eq(
                        "id",
                        withdrawalId
                    )
                    .select()
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!data) {

                throw new Error(
                    "Demann retrè a pa jwenn oswa ou pa gen pèmisyon pou modifye li."
                );

            }


            showMessage(
                newStatus === "approved"
                    ? "Demann retrè a apwouve avèk siksè."
                    : "Demann retrè a rejte avèk siksè.",
                "success"
            );


            await Promise.all([
                loadWithdrawalRequests(),
                loadStatistics()
            ]);


        } catch (error) {

            console.error(
                "Update withdrawal status error:",
                error
            );


            showMessage(
                error.message ||
                "Nou pa kapab modifye demann retrè a.",
                "error"
            );

        }

                    }

        

}
        function setupSettings() {

        const button =
            document.getElementById(
                "saveAdminSettings"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            function () {

                saveSettings();

            }
        );

    }


    function setupLogout() {

        const button =
            document.getElementById(
                "adminLogoutButton"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async function () {

                if (
                    button.disabled
                ) {
                    return;
                }


                button.disabled = true;


                button.textContent =
                    "Ap dekonekte...";


                try {

                    if (!supabase) {

                        throw new Error(
                            "Supabase client pa disponib."
                        );

                    }


                    const {
                        error
                    } =
                        await supabase.auth.signOut();


                    if (error) {
                        throw error;
                    }


                    window.location.href =
                        "login.html";


                } catch (error) {

                    console.error(
                        "Admin logout error:",
                        error
                    );


                    button.disabled = false;


                    button.textContent =
                        "Dekonekte";


                    showMessage(
                        "Nou pa kapab dekonekte kounya.",
                        "error"
                    );

                }

            }
        );

    }


    function setupRefreshOnVisibility() {

        let lastRefresh =
            0;


        document.addEventListener(
            "visibilitychange",
            async function () {

                if (
                    document.visibilityState !==
                    "visible"
                ) {
                    return;
                }


                const now =
                    Date.now();


                if (
                    now - lastRefresh <
                    30000
                ) {
                    return;
                }


                lastRefresh =
                    now;


                if (!currentUser) {
                    return;
                }


                try {

                    await loadStatistics();


                    const withdrawalsSection =
                        document.getElementById(
                            "adminWithdrawalsSection"
                        );


                    if (
                        withdrawalsSection &&
                        !withdrawalsSection.hidden
                    ) {

                        await loadWithdrawalRequests();

                    }

                } catch (error) {

                    console.error(
                        "Admin refresh error:",
                        error
                    );

                }

            }
        );

    }


    function setupAdminKeyboard() {

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }


                const sections = [
                    "adminUsersSection",
                    "adminProductsSection",
                    "adminOrdersSection",
                    "adminWalletsSection",
                    "adminWithdrawalsSection",
                    "adminSettingsSection"
                ];


                let openSection =
                    false;


                sections.forEach(
                    function (id) {

                        const section =
                            document.getElementById(
                                id
                            );


                        if (
                            section &&
                            !section.hidden
                        ) {

                            section.hidden =
                                true;

                            openSection =
                                true;

                        }

                    }
                );


                if (openSection) {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }

            }
        );

    }


    async function initializeAdmin() {

        setLoading(true);

        hideAdminError();

        hideMessage();


        if (!supabase) {

            setLoading(false);

            showAdminError(
                "Supabase client pa disponib."
            );

            return;

        }


        try {

            const isAdmin =
                await verifyAdmin();


            if (!isAdmin) {
                return;
            }


            setupAdminNavigation();

            setupSettings();

            setupLogout();

            setupRefreshOnVisibility();

            setupAdminKeyboard();


            await Promise.all([
                loadStatistics(),
                loadSettings()
            ]);


            setLoading(false);


            const content =
                document.getElementById(
                    "adminContent"
                );


            if (content) {

                content.hidden =
                    false;

            }


        } catch (error) {

            console.error(
                "Admin initialization error:",
                error
            );


            setLoading(false);


            showAdminError(
                "Yon erè rive pandan dashboard Super Admin lan t ap prepare."
            );

        }

    }


    window.macheyaAdmin = {

        refresh: async function () {

            await Promise.all([
                loadStatistics(),
                loadSettings()
            ]);

        },


        refreshUsers:
            loadUsers,


        refreshProducts:
            loadProducts,


        refreshOrders:
            loadOrders,


        refreshWallets:
            loadWallets,


        refreshWithdrawals:
            loadWithdrawalRequests,


        showSection:
            showAdminSection

    };

     if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAdmin
        );

    } else {

        initializeAdmin();

    }

})();
