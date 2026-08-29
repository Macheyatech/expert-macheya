(function () {

    "use strict";

    const supabase = window.supabaseClient;

    let currentUser = null;

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

        return new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(Number(value) || 0) + " HTG";

    }


    function formatDate(value) {

        if (!value) {
            return "Dat pa disponib";
        }

        try {

            return new Intl.DateTimeFormat("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }).format(new Date(value));

        } catch (error) {

            return String(value);

        }

    }


    function showMessage(text, type) {

        const element =
            document.getElementById("adminMessage");

        if (!element) {
            return;
        }

        element.textContent = text;

        element.className =
            "admin-message show " +
            (type || "");

    }


    function hideMessage() {

        const element =
            document.getElementById("adminMessage");

        if (!element) {
            return;
        }

        element.textContent = "";

        element.className =
            "admin-message";

    }


    function setLoading(visible) {

        const loading =
            document.getElementById("adminLoading");

        const content =
            document.getElementById("adminContent");

        if (loading) {
            loading.hidden = !visible;
        }

        if (content) {
            content.hidden = visible;
        }

    }


    function showAdminError(message) {

        const errorSection =
            document.getElementById("adminError");

        const errorMessage =
            document.getElementById("adminErrorMessage");

        if (errorMessage) {
            errorMessage.textContent = message;
        }

        if (errorSection) {
            errorSection.hidden = false;
        }

        const content =
            document.getElementById("adminContent");

        if (content) {
            content.hidden = true;
        }

    }


    function hideAdminError() {

        const errorSection =
            document.getElementById("adminError");

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


        const {
            data,
            error
        } =
            await supabase.auth.getUser();


        if (
            error ||
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
                    email
                `)
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (profileError) {

            console.error(
                "Admin profile error:",
                profileError
            );

            showAdminError(
                "Nou pa kapab verifye aksè Super Admin ou."
            );

            return false;

        }


        const role =
            String(
                profile?.role || ""
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


        return true;

    }


    async function loadSettings() {

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
                "Settings error:",
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


    async function saveSettings(event) {

        event.preventDefault();

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
                "saveSettingsButton"
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
                    "Sove paramèt";

            }

        }

    }


    async function loadStatistics() {

        try {

            const [
                usersResult,
                productsResult,
                ordersResult,
                withdrawalsResult
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
                        .from("withdrawal_requests")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        )

                ]);


            if (usersResult.error) {

                console.error(
                    "Users statistics:",
                    usersResult.error
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


            if (withdrawalsResult.error) {

                console.error(
                    "Withdrawals statistics:",
                    withdrawalsResult.error
                );

            }


            const usersCount =
                usersResult.count || 0;


            const productsCount =
                productsResult.count || 0;


            const ordersCount =
                ordersResult.count || 0;


            const withdrawalsCount =
                withdrawalsResult.count || 0;


            const usersElement =
                document.getElementById(
                    "totalUsers"
                );


            const productsElement =
                document.getElementById(
                    "totalProducts"
                );


            const ordersElement =
                document.getElementById(
                    "totalOrders"
                );


            const withdrawalsElement =
                document.getElementById(
                    "totalWithdrawals"
                );


            if (usersElement) {
                usersElement.textContent =
                    usersCount;
            }


            if (productsElement) {
                productsElement.textContent =
                    productsCount;
            }


            if (ordersElement) {
                ordersElement.textContent =
                    ordersCount;
            }


            if (withdrawalsElement) {
                withdrawalsElement.textContent =
                    withdrawalsCount;
            }


        } catch (error) {

            console.error(
                "Statistics error:",
                error
            );

        }

             }

     async function loadWithdrawalRequests() {

        const container =
            document.getElementById(
                "withdrawalList"
            );


        if (!container) {
            return;
        }


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
                    .limit(30);


            if (error) {
                throw error;
            }


            renderWithdrawalRequests(
                data || []
            );


        } catch (error) {

            console.error(
                "Withdrawal requests error:",
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

                </div>
            `;

        }

    }


    function renderWithdrawalRequests(
        requests
    ) {

        const container =
            document.getElementById(
                "withdrawalList"
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


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "withdrawal-item";


                item.innerHTML = `

                    <div class="withdrawal-top">

                        <span class="withdrawal-amount">
                            ${money(amount)}
                        </span>


                        <span class="status ${escapeHtml(
                            status
                        )}">
                            ${escapeHtml(
                                status
                            )}
                        </span>

                    </div>


                    <div class="withdrawal-details">

                        <span>
                            👤 User:
                            ${escapeHtml(
                                request.user_id
                            )}
                        </span>


                        <span>
                            💳 Wallet:
                            ${escapeHtml(
                                request.wallet_id
                            )}
                        </span>


                        <span>
                            📱 Metòd:
                            ${escapeHtml(
                                request.method || "—"
                            )}
                        </span>


                        <span>
                            📞 Nimewo:
                            ${escapeHtml(
                                request.phone_number || "—"
                            )}
                        </span>


                        <span>
                            💸 Frè Macheya:
                            ${money(fee)}
                        </span>


                        <span>
                            💰 Montan net:
                            ${money(net)}
                        </span>


                        <span>
                            📅
                            ${escapeHtml(
                                formatDate(
                                    request.created_at
                                )
                            )}
                        </span>

                    </div>


                    ${
                        status === "pending"
                            ? `

                                <div class="withdrawal-actions">

                                    <button
                                        type="button"
                                        class="approve-button"
                                        data-withdrawal-id="${escapeHtml(
                                            request.id
                                        )}"
                                    >
                                        Apwouve
                                    </button>


                                    <button
                                        type="button"
                                        class="reject-button"
                                        data-withdrawal-id="${escapeHtml(
                                            request.id
                                        )}"
                                    >
                                        Rejte
                                    </button>

                                </div>

                            `
                            : ""
                    }

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
                ".approve-button"
            );


        const rejectButtons =
            document.querySelectorAll(
                ".reject-button"
            );


        approveButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.dataset
                                .withdrawalId;


                        handleWithdrawalStatus(
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


                        handleWithdrawalStatus(
                            id,
                            "rejected"
                        );

                    }
                );

            }
        );

    }


    async function handleWithdrawalStatus(
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


        const confirmation =
            newStatus === "approved"
                ? "Èske ou konfime ou vle apwouve demann retrè sa a?"
                : "Èske ou konfime ou vle rejte demann retrè sa a?";


        if (!window.confirm(confirmation)) {
            return;
        }


        hideMessage();


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
                    .select(
                        "id,status"
                    )
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
                "Withdrawal status error:",
                error
            );


            showMessage(
                error.message ||
                "Nou pa kapab modifye demann retrè sa a.",
                "error"
            );

        }

    }


    function setupLogout() {

        const button =
            document.getElementById(
                "logoutButton"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async function () {

                button.disabled = true;

                button.textContent =
                    "Ap dekonekte...";


                try {

                    const {
                        error
                    } =
                        await supabase.auth.signOut();


                    if (error) {
                        throw error;
                    }


                    location.href =
                        "login.html";


                } catch (error) {

                    console.error(
                        "Logout error:",
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


    function setupSettingsForm() {

        const form =
            document.getElementById(
                "settingsForm"
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            saveSettings
        );

    }


    async function initializeAdmin() {

        setLoading(true);

        hideAdminError();


        const isAdmin =
            await verifyAdmin();


        if (!isAdmin) {

            setLoading(false);

            return;

        }


        setupLogout();

        setupSettingsForm();


        await loadSettings();

        await loadStatistics();

        await loadWithdrawalRequests();


        setLoading(false);

        }
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
