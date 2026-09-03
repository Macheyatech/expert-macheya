(function () {
    "use strict";

    const supabase = window.supabaseClient;

    if (!supabase) {
        console.error("Macheya Admin: Supabase client pa disponib.");
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
        errors: {}
    };

    const $ = id => document.getElementById(id);

    const el = {
        loading: $("adminLoading"),
        content: $("adminContent"),
        error: $("adminError"),
        errorMessage: $("adminErrorMessage"),
        role: $("adminRoleBadge"),
        logout: $("adminLogoutButton"),

        usersStat: $("adminTotalUsers"),
        sellersStat: $("adminTotalSellers"),
        buyersStat: $("adminTotalBuyers"),
        productsStat: $("adminTotalProducts"),
        ordersStat: $("adminTotalOrders"),
        volumeStat: $("adminTransactionVolume"),

        usersSection: $("adminUsersSection"),
        productsSection: $("adminProductsSection"),
        ordersSection: $("adminOrdersSection"),
        walletsSection: $("adminWalletsSection"),
        depositsSection: $("adminDepositsSection"),
        withdrawalsSection: $("adminWithdrawalsSection"),
        settingsSection: $("adminSettingsSection"),

        usersList: $("adminUsersList"),
        productsList: $("adminProductsList"),
        ordersList: $("adminOrdersList"),
        walletsList: $("adminWalletsList"),
        depositsList: $("adminDepositsList"),
        withdrawalsList: $("adminWithdrawalsList"),
        activity: $("adminRecentActivity"),

        purchaseFee: $("purchaseFeePercentage"),
        withdrawalFee: $("withdrawalFeePercentage"),
        moncashNumber: $("moncashNumber"),
        natcashNumber: $("natcashNumber"),
        settingsMessage: $("adminSettingsMessage"),
        saveSettings: $("saveAdminSettings")
    };

    const sectionMap = {
        users: el.usersSection,
        products: el.productsSection,
        orders: el.ordersSection,
        wallets: el.walletsSection,
        deposits: el.depositsSection,
        withdrawals: el.withdrawalsSection,
        settings: el.settingsSection
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
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    }

    function statusLabel(status) {
        const labels = {
            pending: "An atant",
            approved: "Apwouve",
            rejected: "Rejte",
            delivered: "Livre",
            completed: "Fini",
            cancelled: "Anile",
            canceled: "Anile",
            paid: "Peye",
            processing: "An tretman",
            failed: "Echwe"
        };
        const key = String(status || "").toLowerCase();
        return labels[key] || status || "—";
    }

    function statusClass(status) {
        return "status-" + String(status || "unknown")
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "");
    }

    function errorText(error, fallback) {
        return error?.message || error?.details || error?.hint || fallback;
    }

    function setListMessage(target, message, type) {
        if (!target) return;
        target.innerHTML = `
            <div class="${type === "error" ? "admin-empty admin-load-error" : "admin-empty"}">
                ${escapeHTML(message)}
            </div>
        `;
    }

    function showLoading(show) {
        if (el.loading) {
            el.loading.hidden = !show;
            el.loading.style.display = show ? "flex" : "";
        }
        if (el.content) {
            el.content.hidden = show;
        }
    }

    function showError(message) {
        if (el.errorMessage) {
            el.errorMessage.textContent = message || "Yon erè rive.";
        }
        if (el.error) {
            el.error.hidden = false;
        }
        if (el.content) {
            el.content.hidden = true;
        }
    }

    function hideError() {
        if (el.error) el.error.hidden = true;
        if (el.errorMessage) el.errorMessage.textContent = "";
    }

    function settingsMessage(message, type) {
        if (!el.settingsMessage) return;
        el.settingsMessage.textContent = message || "";
        el.settingsMessage.className = "admin-form-message " + (type || "");
    }

    function userName(user) {
        return user?.full_name || user?.name || user?.nom_complet || user?.username || user?.email || "Itilizatè";
    }

    function productName(product) {
        return product?.name || product?.product_name || "Pwodwi";
    }

    function orderTotal(order) {
        return Number(order?.total ?? order?.total_amount ?? order?.grand_total ?? 0) || 0;
    }

    function depositAmount(deposit) {
        return Number(deposit?.amount ?? deposit?.amount_requested ?? deposit?.deposit_amount ?? 0) || 0;
    }

    function withdrawalAmount(request) {
        return Number(request?.amount ?? request?.requested_amount ?? 0) || 0;
    }

    async function getCurrentUser() {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data?.user) {
            window.location.href = "login.html";
            return null;
        }
        state.user = data.user;
        return data.user;
    }

    async function verifySuperAdmin() {
        const { data, error } = await supabase.rpc("is_super_admin");
        if (error) throw error;
        const allowed = data === true || data?.is_super_admin === true || (Array.isArray(data) && data[0] === true);
        if (!allowed) {
            throw new Error("Aksè refize. Se Super Admin sèlman ki ka antre isit la.");
        }
        return true;
    }

    async function loadSettings() {
        const { data, error } = await supabase.rpc("get_admin_settings");
        if (error) throw error;

        const settings = Array.isArray(data) ? data[0] : data;

        if (settings) {
            state.settings.fee_percentage = Number(settings.fee_percentage ?? 0);
            state.settings.withdrawal_fee_percent = Number(settings.withdrawal_fee_percent ?? 2.75);
            state.settings.moncash_number = settings.moncash_number || "";
            state.settings.natcash_number = settings.natcash_number || "";
        }

        renderSettings();
    }

    function renderSettings() {
        if (el.purchaseFee) {
            el.purchaseFee.value = state.settings.fee_percentage;
        }
        if (el.withdrawalFee) {
            el.withdrawalFee.value = state.settings.withdrawal_fee_percent;
        }
        if (el.moncashNumber) {
            el.moncashNumber.value = state.settings.moncash_number;
        }
        if (el.natcashNumber) {
            el.natcashNumber.value = state.settings.natcash_number;
        }
    }

    async function loadUsers() {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        state.users = data || [];
        renderUsers();
        updateCounters();
    }

    async function loadProducts() {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        state.products = data || [];
        renderProducts();
        updateCounters();
    }

    async function loadOrders() {
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        state.orders = data || [];
        renderOrders();
        updateCounters();
    }

    async function loadWallets() {
        const { data, error } = await supabase
            .from("wallets")
            .select("*")
            .order("updated_at", { ascending: false });
        if (error) throw error;
        state.wallets = data || [];
        renderWallets();
    }

    async function loadDeposits() {
        const { data, error } = await supabase
            .from("wallet_deposits")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        state.deposits = data || [];
        renderDeposits();
        renderActivity();
    }

    async function loadWithdrawals() {
        const { data, error } = await supabase
            .from("withdrawal_requests")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        state.withdrawals = data || [];
        renderWithdrawals();
        renderActivity();
    }

    function updateCounters() {
        const sellers = state.users.filter(user =>
            String(user.role || "").toLowerCase() === "seller" ||
            String(user.role || "").toLowerCase() === "vendeur"
        );

        const buyers = state.users.filter(user =>
            String(user.role || "").toLowerCase() === "buyer" ||
            String(user.role || "").toLowerCase() === "acheteur"
        );

        const volume = state.orders.reduce(
            (total, order) => total + orderTotal(order),
            0
        );

        if (el.usersStat) el.usersStat.textContent = state.users.length;
        if (el.sellersStat) el.sellersStat.textContent = sellers.length;
        if (el.buyersStat) el.buyersStat.textContent = buyers.length;
        if (el.productsStat) el.productsStat.textContent = state.products.length;
        if (el.ordersStat) el.ordersStat.textContent = state.orders.length;
        if (el.volumeStat) el.volumeStat.textContent = formatMoney(volume);
    }

    function renderUsers() {
        if (!el.usersList) return;
        if (!state.users.length) {
            setListMessage(el.usersList, "Pa gen itilizatè.");
            return;
        }
        el.usersList.innerHTML = state.users.map(user => `
            <div class="admin-user-item" data-id="${escapeHTML(user.id)}">
                <div class="user-main">
                    <strong>${escapeHTML(userName(user))}</strong>
                    <span>Wòl: ${escapeHTML(user.role || "—")}</span>
                    ${user.telephone ? `<span>Telefòn: ${escapeHTML(user.telephone)}</span>` : ""}
                    ${user.email ? `<span>Email: ${escapeHTML(user.email)}</span>` : ""}
                    <small>Enskri: ${escapeHTML(formatDate(user.created_at))}</small>
                </div>
            </div>
        `).join("");
    }

    function renderProducts() {
        if (!el.productsList) return;
        if (!state.products.length) {
            setListMessage(el.productsList, "Pa gen pwodwi.");
            return;
        }
        el.productsList.innerHTML = state.products.map(product => {
            const price = product.price ?? 0;
            const stock = product.stock ?? 0;
            return `
                <div class="admin-product-item" data-id="${escapeHTML(product.id)}">
                    <div class="product-main">
                        <strong>${escapeHTML(productName(product))}</strong>
                        <span>Pri: ${escapeHTML(formatMoney(price))}</span>
                        <span>Stock: ${escapeHTML(stock)}</span>
                        ${product.category ? `<span>Kategori: ${escapeHTML(product.category)}</span>` : ""}
                        ${typeof product.is_active === "boolean"
                            ? `<span class="${product.is_active ? "status-approved" : "status-rejected"}">
                                ${product.is_active ? "Aktif" : "Inaktif"}
                               </span>`
                            : ""}
                        <small>Kreye: ${escapeHTML(formatDate(product.created_at))}</small>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderOrders() {
        if (!el.ordersList) return;
        if (!state.orders.length) {
            setListMessage(el.ordersList, "Pa gen kòmand.");
            return;
        }
        el.ordersList.innerHTML = state.orders.map(order => {
            const status = order.status || "pending";
            return `
                <div class="admin-order-item" data-id="${escapeHTML(order.id)}">
                    <div class="order-main">
                        <strong>Kòmand #${escapeHTML(String(order.id).slice(0, 8))}</strong>
                        <span>Achtè: ${escapeHTML(order.buyer_name || order.buyer_id || "—")}</span>
                        ${order.delivery_address ? `<span>Adrès: ${escapeHTML(order.delivery_address)}</span>` : ""}
                        <span>Total: ${escapeHTML(formatMoney(orderTotal(order)))}</span>
                        <span class="${statusClass(status)}">${escapeHTML(statusLabel(status))}</span>
                        <small>${escapeHTML(formatDate(order.created_at))}</small>
                    </div>
                </div>
            `;
        }).join("");
        }
        function renderWallets() {
        if (!el.walletsList) return;
        if (!state.wallets.length) {
            setListMessage(el.walletsList, "Pa gen wallet.");
            return;
        }
        el.walletsList.innerHTML = state.wallets.map(wallet => `
            <div class="admin-wallet-item" data-id="${escapeHTML(wallet.id)}">
                <div class="wallet-main">
                    <strong>${escapeHTML(formatMoney(wallet.balance))}</strong>
                    <span>User ID: ${escapeHTML(wallet.user_id || "—")}</span>
                    <small>Mizajou: ${escapeHTML(formatDate(wallet.updated_at))}</small>
                </div>
            </div>
        `).join("");
    }

    function renderDeposits() {
        if (!el.depositsList) return;
        if (!state.deposits.length) {
            setListMessage(el.depositsList, "Pa gen demann rechaj.");
            return;
        }
        el.depositsList.innerHTML = state.deposits.map(deposit => {
            const status = deposit.status || "pending";
            return `
                <div class="admin-deposit-item" data-deposit-id="${escapeHTML(deposit.id)}">
                    <div class="deposit-main">
                        <strong>Rechaj: ${escapeHTML(formatMoney(depositAmount(deposit)))}</strong>
                        <span>Metòd: ${escapeHTML(deposit.method || "—")}</span>
                        <span>Referans: ${escapeHTML(deposit.payment_reference || "—")}</span>
                        <span class="${statusClass(status)}">${escapeHTML(statusLabel(status))}</span>
                        <small>${escapeHTML(formatDate(deposit.created_at))}</small>
                    </div>
                    ${status === "pending" ? `
                        <div class="request-actions">
                            <button type="button" class="admin-action-btn" data-action="approve-deposit" data-id="${escapeHTML(deposit.id)}">
                                Apwouve
                            </button>
                            <button type="button" class="admin-action-btn" data-action="reject-deposit" data-id="${escapeHTML(deposit.id)}">
                                Rejte
                            </button>
                        </div>
                    ` : ""}
                </div>
            `;
        }).join("");
    }

    function renderWithdrawals() {
        if (!el.withdrawalsList) return;
        if (!state.withdrawals.length) {
            setListMessage(el.withdrawalsList, "Pa gen demann retrè.");
            return;
        }
        el.withdrawalsList.innerHTML = state.withdrawals.map(request => {
            const status = request.status || "pending";
            const amount = withdrawalAmount(request);
            const fee = Number(request.fee ?? 0) || 0;
            return `
                <div class="admin-withdrawal-item" data-id="${escapeHTML(request.id)}">
                    <div class="withdrawal-main">
                        <strong>${escapeHTML(formatMoney(amount))}</strong>
                        <span>Frè: ${escapeHTML(formatMoney(fee))}</span>
                        <span>Metòd: ${escapeHTML(request.method || "—")}</span>
                        <span>Kont: ${escapeHTML(request.destination_account || "—")}</span>
                        <span class="${statusClass(status)}">${escapeHTML(statusLabel(status))}</span>
                        <small>${escapeHTML(formatDate(request.created_at))}</small>
                    </div>
                    ${status === "pending" ? `
                        <div class="request-actions">
                            <button type="button" class="admin-action-btn" data-action="approve-withdrawal" data-id="${escapeHTML(request.id)}">
                                Apwouve
                            </button>
                            <button type="button" class="admin-action-btn" data-action="reject-withdrawal" data-id="${escapeHTML(request.id)}">
                                Rejte
                            </button>
                        </div>
                    ` : ""}
                </div>
            `;
        }).join("");
    }

    function renderActivity() {
        if (!el.activity) return;
        const items = [];

        state.orders.slice(0, 5).forEach(order => {
            items.push({
                title: "Nouvo kòmand",
                text: formatMoney(orderTotal(order)),
                date: order.created_at
            });
        });

        state.deposits.slice(0, 5).forEach(deposit => {
            items.push({
                title: "Demann rechaj",
                text: formatMoney(depositAmount(deposit)) + " — " + statusLabel(deposit.status),
                date: deposit.created_at
            });
        });

        state.withdrawals.slice(0, 5).forEach(request => {
            items.push({
                title: "Demann retrè",
                text: formatMoney(withdrawalAmount(request)) + " — " + statusLabel(request.status),
                date: request.created_at
            });
        });

        items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        const recent = items.slice(0, 10);

        if (!recent.length) {
            setListMessage(el.activity, "Pa gen aktivite resan.");
            return;
        }

        el.activity.innerHTML = recent.map(item => `
            <div class="admin-activity-item">
                <strong>${escapeHTML(item.title)}</strong>
                <span>${escapeHTML(item.text)}</span>
                <small>${escapeHTML(formatDate(item.date))}</small>
            </div>
        `).join("");
    }

    function renderAll() {
        renderSettings();
        renderUsers();
        renderProducts();
        renderOrders();
        renderWallets();
        renderDeposits();
        renderWithdrawals();
        renderActivity();
        updateCounters();
    }

    function showSection(name) {
        Object.keys(sectionMap).forEach(key => {
            if (sectionMap[key]) {
                sectionMap[key].hidden = key !== name;
            }
        });
        const target = sectionMap[name];
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    async function loadAllData() {
        state.errors = {};
        const jobs = [
            ["settings", loadSettings, null],
            ["users", loadUsers, el.usersList],
            ["products", loadProducts, el.productsList],
            ["orders", loadOrders, el.ordersList],
            ["wallets", loadWallets, el.walletsList],
            ["deposits", loadDeposits, el.depositsList],
            ["withdrawals", loadWithdrawals, el.withdrawalsList]
        ];

        const results = await Promise.allSettled(jobs.map(job => job[1]()));

        results.forEach((result, index) => {
            const [name, , target] = jobs[index];
            if (result.status === "rejected") {
                const message = errorText(result.reason, `Pa kapab chaje ${name}.`);
                state.errors[name] = message;
                console.error(`Macheya Admin - ${name}:`, result.reason);
                if (target) {
                    setListMessage(target, message, "error");
                }
            }
        });

        renderAll();
    }

    async function refresh() {
        hideError();
        await loadAllData();
    }

    async function saveSettings() {
        if (!el.saveSettings) return;

        const purchaseFee = Number(el.purchaseFee?.value);
        const withdrawalFee = Number(el.withdrawalFee?.value);
        const moncash = el.moncashNumber?.value?.trim() || "";
        const natcash = el.natcashNumber?.value?.trim() || "";

        if (!Number.isFinite(purchaseFee) || purchaseFee < 0 || purchaseFee > 100) {
            settingsMessage("Komisyon acha a dwe ant 0% ak 100%.", "error");
            return;
        }

        if (!Number.isFinite(withdrawalFee) || withdrawalFee < 0 || withdrawalFee > 100) {
            settingsMessage("Frè retrè a dwe ant 0% ak 100%.", "error");
            return;
        }

        try {
            el.saveSettings.disabled = true;
            settingsMessage("Ap sove paramèt yo...", "");

            const { error } = await supabase.rpc("update_admin_settings", {
                p_fee_percentage: purchaseFee,
                p_withdrawal_fee_percent: withdrawalFee,
                p_moncash_number: moncash,
                p_natcash_number: natcash
            });

            if (error) throw error;

            state.settings.fee_percentage = purchaseFee;
            state.settings.withdrawal_fee_percent = withdrawalFee;
            state.settings.moncash_number = moncash;
            state.settings.natcash_number = natcash;

            renderSettings();
            settingsMessage("Paramèt yo sove avèk siksè.", "success");

        } catch (error) {
            console.error("Macheya Admin save settings:", error);
            settingsMessage(errorText(error, "Pa kapab sove paramèt yo."), "error");
        } finally {
            el.saveSettings.disabled = false;
        }
    }

    async function approveDeposit(id, note) {
        if (!id) return;
        try {
            const { data, error } = await supabase.rpc("approve_wallet_deposit", {
                p_deposit_id: id,
                p_admin_note: note || null
            });
            if (error) throw error;
            if (data !== true) {
                throw new Error("Rechaj la pa t kapab apwouve.");
            }
            await refresh();
        } catch (error) {
            showError(errorText(error, "Erè pandan apwobasyon rechaj la."));
        }
    }

    async function rejectDeposit(id, note) {
        if (!id) return;
        try {
            const { data, error } = await supabase.rpc("reject_wallet_deposit", {
                p_deposit_id: id,
                p_admin_note: note || null
            });
            if (error) throw error;
            if (data !== true) {
                throw new Error("Rechaj la pa t kapab rejte.");
            }
            await refresh();
        } catch (error) {
            showError(errorText(error, "Erè pandan rejè rechaj la."));
        }
    }

    async function approveWithdrawal(id, paymentReference, note) {
        if (!id) return;
        try {
            const { data, error } = await supabase.rpc("approve_withdrawal", {
                p_request_id: id,
                p_payment_reference: paymentReference || null,
                p_admin_note: note || null
            });
            if (error) throw error;
            if (data !== true) {
                throw new Error("Retrè a pa t kapab apwouve.");
            }
            await refresh();
        } catch (error) {
            showError(errorText(error, "Erè pandan apwobasyon retrè a."));
        }
    }

    async function rejectWithdrawal(id, note) {
        if (!id) return;
        try {
            const { data, error } = await supabase.rpc("reject_withdrawal", {
                p_request_id: id,
                p_admin_note: note || null
            });
            if (error) throw error;
            if (data !== true) {
                throw new Error("Retrè a pa t kapab rejte.");
            }
            await refresh();
        } catch (error) {
            showError(errorText(error, "Erè pandan rejè retrè a."));
        }
    }

    async function approveDepositPrompt(id) {
        const note = window.prompt("Nòt admin (opsyonèl):");
        if (note === null) return;
        await approveDeposit(id, note.trim() || null);
    }

    async function rejectDepositPrompt(id) {
        const note = window.prompt("Rezon rejè rechaj la:");
        if (note === null) return;
        if (!note.trim()) {
            showError("Ou dwe mete yon rezon pou rejè a.");
            return;
        }
        await rejectDeposit(id, note.trim());
    }

    async function approveWithdrawalPrompt(id) {
        const reference = window.prompt("Mete referans peman an:");
        if (reference === null) return;
        const note = window.prompt("Nòt admin (opsyonèl):");
        if (note === null) return;
        await approveWithdrawal(id, reference.trim() || null, note.trim() || null);
    }

    async function rejectWithdrawalPrompt(id) {
        const note = window.prompt("Rezon rejè retrè a:");
        if (note === null) return;
        if (!note.trim()) {
            showError("Ou dwe mete yon rezon pou rejè a.");
            return;
        }
        await rejectWithdrawal(id, note.trim());
    }

    function setupEvents() {
        document.querySelectorAll(".admin-menu-button[data-section]").forEach(button => {
            button.addEventListener("click", () => showSection(button.dataset.section));
        });

        if (el.saveSettings) {
            el.saveSettings.addEventListener("click", saveSettings);
        }

        if (el.logout) {
            el.logout.addEventListener("click", async () => {
                try {
                    el.logout.disabled = true;
                    await supabase.auth.signOut();
                    window.location.href = "login.html";
                } catch (error) {
                    el.logout.disabled = false;
                    showError(errorText(error, "Pa kapab dekonekte."));
                }
            });
        }

        if (el.depositsList) {
            el.depositsList.addEventListener("click", async event => {
                const button = event.target.closest("[data-action]");
                if (!button) return;
                const action = button.dataset.action;
                const id = button.dataset.id;
                button.disabled = true;
                try {
                    if (action === "approve-deposit") {
                        await approveDepositPrompt(id);
                    } else if (action === "reject-deposit") {
                        await rejectDepositPrompt(id);
                    }
                } finally {
                    button.disabled = false;
                }
            });
        }

        if (el.withdrawalsList) {
            el.withdrawalsList.addEventListener("click", async event => {
                const button = event.target.closest("[data-action]");
                if (!button) return;
                const action = button.dataset.action;
                const id = button.dataset.id;
                button.disabled = true;
                try {
                    if (action === "approve-withdrawal") {
                        await approveWithdrawalPrompt(id);
                    } else if (action === "reject-withdrawal") {
                        await rejectWithdrawalPrompt(id);
                    }
                } finally {
                    button.disabled = false;
                }
            });
        }
    }

    function setupRealtime() {
        const tables = ["profiles", "products", "orders", "wallets", "wallet_deposits", "withdrawal_requests"];
        const channels = tables.map(table =>
            supabase
                .channel("macheya-admin-" + table + "-" + Math.random().toString(36).slice(2))
                .on("postgres_changes", { event: "*", schema: "public", table }, () => {
                    refresh().catch(error => console.error("Macheya Admin realtime:", error));
                })
                .subscribe()
        );
        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }

    async function initializeAdmin() {
        showLoading(true);
        hideError();

        try {
            const user = await getCurrentUser();
            if (!user) return;

            await verifySuperAdmin();

            if (el.role) {
                el.role.textContent = "SUPER ADMIN";
            }

            setupEvents();

            if (el.content) {
                el.content.hidden = false;
            }

            await loadAllData();

            window.MacheyaAdminCleanup = setupRealtime();

        } catch (error) {
            console.error("Macheya Admin initialization:", error);
            showError(errorText(error, "Pa kapab inisyalize panel admin lan."));
        } finally {
            showLoading(false);
            if (el.error?.hidden !== false && el.content) {
                el.content.hidden = false;
            }
        }
    }

    window.MacheyaAdmin = {
        state,
        initialize: initializeAdmin,
        refresh,
        reload: refresh,
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
        formatMoney,
        formatDate,
        escapeHTML
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeAdmin, { once: true });
    } else {
        initializeAdmin();
    }

})();
