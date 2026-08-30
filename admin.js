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
            moncash_number: "",
            natcash_number: "",
            withdrawal_fee_percent: 2.75,
            fee_percentage: 0
        },
        rechargeRequests: [],
        withdrawalRequests: [],
        orders: [],
        users: [],
        loading: false
    };

    const $ = id => document.getElementById(id);

    const elements = {
        loading: $("admin-loading"),
        content: $("admin-content"),
        error: $("admin-error"),

        moncash: $("admin-moncash-number"),
        natcash: $("admin-natcash-number"),
        withdrawalFee: $("admin-withdrawal-fee"),
        marketplaceFee: $("admin-marketplace-fee"),

        saveSettings: $("save-admin-settings"),

        rechargeList: $("recharge-requests-list"),
        withdrawalList: $("withdrawal-requests-list"),
        ordersList: $("admin-orders-list"),
        usersList: $("admin-users-list"),

        rechargeCount: $("recharge-requests-count"),
        withdrawalCount: $("withdrawal-requests-count"),
        ordersCount: $("admin-orders-count"),
        usersCount: $("admin-users-count")
    };

    function showLoading(show) {
        state.loading = show;

        if (elements.loading) {
            elements.loading.style.display =
                show ? "flex" : "none";
        }

        if (elements.content) {
            elements.content.style.display =
                show ? "none" : "";
        }
    }

    function showError(message) {
        console.error(message);

        if (!elements.error) return;

        elements.error.textContent = message;
        elements.error.style.display = "block";
    }

    function hideError() {
        if (!elements.error) return;

        elements.error.textContent = "";
        elements.error.style.display = "none";
    }

    function formatMoney(value) {
        const amount = Number(value || 0);

        return amount.toLocaleString("fr-FR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " HTG";
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function getCurrentUser() {
        const {
            data,
            error
        } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        if (!data || !data.user) {
            throw new Error(
                "Ou dwe konekte pou antre nan panel admin."
            );
        }

        state.user = data.user;

        return data.user;
    }

    async function verifySuperAdmin() {
        const {
            data,
            error
        } = await supabase.rpc(
            "is_super_admin"
        );

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

    async function loadAdminSettings() {
        const {
            data,
            error
        } = await supabase.rpc(
            "get_admin_settings"
        );

        if (error) {
            throw error;
        }

        if (data && data.length) {
            const settings = data[0];

            state.settings.moncash_number =
                settings.moncash_number || "";

            state.settings.natcash_number =
                settings.natcash_number || "";

            state.settings.withdrawal_fee_percent =
                Number(
                    settings.withdrawal_fee_percent ?? 2.75
                );
        }

        const {
            data: macheyaData,
            error: macheyaError
        } = await supabase
            .from("macheya_settings")
            .select(
                "fee_percentage, moncash_number, natcash_number"
            )
            .eq("id", 1)
            .maybeSingle();

        if (macheyaError) {
            throw macheyaError;
        }

        if (macheyaData) {
            state.settings.fee_percentage =
                Number(
                    macheyaData.fee_percentage ?? 0
                );

            if (!state.settings.moncash_number) {
                state.settings.moncash_number =
                    macheyaData.moncash_number || "";
            }

            if (!state.settings.natcash_number) {
                state.settings.natcash_number =
                    macheyaData.natcash_number || "";
            }
        }

        renderSettings();
    }

    function renderSettings() {
        if (elements.moncash) {
            elements.moncash.value =
                state.settings.moncash_number;
        }

        if (elements.natcash) {
            elements.natcash.value =
                state.settings.natcash_number;
        }

        if (elements.withdrawalFee) {
            elements.withdrawalFee.value =
                state.settings.withdrawal_fee_percent;
        }

        if (elements.marketplaceFee) {
            elements.marketplaceFee.value =
                state.settings.fee_percentage;
        }
    }

    async function loadRechargeRequests() {
        const {
            data,
            error
        } = await supabase
            .from("wallet_deposits")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        state.rechargeRequests = data || [];

        if (elements.rechargeCount) {
            elements.rechargeCount.textContent =
                state.rechargeRequests.filter(
                    item => item.status === "pending"
                ).length;
        }
    }

    async function loadWithdrawalRequests() {
        const {
            data,
            error
        } = await supabase
            .from("withdrawal_requests")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        state.withdrawalRequests = data || [];

        if (elements.withdrawalCount) {
            elements.withdrawalCount.textContent =
                state.withdrawalRequests.filter(
                    item => item.status === "pending"
                ).length;
        }
    }

    async function loadOrders() {
        const {
            data,
            error
        } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        state.orders = data || [];

        if (elements.ordersCount) {
            elements.ordersCount.textContent =
                state.orders.length;
        }
    }

    async function loadUsers() {
        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        state.users = data || [];

        if (elements.usersCount) {
            elements.usersCount.textContent =
                state.users.length;
        }
        }
        function getStatusLabel(status) {
        const labels = {
            pending: "An atant",
            approved: "Apwouve",
            rejected: "Rejte",
            delivered: "Livre",
            completed: "Fini",
            cancelled: "Anile"
        };

        return labels[status] || status || "—";
    }

    function getStatusClass(status) {
        return `status-${String(status || "unknown")
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "")}`;
    }

    function renderRechargeRequests() {
        if (!elements.rechargeList) return;

        if (!state.rechargeRequests.length) {
            elements.rechargeList.innerHTML =
                '<div class="admin-empty">Pa gen demann rechaj.</div>';
            return;
        }

        elements.rechargeList.innerHTML =
            state.rechargeRequests.map(request => {
                const pending =
                    request.status === "pending";

                return `
                    <div class="admin-request-item"
                         data-id="${escapeHTML(request.id)}">

                        <div class="request-main">

                            <strong>
                                ${formatMoney(request.amount)}
                            </strong>

                            <span>
                                Metòd:
                                ${escapeHTML(request.method)}
                            </span>

                            <span>
                                Kont:
                                ${escapeHTML(
                                    request.sender_account || "—"
                                )}
                            </span>

                            <span>
                                Referans:
                                ${escapeHTML(
                                    request.payment_reference || "—"
                                )}
                            </span>

                            <span class="${getStatusClass(
                                request.status
                            )}">
                                ${escapeHTML(
                                    getStatusLabel(request.status)
                                )}
                            </span>

                            <small>
                                ${formatDate(request.created_at)}
                            </small>

                        </div>

                        ${
                            pending
                                ? `
                                    <div class="request-actions">

                                        <button
                                            type="button"
                                            class="admin-action-btn approve-recharge-btn"
                                            data-id="${escapeHTML(
                                                request.id
                                            )}">
                                            Apwouve
                                        </button>

                                        <button
                                            type="button"
                                            class="admin-action-btn reject-recharge-btn"
                                            data-id="${escapeHTML(
                                                request.id
                                            )}">
                                            Rejte
                                        </button>

                                    </div>
                                `
                                : ""
                        }

                    </div>
                `;
            }).join("");
    }

    function renderWithdrawalRequests() {
        if (!elements.withdrawalList) return;

        if (!state.withdrawalRequests.length) {
            elements.withdrawalList.innerHTML =
                '<div class="admin-empty">Pa gen demann retrè.</div>';
            return;
        }

        elements.withdrawalList.innerHTML =
            state.withdrawalRequests.map(request => {
                const pending =
                    request.status === "pending";

                return `
                    <div class="admin-request-item"
                         data-id="${escapeHTML(request.id)}">

                        <div class="request-main">

                            <strong>
                                ${formatMoney(request.amount)}
                            </strong>

                            <span>
                                Frè Macheya:
                                ${formatMoney(request.fee)}
                            </span>

                            <span>
                                Total pou retire:
                                ${formatMoney(
                                    request.total_deducted
                                )}
                            </span>

                            <span>
                                Metòd:
                                ${escapeHTML(request.method)}
                            </span>

                            <span>
                                Destinasyon:
                                ${escapeHTML(
                                    request.destination_account
                                )}
                            </span>

                            <span class="${getStatusClass(
                                request.status
                            )}">
                                ${escapeHTML(
                                    getStatusLabel(request.status)
                                )}
                            </span>

                            <small>
                                ${formatDate(request.created_at)}
                            </small>

                        </div>

                        ${
                            pending
                                ? `
                                    <div class="request-actions">

                                        <button
                                            type="button"
                                            class="admin-action-btn approve-withdrawal-btn"
                                            data-id="${escapeHTML(
                                                request.id
                                            )}">
                                            Apwouve
                                        </button>

                                        <button
                                            type="button"
                                            class="admin-action-btn reject-withdrawal-btn"
                                            data-id="${escapeHTML(
                                                request.id
                                            )}">
                                            Rejte
                                        </button>

                                    </div>
                                `
                                : ""
                        }

                    </div>
                `;
            }).join("");
    }

    function renderOrders() {
        if (!elements.ordersList) return;

        if (!state.orders.length) {
            elements.ordersList.innerHTML =
                '<div class="admin-empty">Pa gen kòmand pou montre.</div>';
            return;
        }

        elements.ordersList.innerHTML =
            state.orders.map(order => {
                const status =
                    order.status || "pending";

                return `
                    <div class="admin-order-item"
                         data-id="${escapeHTML(order.id)}">

                        <div class="order-main">

                            <strong>
                                ${escapeHTML(
                                    order.product_name || "Pwodwi"
                                )}
                            </strong>

                            <span>
                                Achtè:
                                ${escapeHTML(
                                    order.buyer_name || "—"
                                )}
                            </span>

                            <span>
                                Telefòn:
                                ${escapeHTML(
                                    order.buyer_phone || "—"
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
                                ${formatMoney(order.total)}
                            </span>

                            <span class="${getStatusClass(status)}">
                                ${escapeHTML(
                                    getStatusLabel(status)
                                )}
                            </span>

                            <small>
                                Kreye:
                                ${formatDate(order.created_at)}
                            </small>

                            ${
                                order.delivered_at
                                    ? `
                                        <small>
                                            Livre:
                                            ${formatDate(
                                                order.delivered_at
                                            )}
                                        </small>
                                    `
                                    : ""
                            }

                            ${
                                order.completed_at
                                    ? `
                                        <small>
                                            Fini:
                                            ${formatDate(
                                                order.completed_at
                                            )}
                                        </small>
                                    `
                                    : ""
                            }

                        </div>

                        <button
                            type="button"
                            class="admin-action-btn view-order-btn"
                            data-id="${escapeHTML(order.id)}">
                            Gade detay
                        </button>

                    </div>
                `;
            }).join("");
    }

    function renderUsers() {
        if (!elements.usersList) return;

        if (!state.users.length) {
            elements.usersList.innerHTML =
                '<div class="admin-empty">Pa gen itilizatè.</div>';
            return;
        }

        elements.usersList.innerHTML =
            state.users.map(user => {
                const name =
                    user.full_name ||
                    user.name ||
                    user.username ||
                    "Itilizatè";

                return `
                    <div class="admin-user-item"
                         data-id="${escapeHTML(user.id)}">

                        <div class="user-main">

                            <strong>
                                ${escapeHTML(name)}
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

                            <small>
                                Enskri:
                                ${formatDate(user.created_at)}
                            </small>

                        </div>

                    </div>
                `;
            }).join("");
    }

    function getRechargeRequest(id) {
        return state.rechargeRequests.find(
            request => request.id === id
        ) || null;
    }

    function getWithdrawalRequest(id) {
        return state.withdrawalRequests.find(
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
        async function saveAdminSettings() {
        try {
            hideError();

            const moncash = elements.moncash
                ? elements.moncash.value.trim()
                : "";

            const natcash = elements.natcash
                ? elements.natcash.value.trim()
                : "";

            const withdrawalFee = elements.withdrawalFee
                ? Number(elements.withdrawalFee.value)
                : 2.75;

            const marketplaceFee = elements.marketplaceFee
                ? Number(elements.marketplaceFee.value)
                : 0;

            if (
                !Number.isFinite(withdrawalFee) ||
                withdrawalFee < 0
            ) {
                throw new Error(
                    "Frè retrè a pa valab."
                );
            }

            if (
                !Number.isFinite(marketplaceFee) ||
                marketplaceFee < 0
            ) {
                throw new Error(
                    "Komisyon Macheya a pa valab."
                );
            }

            const {
                error: adminError
            } = await supabase.rpc(
                "update_admin_settings",
                {
                    p_moncash_number: moncash,
                    p_natcash_number: natcash,
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
                        marketplaceFee,
                    moncash_number:
                        moncash,
                    natcash_number:
                        natcash,
                    updated_by:
                        state.user.id,
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", 1);

            if (macheyaError) {
                throw macheyaError;
            }

            state.settings.moncash_number =
                moncash;

            state.settings.natcash_number =
                natcash;

            state.settings.withdrawal_fee_percent =
                withdrawalFee;

            state.settings.fee_percentage =
                marketplaceFee;

            renderSettings();

            alert(
                "Paramèt Macheya yo mete ajou avèk siksè."
            );

        } catch (error) {
            showError(
                error.message ||
                "Pa kapab mete paramèt yo ajou."
            );
        }
    }

    async function approveRecharge(
        depositId,
        adminNote = null
    ) {
        if (!depositId) return;

        try {
            const {
                data,
                error
            } = await supabase.rpc(
                "approve_wallet_deposit",
                {
                    p_deposit_id:
                        depositId,
                    p_admin_note:
                        adminNote
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

            await loadRechargeRequests();
            renderRechargeRequests();

            alert(
                "Rechaj la apwouve avèk siksè."
            );

        } catch (error) {
            showError(
                error.message ||
                "Erè pandan apwobasyon rechaj la."
            );
        }
    }

    async function rejectRecharge(
        depositId,
        adminNote = null
    ) {
        if (!depositId) return;

        try {
            const {
                data,
                error
            } = await supabase.rpc(
                "reject_wallet_deposit",
                {
                    p_deposit_id:
                        depositId,
                    p_admin_note:
                        adminNote
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

            await loadRechargeRequests();
            renderRechargeRequests();

            alert(
                "Demann rechaj la rejte."
            );

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
        if (!requestId) return;

        try {
            const {
                data,
                error
            } = await supabase.rpc(
                "approve_withdrawal",
                {
                    p_request_id:
                        requestId,
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

            await loadWithdrawalRequests();
            renderWithdrawalRequests();

            alert(
                "Retrè a apwouve avèk siksè."
            );

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
        if (!requestId) return;

        try {
            const {
                data,
                error
            } = await supabase.rpc(
                "reject_withdrawal",
                {
                    p_request_id:
                        requestId,
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

            await loadWithdrawalRequests();
            renderWithdrawalRequests();

            alert(
                "Demann retrè a rejte."
            );

        } catch (error) {
            showError(
                error.message ||
                "Erè pandan rejè retrè a."
            );
        }
    }

    async function handleApproveRecharge(id) {
        const request =
            getRechargeRequest(id);

        if (
            !request ||
            request.status !== "pending"
        ) {
            return;
        }

        const note = prompt(
            "Nòt admin pou rechaj sa a (opsyonèl):"
        );

        if (note === null) {
            return;
        }

        await approveRecharge(
            id,
            note.trim() || null
        );
    }

    async function handleRejectRecharge(id) {
        const request =
            getRechargeRequest(id);

        if (
            !request ||
            request.status !== "pending"
        ) {
            return;
        }

        const note = prompt(
            "Rezon rejè rechaj la:"
        );

        if (note === null) {
            return;
        }

        await rejectRecharge(
            id,
            note.trim() || null
        );
    }

    async function handleApproveWithdrawal(id) {
        const request =
            getWithdrawalRequest(id);

        if (
            !request ||
            request.status !== "pending"
        ) {
            return;
        }

        const paymentReference =
            prompt(
                "Mete referans peman an:"
            );

        if (paymentReference === null) {
            return;
        }

        const adminNote = prompt(
            "Nòt admin (opsyonèl):"
        );

        if (adminNote === null) {
            return;
        }

        await approveWithdrawal(
            id,
            paymentReference.trim() || null,
            adminNote.trim() || null
        );
    }

    async function handleRejectWithdrawal(id) {
        const request =
            getWithdrawalRequest(id);

        if (
            !request ||
            request.status !== "pending"
        ) {
            return;
        }

        const note = prompt(
            "Rezon rejè retrè a:"
        );

        if (note === null) {
            return;
        }

        await rejectWithdrawal(
            id,
            note.trim() || null
        );
                }
        function getRechargeRequest(id) {
        return state.rechargeRequests.find(
            request => request.id === id
        ) || null;
    }

    function getWithdrawalRequest(id) {
        return state.withdrawalRequests.find(
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

    function filterPendingRequests() {
        return {
            rechargePending:
                state.rechargeRequests.filter(
                    request =>
                        request.status === "pending"
                ),

            withdrawalPending:
                state.withdrawalRequests.filter(
                    request =>
                        request.status === "pending"
                )
        };
    }

    function updatePendingCounters() {
        const {
            rechargePending,
            withdrawalPending
        } = filterPendingRequests();

        if (elements.rechargeCount) {
            elements.rechargeCount.textContent =
                rechargePending.length;
        }

        if (elements.withdrawalCount) {
            elements.withdrawalCount.textContent =
                withdrawalPending.length;
        }
    }

    if (elements.saveSettings) {
        elements.saveSettings.addEventListener(
            "click",
            saveAdminSettings
        );
    }

    if (elements.rechargeList) {
        elements.rechargeList.addEventListener(
            "click",
            async event => {
                const approveButton =
                    event.target.closest(
                        ".approve-recharge-btn"
                    );

                const rejectButton =
                    event.target.closest(
                        ".reject-recharge-btn"
                    );

                if (approveButton) {
                    await handleApproveRecharge(
                        approveButton.dataset.id
                    );
                    return;
                }

                if (rejectButton) {
                    await handleRejectRecharge(
                        rejectButton.dataset.id
                    );
                }
            }
        );
    }

    if (elements.withdrawalList) {
        elements.withdrawalList.addEventListener(
            "click",
            async event => {
                const approveButton =
                    event.target.closest(
                        ".approve-withdrawal-btn"
                    );

                const rejectButton =
                    event.target.closest(
                        ".reject-withdrawal-btn"
                    );

                if (approveButton) {
                    await handleApproveWithdrawal(
                        approveButton.dataset.id
                    );
                    return;
                }

                if (rejectButton) {
                    await handleRejectWithdrawal(
                        rejectButton.dataset.id
                    );
                }
            }
        );
    }

    window.MacheyaAdmin.saveSettings =
        saveAdminSettings;

    window.MacheyaAdmin.approveRecharge =
        approveRecharge;

    window.MacheyaAdmin.rejectRecharge =
        rejectRecharge;

    window.MacheyaAdmin.approveWithdrawal =
        approveWithdrawal;

    window.MacheyaAdmin.rejectWithdrawal =
        rejectWithdrawal;

    window.MacheyaAdmin.getRechargeRequest =
        getRechargeRequest;

    window.MacheyaAdmin.getWithdrawalRequest =
        getWithdrawalRequest;

    window.MacheyaAdmin.getOrder =
        getOrder;

    window.MacheyaAdmin.getUser =
        getUser;

    window.MacheyaAdmin.handleApproveRecharge =
        handleApproveRecharge;

    window.MacheyaAdmin.handleRejectRecharge =
        handleRejectRecharge;

    window.MacheyaAdmin.handleApproveWithdrawal =
        handleApproveWithdrawal;

    window.MacheyaAdmin.handleRejectWithdrawal =
        handleRejectWithdrawal;

    window.MacheyaAdmin.updatePendingCounters =
        updatePendingCounters;
        function renderOrders() {
        if (!elements.ordersList) {
            return;
        }

        if (!state.orders.length) {
            elements.ordersList.innerHTML =
                '<div class="admin-empty">Pa gen kòmand pou montre.</div>';
            return;
        }

        elements.ordersList.innerHTML =
            state.orders.map(order => {
                const status = order.status || "pending";

                return `
                    <div class="admin-order-item"
                         data-id="${escapeHTML(order.id)}">

                        <div class="order-main">
                            <strong>
                                ${escapeHTML(
                                    order.product_name || "Pwodwi"
                                )}
                            </strong>

                            <span>
                                Achtè:
                                ${escapeHTML(
                                    order.buyer_name || "—"
                                )}
                            </span>

                            <span>
                                Telefòn:
                                ${escapeHTML(
                                    order.buyer_phone || "—"
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
                                ${formatMoney(order.total)}
                            </span>

                            <span class="${getStatusClass(status)}">
                                ${escapeHTML(
                                    getStatusLabel(status)
                                )}
                            </span>

                            <small>
                                Kreye:
                                ${formatDate(order.created_at)}
                            </small>

                            ${
                                order.delivered_at
                                    ? `
                                        <small>
                                            Livre:
                                            ${formatDate(
                                                order.delivered_at
                                            )}
                                        </small>
                                    `
                                    : ""
                            }

                            ${
                                order.completed_at
                                    ? `
                                        <small>
                                            Fini:
                                            ${formatDate(
                                                order.completed_at
                                            )}
                                        </small>
                                    `
                                    : ""
                            }
                        </div>

                        <button
                            type="button"
                            class="admin-action-btn view-order-btn"
                            data-id="${escapeHTML(order.id)}">
                            Gade detay
                        </button>
                    </div>
                `;
            })
            .join("");
    }

    function showOrderDetails(order) {
        if (!order) {
            return;
        }

        const details = [
            `Pwodwi: ${order.product_name || "—"}`,
            `Non achtè: ${order.buyer_name || "—"}`,
            `Telefòn: ${order.buyer_phone || "—"}`,
            `Adrès: ${order.delivery_address || "—"}`,
            `Nòt livrezon: ${order.delivery_note || "—"}`,
            `Kantite: ${order.quantity || 1}`,
            `Pri: ${formatMoney(order.price)}`,
            `Total: ${formatMoney(order.total)}`,
            `Estati: ${getStatusLabel(order.status)}`,
            `Kreye: ${formatDate(order.created_at)}`,
            `Konfime: ${formatDate(order.confirmed_at)}`,
            `Livre: ${formatDate(order.delivered_at)}`,
            `Fini: ${formatDate(order.completed_at)}`
        ].join("\n");

        alert(details);
    }

    if (elements.ordersList) {
        elements.ordersList.addEventListener(
            "click",
            event => {
                const button =
                    event.target.closest(".view-order-btn");

                if (!button) {
                    return;
                }

                const order =
                    getOrder(button.dataset.id);

                showOrderDetails(order);
            }
        );
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
            state.users.map(user => {
                const name =
                    user.full_name ||
                    user.name ||
                    user.username ||
                    "Itilizatè";

                return `
                    <div class="admin-user-item"
                         data-id="${escapeHTML(user.id)}">

                        <div class="user-main">
                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <span>
                                Wòl:
                                ${escapeHTML(user.role || "—")}
                            </span>

                            ${
                                user.phone
                                    ? `
                                        <span>
                                            Telefòn:
                                            ${escapeHTML(user.phone)}
                                        </span>
                                    `
                                    : ""
                            }

                            <small>
                                Enskri:
                                ${formatDate(user.created_at)}
                            </small>
                        </div>
                    </div>
                `;
            })
            .join("");
        }
        async function refreshAdminData() {
        try {
            hideError();

            await Promise.all([
                loadAdminSettings(),
                loadRechargeRequests(),
                loadWithdrawalRequests(),
                loadOrders(),
                loadUsers()
            ]);

            updatePendingCounters();

        } catch (error) {
            showError(
                error.message ||
                "Pa kapab rafrechi done admin yo."
            );
        }
    }

    let realtimeChannels = [];

    function unsubscribeRealtime() {
        realtimeChannels.forEach(channel => {
            try {
                supabase.removeChannel(channel);
            } catch (error) {
                console.error(error);
            }
        });

        realtimeChannels = [];
    }

    function subscribeToRealtime() {
        unsubscribeRealtime();

        const rechargeChannel = supabase
            .channel("admin-recharge-requests")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "wallet_deposits"
                },
                async () => {
                    await loadRechargeRequests();
                    updatePendingCounters();
                }
            )
            .subscribe();

        const withdrawalChannel = supabase
            .channel("admin-withdrawal-requests")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "withdrawal_requests"
                },
                async () => {
                    await loadWithdrawalRequests();
                    updatePendingCounters();
                }
            )
            .subscribe();

        const ordersChannel = supabase
            .channel("admin-orders")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders"
                },
                async () => {
                    await loadOrders();
                }
            )
            .subscribe();

        const settingsChannel = supabase
            .channel("admin-settings")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "admin_settings"
                },
                async () => {
                    await loadAdminSettings();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "macheya_settings"
                },
                async () => {
                    await loadAdminSettings();
                }
            )
            .subscribe();

        realtimeChannels.push(
            rechargeChannel,
            withdrawalChannel,
            ordersChannel,
            settingsChannel
        );
    }

    async function loadAllAdminData() {
        try {
            hideError();

            await Promise.all([
                loadAdminSettings(),
                loadRechargeRequests(),
                loadWithdrawalRequests(),
                loadOrders(),
                loadUsers()
            ]);

            updatePendingCounters();

        } catch (error) {
            showError(
                error.message ||
                "Pa kapab chaje done admin yo."
            );
        }
    }

    async function initializeAdmin() {
        try {
            showLoading(true);
            hideError();

            if (!supabase) {
                throw new Error(
                    "Supabase pa disponib."
                );
            }

            const {
                data: {
                    user
                },
                error
            } = await supabase.auth.getUser();

            if (error) {
                throw error;
            }

            if (!user) {
                window.location.href = "login.html";
                return;
            }

            state.user = user;

            const {
                data: isAdmin,
                error: adminError
            } = await supabase.rpc(
                "is_super_admin"
            );

            if (adminError) {
                throw adminError;
            }

            if (isAdmin !== true) {
                throw new Error(
                    "Aksè refize. Se Super Admin sèlman."
                );
            }

            await loadAllAdminData();

            subscribeToRealtime();

            showLoading(false);

        } catch (error) {
            console.error(
                "Macheya Admin:",
                error
            );

            showLoading(false);

            showError(
                error.message ||
                "Pa kapab inisyalize panel admin lan."
            );
        }
    }

    window.MacheyaAdmin.refresh =
        refreshAdminData;

    window.MacheyaAdmin.initialize =
        initializeAdmin;

    window.MacheyaAdmin.unsubscribeRealtime =
        unsubscribeRealtime;

    window.MacheyaAdmin.subscribeToRealtime =
        subscribeToRealtime;

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeAdmin
        );
    } else {
        initializeAdmin();
    }

})();
