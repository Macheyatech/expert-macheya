(function () {
    "use strict";

    const supabase = window.supabaseClient;

    if (!supabase) {
        console.error("Supabase client pa disponib.");
        return;
    }

    const state = {
        user: null,
        settings: {
            fee_percentage: 0,
            withdrawal_fee_percent: 2.75,
            moncash_number: "",
            natcash_number: ""
        },
        users: [],
        products: [],
        orders: [],
        wallets: [],
        deposits: [],
        withdrawals: [],
        loading: false
    };

    const $ = id => document.getElementById(id);

    const elements = {
        loading: $("adminLoading"),
        content: $("adminContent"),
        error: $("adminError"),
        errorMessage: $("adminErrorMessage"),

        roleBadge: $("adminRoleBadge"),
        logoutButton: $("adminLogoutButton"),

        totalUsers: $("adminTotalUsers"),
        totalSellers: $("adminTotalSellers"),
        totalBuyers: $("adminTotalBuyers"),
        totalProducts: $("adminTotalProducts"),
        totalOrders: $("adminTotalOrders"),
        transactionVolume: $("adminTransactionVolume"),

        usersSection: $("adminUsersSection"),
        productsSection: $("adminProductsSection"),
        ordersSection: $("adminOrdersSection"),
        walletsSection: $("adminWalletsSection"),
        withdrawalsSection: $("adminWithdrawalsSection"),
        settingsSection: $("adminSettingsSection"),

        usersList: $("adminUsersList"),
        productsList: $("adminProductsList"),
        ordersList: $("adminOrdersList"),
        walletsList: $("adminWalletsList"),
        withdrawalsList: $("adminWithdrawalsList"),
        recentActivity: $("adminRecentActivity"),

        purchaseFee: $("purchaseFeePercentage"),
        withdrawalFee: $("withdrawalFeePercentage"),
        settingsMessage: $("adminSettingsMessage"),
        saveSettings: $("saveAdminSettings")
    };

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatMoney(value) {
        const amount = Number(value) || 0;

        return new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + " HTG";
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    }

    function getStatusLabel(status) {
        const labels = {
            pending: "An atant",
            approved: "Apwouve",
            rejected: "Rejte",
            delivered: "Livre",
            completed: "Fini",
            cancelled: "Anile",
            paid: "Peye",
            processing: "An tretman"
        };

        return labels[String(status || "").toLowerCase()]
            || status
            || "—";
    }

    function getStatusClass(status) {
        return "status-" + String(status || "unknown")
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "");
    }

    function showLoading(show) {
        state.loading = show;

        if (elements.loading) {
            elements.loading.hidden = !show;
            elements.loading.style.display =
                show ? "flex" : "";
        }

        if (elements.content) {
            elements.content.hidden = show;
        }
    }

    function showError(message) {
        console.error("Macheya Admin:", message);

        if (elements.errorMessage) {
            elements.errorMessage.textContent =
                message || "Yon erè rive.";
        }

        if (elements.error) {
            elements.error.hidden = false;
        }

        if (elements.content) {
            elements.content.hidden = true;
        }
    }

    function hideError() {
        if (elements.error) {
            elements.error.hidden = true;
        }

        if (elements.errorMessage) {
            elements.errorMessage.textContent = "";
        }
    }

    function showSettingsMessage(message, type) {
        if (!elements.settingsMessage) {
            return;
        }

        elements.settingsMessage.textContent = message;
        elements.settingsMessage.className =
            "admin-form-message " + (type || "");
    }

    function getUserName(user) {
        return (
            user?.full_name ||
            user?.name ||
            user?.nom_complet ||
            user?.username ||
            user?.email ||
            "Itilizatè"
        );
    }

    function getProductName(product) {
        return (
            product?.name ||
            product?.product_name ||
            "Pwodwi"
        );
    }

    function getOrderTotal(order) {
        return Number(
            order?.total ??
            order?.total_amount ??
            0
        ) || 0;
    }

    async function getCurrentUser() {
        const { data, error } =
            await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        if (!data?.user) {
            window.location.href = "login.html";
            return null;
        }

        state.user = data.user;

        return data.user;
    }

    async function verifySuperAdmin() {
        const { data, error } =
            await supabase.rpc("is_super_admin");

        if (error) {
            throw error;
        }

        if (data !== true) {
            throw new Error(
                "Aksè refize. Se Super Admin sèlman ki ka antre isit la."
            );
        }

        return true;
    }

    async function loadSettings() {
        const { data, error } =
            await supabase.rpc("get_admin_settings");

        if (error) {
            throw error;
        }

        if (Array.isArray(data) && data.length) {
            const settings = data[0];

            state.settings.withdrawal_fee_percent =
                Number(
                    settings.withdrawal_fee_percent ?? 2.75
                );

            state.settings.moncash_number =
                settings.moncash_number || "";

            state.settings.natcash_number =
                settings.natcash_number || "";
        }

        const {
            data: macheyaSettings,
            error: macheyaError
        } = await supabase
            .from("macheya_settings")
            .select("fee_percentage")
            .eq("id", 1)
            .maybeSingle();

        if (macheyaError) {
            throw macheyaError;
        }

        if (macheyaSettings) {
            state.settings.fee_percentage =
                Number(
                    macheyaSettings.fee_percentage ?? 0
                );
        }

        renderSettings();
    }

    function renderSettings() {
        if (elements.purchaseFee) {
            elements.purchaseFee.value =
                state.settings.fee_percentage;
        }

        if (elements.withdrawalFee) {
            elements.withdrawalFee.value =
                state.settings.withdrawal_fee_percent;
        }

       async function loadUsers() {
        const { data, error } =
            await supabase
                .from("profiles")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        state.users = data || [];

        renderUsers();
        updateCounters();
    }

    async function loadProducts() {
        const { data, error } =
            await supabase
                .from("products")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        state.products = data || [];

        renderProducts();
        updateCounters();
    }

    async function loadOrders() {
        const { data, error } =
            await supabase
                .from("orders")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        state.orders = data || [];

        renderOrders();
        updateCounters();
    }

    async function loadWallets() {
        const { data, error } =
            await supabase
                .from("wallets")
                .select("*")
                .order("updated_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        state.wallets = data || [];

        renderWallets();
    }

    async function loadDeposits() {
        const { data, error } =
            await supabase
                .from("wallet_deposits")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        state.deposits = data || [];
    }

    async function loadWithdrawals() {
        const { data, error } =
            await supabase
                .from("withdrawal_requests")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        state.withdrawals = data || [];

        renderWithdrawals();
    }

    function updateCounters() {
        const users = state.users;

        const sellers = users.filter(user =>
            String(user.role || "").toLowerCase() ===
            "seller"
        );

        const buyers = users.filter(user =>
            String(user.role || "").toLowerCase() ===
            "buyer"
        );

        const volume = state.orders.reduce(
            (total, order) =>
                total + getOrderTotal(order),
            0
        );

        if (elements.totalUsers) {
            elements.totalUsers.textContent =
                users.length;
        }

        if (elements.totalSellers) {
            elements.totalSellers.textContent =
                sellers.length;
        }

        if (elements.totalBuyers) {
            elements.totalBuyers.textContent =
                buyers.length;
        }

        if (elements.totalProducts) {
            elements.totalProducts.textContent =
                state.products.length;
        }

        if (elements.totalOrders) {
            elements.totalOrders.textContent =
                state.orders.length;
        }

        if (elements.transactionVolume) {
            elements.transactionVolume.textContent =
                formatMoney(volume);
        }
    }

    function renderUsers() {
        if (!elements.usersList) {
            return;
        }

        if (!state.users.length) {
            elements.usersList.innerHTML =
                '<div class="admin-empty">Pa gen itilizatè.</div>';
            return;
        }

        elements.usersList.innerHTML =
            state.users.map(user => `
                <div class="admin-user-item"
                     data-id="${escapeHTML(user.id)}">

                    <div class="user-main">
                        <strong>
                            ${escapeHTML(
                                getUserName(user)
                            )}
                        </strong>

                        <span>
                            Wòl:
                            ${escapeHTML(
                                user.role || "—"
                            )}
                        </span>

                        ${
                            user.phone
                                ? `
                                    <span>
                                        Telefòn:
                                        ${escapeHTML(
                                            user.phone
                                        )}
                                    </span>
                                `
                                : ""
                        }

                        ${
                            user.email
                                ? `
                                    <span>
                                        Email:
                                        ${escapeHTML(
                                            user.email
                                        )}
                                    </span>
                                `
                                : ""
                        }

                        <small>
                            Enskri:
                            ${formatDate(
                                user.created_at
                            )}
                        </small>
                    </div>
                </div>
            `).join("");
    }

    function renderProducts() {
        if (!elements.productsList) {
            return;
        }

        if (!state.products.length) {
            elements.productsList.innerHTML =
                '<div class="admin-empty">Pa gen pwodwi.</div>';
            return;
        }

        elements.productsList.innerHTML =
            state.products.map(product => {
                const price =
                    product.price ??
                    product.unit_price ??
                    0;

                const stock =
                    product.stock ??
                    product.quantity ??
                    0;

                return `
                    <div class="admin-product-item"
                         data-id="${escapeHTML(
                             product.id
                         )}">

                        <div class="product-main">
                            <strong>
                                ${escapeHTML(
                                    getProductName(
                                        product
                                    )
                                )}
                            </strong>

                            <span>
                                Pri:
                                ${formatMoney(price)}
                            </span>

                            <span>
                                Stock:
                                ${escapeHTML(stock)}
                            </span>

                            ${
                                product.category
                                    ? `
                                        <span>
                                            Kategori:
                                            ${escapeHTML(
                                                product.category
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                            <small>
                                Kreye:
                                ${formatDate(
                                    product.created_at
                                )}
                            </small>
                        </div>
                    </div>
                `;
            }).join("");
}
        function renderOrders() {
        if (!elements.ordersList) {
            return;
        }

        if (!state.orders.length) {
            elements.ordersList.innerHTML =
                '<div class="admin-empty">Pa gen kòmand.</div>';
            return;
        }

        elements.ordersList.innerHTML =
            state.orders.map(order => {
                const status =
                    order.status || "pending";

                return `
                    <div class="admin-order-item"
                         data-id="${escapeHTML(
                             order.id
                         )}">

                        <div class="order-main">
                            <strong>
                                ${escapeHTML(
                                    order.product_name ||
                                    "Pwodwi"
                                )}
                            </strong>

                            <span>
                                Achtè:
                                ${escapeHTML(
                                    order.buyer_name ||
                                    "—"
                                )}
                            </span>

                            <span>
                                Kantite:
                                ${escapeHTML(
                                    order.quantity || 1
                                )}
                            </span>

                            <span>
                                Total:
                                ${formatMoney(
                                    getOrderTotal(order)
                                )}
                            </span>

                            <span class="${getStatusClass(
                                status
                            )}">
                                ${escapeHTML(
                                    getStatusLabel(status)
                                )}
                            </span>

                            <small>
                                ${formatDate(
                                    order.created_at
                                )}
                            </small>
                        </div>
                    </div>
                `;
            }).join("");
    }

    function renderWallets() {
        if (!elements.walletsList) {
            return;
        }

        if (!state.wallets.length) {
            elements.walletsList.innerHTML =
                '<div class="admin-empty">Pa gen wallet.</div>';
            return;
        }

        elements.walletsList.innerHTML =
            state.wallets.map(wallet => `
                <div class="admin-wallet-item"
                     data-id="${escapeHTML(
                         wallet.id
                     )}">

                    <div class="wallet-main">
                        <strong>
                            ${formatMoney(
                                wallet.balance
                            )}
                        </strong>

                        <span>
                            User ID:
                            ${escapeHTML(
                                wallet.user_id || "—"
                            )}
                        </span>

                        <small>
                            Mizajou:
                            ${formatDate(
                                wallet.updated_at
                            )}
                        </small>
                    </div>
                </div>
            `).join("");

        addDepositActions();
    }

    function renderWithdrawals() {
        if (!elements.withdrawalsList) {
            return;
        }

        if (!state.withdrawals.length) {
            elements.withdrawalsList.innerHTML =
                '<div class="admin-empty">Pa gen demann retrè.</div>';
            return;
        }

        elements.withdrawalsList.innerHTML =
            state.withdrawals.map(request => {
                const status =
                    request.status || "pending";

                return `
                    <div class="admin-withdrawal-item"
                         data-id="${escapeHTML(
                             request.id
                         )}">

                        <div class="withdrawal-main">
                            <strong>
                                ${formatMoney(
                                    request.amount
                                )}
                            </strong>

                            <span>
                                Frè:
                                ${formatMoney(
                                    request.fee
                                )}
                            </span>

                            <span>
                                Metòd:
                                ${escapeHTML(
                                    request.method ||
                                    "—"
                                )}
                            </span>

                            <span>
                                Kont:
                                ${escapeHTML(
                                    request.destination_account ||
                                    "—"
                                )}
                            </span>

                            <span class="${getStatusClass(
                                status
                            )}">
                                ${escapeHTML(
                                    getStatusLabel(status)
                                )}
                            </span>

                            <small>
                                ${formatDate(
                                    request.created_at
                                )}
                            </small>
                        </div>
                    </div>
                `;
            }).join("");

        addWithdrawalActions();
    }

    async function saveSettings() {
        if (!elements.saveSettings) {
            return;
        }

        try {
            elements.saveSettings.disabled = true;
            showSettingsMessage("", "");

            const feePercentage =
                Number(
                    elements.purchaseFee?.value
                );

            const withdrawalFee =
                Number(
                    elements.withdrawalFee?.value
                );

            if (
                !Number.isFinite(feePercentage) ||
                feePercentage < 0
            ) {
                throw new Error(
                    "Komisyon acha a pa valab."
                );
            }

            if (
                !Number.isFinite(withdrawalFee) ||
                withdrawalFee < 0
            ) {
                throw new Error(
                    "Frè retrè a pa valab."
                );
            }

            const {
                error: adminError
            } = await supabase.rpc(
                "update_admin_settings",
                {
                    p_moncash_number:
                        state.settings.moncash_number,

                    p_natcash_number:
                        state.settings.natcash_number,

                    p_withdrawal_fee_percent:
                        withdrawalFee
                }
            );

            if (adminError) {
                throw adminError;
            }

            const {
                error: macheyaError
            } = await supabase
                .from("macheya_settings")
                .update({
                    fee_percentage:
                        feePercentage,

                    updated_by:
                        state.user.id,

                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", 1);

            if (macheyaError) {
                throw macheyaError;
            }

            state.settings.fee_percentage =
                feePercentage;

            state.settings.withdrawal_fee_percent =
                withdrawalFee;

            showSettingsMessage(
                "Paramèt yo sove avèk siksè.",
                "success"
            );

        } catch (error) {
            console.error(
                "Save settings:",
                error
            );

            showSettingsMessage(
                error.message ||
                "Pa kapab sove paramèt yo.",
                "error"
            );

        } finally {
            elements.saveSettings.disabled =
                false;
        }
        }
        async function approveDeposit(
        depositId,
        adminNote = null
    ) {
        if (!depositId) {
            return;
        }

        try {
            const {
                data,
                error
            } = await supabase.rpc(
                "approve_wallet_deposit",
                {
                    p_deposit_id: depositId,
                    p_admin_note: adminNote
                }
            );

            if (error) {
                throw error;
            }

            if (data !== true) {
                throw new Error(
                    "Rechaj la pa t kapab apwouve."
                );
            }

            await loadDeposits();
            await loadWallets();

        } catch (error) {
            showError(
                error.message ||
                "Erè pandan apwobasyon rechaj la."
            );
        }
    }

    async function rejectDeposit(
        depositId,
        adminNote = null
    ) {
        if (!depositId) {
            return;
        }

        try {
            const {
                data,
                error
            } = await supabase.rpc(
                "reject_wallet_deposit",
                {
                    p_deposit_id: depositId,
                    p_admin_note: adminNote
                }
            );

            if (error) {
                throw error;
            }

            if (data !== true) {
                throw new Error(
                    "Rechaj la pa t kapab rejte."
                );
            }

            await loadDeposits();
            await loadWallets();

        } catch (error) {
            showError(
                error.message ||
                "Erè pandan rejè rechaj la."
            );
        }
    }

    async function approveWithdrawal(
        requestId,
        paymentReference = null,
        adminNote = null
    ) {
        if (!requestId) {
            return;
        }

        try {
            const {
                data,
                error
            } = await supabase.rpc(
                "approve_withdrawal",
                {
                    p_request_id: requestId,
                    p_payment_reference:
                        paymentReference,
                    p_admin_note:
                        adminNote
                }
            );

            if (error) {
                throw error;
            }

            if (data !== true) {
                throw new Error(
                    "Retrè a pa t kapab apwouve."
                );
            }

            await loadWithdrawals();
            await loadWallets();

        } catch (error) {
            showError(
                error.message ||
                "Erè pandan apwobasyon retrè a."
            );
        }
    }

    async function rejectWithdrawal(
        requestId,
        adminNote = null
    ) {
        if (!requestId) {
            return;
        }

        try {
            const {
                data,
                error
            } = await supabase.rpc(
                "reject_withdrawal",
                {
                    p_request_id: requestId,
                    p_admin_note:
                        adminNote
                }
            );

            if (error) {
                throw error;
            }

            if (data !== true) {
                throw new Error(
                    "Retrè a pa t kapab rejte."
                );
            }

            await loadWithdrawals();
            await loadWallets();

        } catch (error) {
            showError(
                error.message ||
                "Erè pandan rejè retrè a."
            );
        }
    }

    async function handleApproveDeposit(
        depositId
    ) {
        const note = window.prompt(
            "Nòt admin (opsyonèl):"
        );

        if (note === null) {
            return;
        }

        await approveDeposit(
            depositId,
            note.trim() || null
        );
    }

    async function handleRejectDeposit(
        depositId
    ) {
        const note = window.prompt(
            "Rezon rejè rechaj la:"
        );

        if (note === null) {
            return;
        }

        if (!note.trim()) {
            showError(
                "Ou dwe mete yon rezon pou rejè a."
            );
            return;
        }

        await rejectDeposit(
            depositId,
            note.trim()
        );
    }

    async function handleApproveWithdrawal(
        requestId
    ) {
        const paymentReference =
            window.prompt(
                "Mete referans peman an:"
            );

        if (paymentReference === null) {
            return;
        }

        const note = window.prompt(
            "Nòt admin (opsyonèl):"
        );

        if (note === null) {
            return;
        }

        await approveWithdrawal(
            requestId,
            paymentReference.trim() || null,
            note.trim() || null
        );
    }

    async function handleRejectWithdrawal(
        requestId
    ) {
        const note = window.prompt(
            "Rezon rejè retrè a:"
        );

        if (note === null) {
            return;
        }

        if (!note.trim()) {
            showError(
                "Ou dwe mete yon rezon pou rejè a."
            );
            return;
        }

        await rejectWithdrawal(
            requestId,
            note.trim()
        );
    }

    function getDeposit(id) {
        return state.deposits.find(
            deposit => deposit.id === id
        ) || null;
    }

    function getWithdrawal(id) {
        return state.withdrawals.find(
            request => request.id === id
        ) || null;
    }

    function getOrder(id) {
        return state.orders.find(
            order => order.id === id
        ) || null;
    }

    function getUser(id) {
        return state.users.find(
            user => user.id === id
        ) || null;
    }

    function getProduct(id) {
        return state.products.find(
            product => product.id === id
        ) || null;
                }
        function renderRecentActivity() {
        if (!elements.recentActivity) {
            return;
        }

        const activities = [];

        state.orders.slice(0, 5).forEach(order => {
            activities.push({
                type: "order",
                title: "Nouvo kòmand",
                text:
                    (order.product_name ||
                        "Pwodwi") +
                    " — " +
                    formatMoney(
                        getOrderTotal(order)
                    ),
                date: order.created_at
            });
        });

        state.deposits.slice(0, 5).forEach(deposit => {
            activities.push({
                type: "deposit",
                title: "Demann rechaj",
                text:
                    formatMoney(
                        deposit.amount
                    ) +
                    " — " +
                    getStatusLabel(
                        deposit.status
                    ),
                date: deposit.created_at
            });
        });

        state.withdrawals.slice(0, 5).forEach(
            request => {
                activities.push({
                    type: "withdrawal",
                    title: "Demann retrè",
                    text:
                        formatMoney(
                            request.amount
                        ) +
                        " — " +
                        getStatusLabel(
                            request.status
                        ),
                    date: request.created_at
                });
            }
        );

        activities.sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

        const recent =
            activities.slice(0, 10);

        if (!recent.length) {
            elements.recentActivity.innerHTML =
                '<div class="admin-empty">Pa gen aktivite resan.</div>';
            return;
        }

        elements.recentActivity.innerHTML =
            recent.map(activity => `
                <div class="admin-activity-item">
                    <strong>
                        ${escapeHTML(
                            activity.title
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            activity.text
                        )}
                    </span>

                    <small>
                        ${formatDate(
                            activity.date
                        )}
                    </small>
                </div>
            `).join("");
    }

    function renderAll() {
        renderSettings();
        renderUsers();
        renderProducts();
        renderOrders();
        renderWallets();
        renderWithdrawals();
        renderRecentActivity();
        updateCounters();
    }

    async function loadAllData() {
        await Promise.all([
            loadSettings(),
            loadUsers(),
            loadProducts(),
            loadOrders(),
            loadWallets(),
            loadDeposits(),
            loadWithdrawals()
        ]);

        renderAll();
    }

    async function refresh() {
        try {
            hideError();
            await loadAllData();

            addWithdrawalActions();
            addDepositActions();

        } catch (error) {
            console.error(
                "Refresh admin:",
                error
            );

            showError(
                error.message ||
                "Pa kapab rafrechi done admin yo."
            );
        }
    }

    function addWithdrawalActions() {
        if (!elements.withdrawalsList) {
            return;
        }

        const items =
            elements.withdrawalsList.querySelectorAll(
                ".admin-withdrawal-item"
            );

        items.forEach(item => {
            if (
                item.querySelector(
                    ".request-actions"
                )
            ) {
                return;
            }

            const id = item.dataset.id;
            const request =
                getWithdrawal(id);

            if (
                !request ||
                request.status !== "pending"
            ) {
                return;
            }

            const actions =
                document.createElement("div");

            actions.className =
                "request-actions";

            actions.innerHTML = `
                <button
                    type="button"
                    class="admin-action-btn"
                    data-action="approve-withdrawal"
                    data-id="${escapeHTML(id)}">
                    Apwouve
                </button>

                <button
                    type="button"
                    class="admin-action-btn"
                    data-action="reject-withdrawal"
                    data-id="${escapeHTML(id)}">
                    Rejte
                </button>
            `;

            item.appendChild(actions);
        });
    }

    function addDepositActions() {
        if (!elements.walletsList) {
            return;
        }

        const pending =
            state.deposits.filter(
                deposit =>
                    deposit.status ===
                    "pending"
            );

        pending.slice(0, 20).forEach(
            deposit => {
                const existing =
                    elements.walletsList.querySelector(
                        `[data-deposit-id="${CSS.escape(
                            String(deposit.id)
                        )}"]`
                    );

                if (existing) {
                    return;
                }

                const item =
                    document.createElement("div");

                item.className =
                    "admin-deposit-item";

                item.dataset.depositId =
                    deposit.id;

                item.innerHTML = `
                    <div class="deposit-main">
                        <strong>
                            ${formatMoney(
                                deposit.amount
                            )}
                        </strong>

                        <span>
                            Metòd:
                            ${escapeHTML(
                                deposit.method ||
                                "—"
                            )}
                        </span>

                        <span>
                            Referans:
                            ${escapeHTML(
                                deposit.payment_reference ||
                                "—"
                            )}
                        </span>

                        <span class="${getStatusClass(
                            deposit.status
                        )}">
                            ${escapeHTML(
                                getStatusLabel(
                                    deposit.status
                                )
                            )}
                        </span>

                        <small>
                            ${formatDate(
                                deposit.created_at
                            )}
                        </small>
                    </div>

                    <div class="request-actions">
                        <button
                            type="button"
                            class="admin-action-btn"
                            data-action="approve-deposit"
                            data-id="${escapeHTML(
                                deposit.id
                            )}">
                            Apwouve
                        </button>

                        <button
                            type="button"
                            class="admin-action-btn"
                            data-action="reject-deposit"
                            data-id="${escapeHTML(
                                deposit.id
                            )}">
                            Rejte
                        </button>
                    </div>
                `;

                elements.walletsList.prepend(item);
            }
        );
    }

    function setupEvents() {
        if (elements.saveSettings) {
            elements.saveSettings.addEventListener(
                "click",
                saveSettings
            );
        }

        if (elements.logoutButton) {
            elements.logoutButton.addEventListener(
                "click",
                async () => {
                    try {
                        await supabase.auth.signOut();
                        window.location.href =
                            "login.html";
                    } catch (error) {
                        showError(
                            error.message ||
                            "Pa kapab dekonekte."
                        );
                    }
                }
            );
        }

        if (elements.withdrawalsList) {
            elements.withdrawalsList.addEventListener(
                "click",
                async event => {
                    const button =
                        event.target.closest(
                            "[data-action]"
                        );

                    if (!button) {
                        return;
                    }

                    const id =
                        button.dataset.id;

                    const action =
                        button.dataset.action;

                    if (
                        action ===
                        "approve-withdrawal"
                    ) {
                        await handleApproveWithdrawal(
                            id
                        );
                        await refresh();
                    }

                    if (
                        action ===
                        "reject-withdrawal"
                    ) {
                        await handleRejectWithdrawal(
                            id
                        );
                        await refresh();
                    }
                }
            );
        }

        if (elements.walletsList) {
            elements.walletsList.addEventListener(
                "click",
                async event => {
                    const button =
                        event.target.closest(
                            "[data-action]"
                        );

                    if (!button) {
                        return;
                    }

                    const id =
                        button.dataset.id;

                    const action =
                        button.dataset.action;

                    if (
                        action ===
                        "approve-deposit"
                    ) {
                        await handleApproveDeposit(
                            id
                        );
                        await refresh();
                    }

                    if (
                        action ===
                        "reject-deposit"
                    ) {
                        await handleRejectDeposit(
                            id
                        );
                        await refresh();
                    }
                }
            );
        }
            function setupRealtime() {
        const channels = [];

        const tables = [
            "profiles",
            "products",
            "orders",
            "wallets",
            "wallet_deposits",
            "withdrawal_requests",
            "macheya_settings",
            "admin_settings"
        ];

        tables.forEach(table => {
            const channel = supabase
                .channel(
                    "admin-" +
                    table +
                    "-" +
                    Date.now()
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: table
                    },
                    async () => {
                        try {
                            await refresh();
                        } catch (error) {
                            console.error(
                                "Realtime:",
                                error
                            );
                        }
                    }
                )
                .subscribe();

            channels.push(channel);
        });

        return () => {
            channels.forEach(channel => {
                try {
                    supabase.removeChannel(
                        channel
                    );
                } catch (error) {
                    console.error(error);
                }
            });
        };
    }

    async function initializeAdmin() {
        try {
            showLoading(true);
            hideError();

            const user =
                await getCurrentUser();

            if (!user) {
                return;
            }

            await verifySuperAdmin();

            if (elements.roleBadge) {
                elements.roleBadge.textContent =
                    "SUPER ADMIN";
            }

            setupEvents();

            await loadAllData();

            const cleanupRealtime =
                setupRealtime();

            window.MacheyaAdminCleanup =
                cleanupRealtime;

            if (elements.content) {
                elements.content.hidden = false;
            }

            showLoading(false);

        } catch (error) {
            console.error(
                "Macheya Admin initialization:",
                error
            );

            showLoading(false);

            showError(
                error.message ||
                "Pa kapab inisyalize panel admin lan."
            );
        }
    }

    window.MacheyaAdmin = {
        state,

        initialize:
            initializeAdmin,

        refresh,

        reload:
            refresh,

        saveSettings,

        loadSettings,

        loadUsers,

        loadProducts,

        loadOrders,

        loadWallets,

        loadDeposits,

        loadWithdrawals,

        approveDeposit,

        rejectDeposit,

        approveWithdrawal,

        rejectWithdrawal,

        getUser,

        getProduct,

        getOrder,

        getDeposit,

        getWithdrawal,

        formatMoney,

        formatDate,

        escapeHTML
    };

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeAdmin,
            { once: true }
        );
    } else {
        initializeAdmin();
    }

})();
}
