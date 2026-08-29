(function () {

    "use strict";

    const supabase = window.supabaseClient;

    let currentUser = null;
    let currentWallet = null;
    let withdrawalFeePercentage = 0;


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


    function showWalletError(text) {

        const message =
            document.getElementById("wallet-message");

        if (!message) {
            return;
        }

        message.hidden = false;

        message.innerHTML = `
            <div class="message-icon">
                ⚠️
            </div>

            <p>
                ${escapeHtml(text)}
            </p>

            <a
                href="seller-dashboard.html"
                class="main-button"
            >
                Retounen Dashboard
            </a>
        `;

    }


    function showFormMessage(
        elementId,
        text,
        type
    ) {

        const element =
            document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent = text;

        element.className =
            "form-message show " +
            (type || "");

    }


    function hideFormMessage(elementId) {

        const element =
            document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent = "";

        element.className =
            "form-message";

    }


    function setupWithdrawalButton() {

        const button =
            document.getElementById("openWithdrawal");

        const section =
            document.getElementById("withdrawalSection");

        if (!button || !section) {
            return;
        }

        button.addEventListener(
            "click",
            function () {

                section.classList.remove("hidden");

                section.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    }


    async function loadProfile() {

        if (!currentUser) {
            return;
        }

        const userElement =
            document.getElementById("wallet-user");

        if (!userElement) {
            return;
        }

        try {

            const {
                data,
                error
            } = await supabase
                .from("profiles")
                .select(
                    "name,full_name,nom_complet,email"
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();

            if (error) {
                throw error;
            }

            const name =
                data?.name ||
                data?.full_name ||
                data?.nom_complet ||
                currentUser.email ||
                "Vandè";

            userElement.textContent = name;

        } catch (error) {

            console.error(
                "Seller profile error:",
                error
            );

            userElement.textContent =
                currentUser.email || "Vandè";

        }

    }


    async function loadWallet() {

        if (!currentUser) {
            return false;
        }

        const {
            data: wallet,
            error
        } = await supabase
            .from("wallets")
            .select(`
                id,
                user_id,
                balance,
                currency,
                updated_at
            `)
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();

        if (error) {

            console.error(
                "Seller wallet error:",
                error
            );

            showWalletError(
                "Nou pa kapab chaje wallet vandè a."
            );

            return false;

        }

        if (!wallet) {

            showWalletError(
                "Wallet vandè ou poko kreye."
            );

            return false;

        }

        if (
            String(wallet.user_id) !==
            String(currentUser.id)
        ) {

            console.error(
                "Seller wallet ownership mismatch."
            );

            showWalletError(
                "Aksè ak wallet sa a pa otorize."
            );

            return false;

        }

        currentWallet = wallet;

        const balanceElement =
            document.getElementById("wallet-balance");

        if (balanceElement) {

            balanceElement.textContent =
                money(wallet.balance);

        }

        return true;

    }


    async function loadWithdrawalFee() {

        withdrawalFeePercentage = 0;

        try {

            const {
                data,
                error
            } = await supabase
                .from("macheya_settings")
                .select(
                    "withdrawal_fee_percentage"
                )
                .eq(
                    "id",
                    1
                )
                .maybeSingle();

            if (error) {
                throw error;
            }

            withdrawalFeePercentage =
                Number(
                    data?.withdrawal_fee_percentage
                ) || 0;

        } catch (error) {

            console.error(
                "Withdrawal fee settings error:",
                error
            );

        }

        updateWithdrawalCalculation();

    }


    function updateWithdrawalCalculation() {

        const amountInput =
            document.getElementById(
                "withdrawalAmount"
            );

        const feeElement =
            document.getElementById(
                "withdrawalFee"
            );

        const netElement =
            document.getElementById(
                "withdrawalNet"
            );

        if (!amountInput) {
            return;
        }

        const amount =
            Number(amountInput.value) || 0;

        const fee =
            amount *
            (withdrawalFeePercentage / 100);

        const net =
            Math.max(
                0,
                amount - fee
            );

        if (feeElement) {

            feeElement.textContent =
                money(fee);

        }

        if (netElement) {

            netElement.textContent =
                money(net);

        }

    }


    function setupWithdrawalCalculation() {

        const amountInput =
            document.getElementById(
                "withdrawalAmount"
            );

        if (!amountInput) {
            return;
        }

        amountInput.addEventListener(
            "input",
            updateWithdrawalCalculation
        );

    }


    async function loadTransactions() {

        const container =
            document.getElementById(
                "wallet-transactions"
            );

        if (!container || !currentWallet) {
            return;
        }

        try {

            const {
                data,
                error
            } = await supabase
                .from("wallet_transactions")
                .select(`
                    id,
                    wallet_id,
                    type,
                    amount,
                    description,
                    created_at
                `)
                .eq(
                    "wallet_id",
                    currentWallet.id
                )
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

            renderTransactions(
                data || []
            );

        } catch (error) {

            console.error(
                "Seller transactions error:",
                error
            );

            container.innerHTML = `
                <div class="empty-request">
                    Pa kapab chaje tranzaksyon yo pou kounya.
                </div>
            `;

        }

    }


    function renderTransactions(
        transactions
    ) {

        const container =
            document.getElementById(
                "wallet-transactions"
            );

        if (!container) {
            return;
        }

        if (!transactions.length) {

            container.innerHTML = `
                <div class="empty-request">
                    Ou poko gen okenn tranzaksyon.
                </div>
            `;

            return;

        }

        container.innerHTML = "";

        transactions.forEach(
            function (transaction) {

                const type =
                    String(
                        transaction.type || ""
                    ).toLowerCase();

                const credit =
                    type === "credit" ||
                    type === "sale" ||
                    type === "deposit" ||
                    type === "refund";

                const sign =
                    credit ? "+" : "-";

                const className =
                    credit
                        ? "credit"
                        : "debit";

                const title =
                    transaction.description ||
                    (
                        credit
                            ? "Kredi wallet"
                            : "Debi wallet"
                    );

                const item =
                    document.createElement("div");

                item.className =
                    "transaction";

                item.innerHTML = `

                    <div class="transaction-left">

                        <div class="transaction-title">
                            ${escapeHtml(title)}
                        </div>

                        <div class="transaction-date">
                            ${escapeHtml(
                                formatDate(
                                    transaction.created_at
                                )
                            )}
                        </div>

                    </div>

                    <div
                        class="transaction-amount ${className}"
                    >
                        ${sign}${money(
                            transaction.amount
                        )}
                    </div>

                `;

                container.appendChild(item);

            }
        );

    }


    async function loadWithdrawalHistory() {

        const container =
            document.getElementById(
                "withdrawalHistory"
            );

        if (!container || !currentUser) {
            return;
        }

        try {

            const {
                data,
                error
            } = await supabase
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
                .eq(
                    "user_id",
                    currentUser.id
                )
                .eq(
                    "wallet_id",
                    currentWallet.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(10);

            if (error) {
                throw error;
            }

            renderWithdrawalHistory(
                data || []
            );

        } catch (error) {

            console.error(
                "Seller withdrawal history error:",
                error
            );

            container.innerHTML = `
                <div class="empty-request">
                    Pa kapab chaje istwa retrè yo.
                </div>
            `;

        }

    }


    function renderWithdrawalHistory(
        requests
    ) {

        const container =
            document.getElementById(
                "withdrawalHistory"
            );

        if (!container) {
            return;
        }

        if (!requests.length) {

            container.innerHTML = `
                <div class="empty-request">
                    Ou poko fè okenn demann retrè.
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
                    (withdrawalFeePercentage / 100);

                const net =
                    Math.max(
                        0,
                        amount - fee
                    );

                const item =
                    document.createElement("div");

                item.className =
                    "request-item";

                item.innerHTML = `

                    <div class="request-top">

                        <span class="request-amount">
                            ${money(amount)}
                        </span>

                        <span class="request-status ${escapeHtml(
                            status
                        )}">
                            ${escapeHtml(
                                status
                            )}
                        </span>

                    </div>

                    <div class="request-method">
                        Metòd:
                        ${escapeHtml(
                            request.method || "—"
                        )}
                    </div>

                    <div class="request-phone">
                        📱
                        ${escapeHtml(
                            request.phone_number || "—"
                        )}
                    </div>

                    <div class="request-fee">
                        Frè retrè:
                        ${money(fee)}
                    </div>

                    <div class="request-net">
                        Montan net:
                        ${money(net)}
                    </div>

                    <div class="request-date">
                        ${escapeHtml(
                            formatDate(
                                request.created_at
                            )
                        )}
                    </div>

                `;
                async function loadSellerTransactions() {

    const container =
        document.getElementById(
            "sellerTransactions"
        );

    if (!container || !currentWallet) {
        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabase
                .from("wallet_transactions")
                .select(`
                    id,
                    wallet_id,
                    type,
                    amount,
                    description,
                    created_at
                `)
                .eq(
                    "wallet_id",
                    currentWallet.id
                )
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


        if (!data || !data.length) {

            container.innerHTML = `
                <div class="seller-empty">
                    <div class="seller-empty-icon">
                        📭
                    </div>

                    <p>
                        Ou poko gen okenn tranzaksyon.
                    </p>
                </div>
            `;

            return;
        }


        container.innerHTML = "";


        data.forEach(
            function (transaction) {

                const type =
                    String(
                        transaction.type || ""
                    ).toLowerCase();


                const credit =
                    type === "credit" ||
                    type === "sale" ||
                    type === "deposit" ||
                    type === "refund";


                const sign =
                    credit
                        ? "+"
                        : "-";


                const amountClass =
                    credit
                        ? "credit"
                        : "debit";


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "seller-transaction";


                item.innerHTML = `

                    <div class="seller-transaction-left">

                        <div class="seller-transaction-title">
                            ${escapeHtml(
                                transaction.description ||
                                (
                                    credit
                                        ? "Kredi wallet"
                                        : "Debi wallet"
                                )
                            )}
                        </div>

                        <div class="seller-transaction-date">
                            ${formatDate(
                                transaction.created_at
                            )}
                        </div>

                    </div>


                    <div
                        class="seller-transaction-amount ${amountClass}"
                    >
                        ${sign}${money(
                            transaction.amount
                        )}
                    </div>

                `;


                container.appendChild(
                    item
                );

            }
        );


    } catch (error) {

        console.error(
            "Seller transactions error:",
            error
        );

        container.innerHTML = `
            <div class="seller-empty">
                <div class="seller-empty-icon">
                    ⚠️
                </div>

                <p>
                    Nou pa kapab chaje tranzaksyon yo.
                </p>
            </div>
        `;

    }

}


async function submitSellerWithdrawal(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "sellerWithdrawalButton"
        );


    const method =
        document.getElementById(
            "sellerWithdrawalMethod"
        )?.value;


    const phone =
        document.getElementById(
            "sellerWithdrawalPhone"
        )?.value.trim();


    const amount =
        Number(
            document.getElementById(
                "sellerWithdrawalAmount"
            )?.value
        );


    hideMessage(
        "sellerWithdrawalMessage"
    );


    if (!method) {

        showMessage(
            "sellerWithdrawalMessage",
            "Tanpri chwazi metòd retrè a.",
            "error"
        );

        return;
    }


    if (!phone) {

        showMessage(
            "sellerWithdrawalMessage",
            "Tanpri antre nimewo kote w ap resevwa lajan an.",
            "error"
        );

        return;
    }


    if (!amount || amount <= 0) {

        showMessage(
            "sellerWithdrawalMessage",
            "Tanpri antre yon montan ki valab.",
            "error"
        );

        return;
    }


    if (!currentWallet) {

        showMessage(
            "sellerWithdrawalMessage",
            "Wallet vandè a pa disponib.",
            "error"
        );

        return;
    }


    const balance =
        Number(
            currentWallet.balance
        ) || 0;


    if (amount > balance) {

        showMessage(
            "sellerWithdrawalMessage",
            "Montan an pi gran pase balans wallet ou.",
            "error"
        );

        return;
    }


    if (button) {

        button.disabled = true;

        button.textContent =
            "Ap voye...";

    }


    try {

        /*
         * Nou voye demann lan sèlman.
         *
         * Super Admin ap verifye li
         * epi sistèm lan ap kalkile frè
         * retrè a selon paramèt Macheya.
         *
         * Nou pa retire lajan nan wallet la
         * dirèkteman isit la.
         */


        const {
            error
        } =
            await supabase
                .from("withdrawal_requests")
                .insert({

                    user_id:
                        currentUser.id,

                    wallet_id:
                        currentWallet.id,

                    amount:
                        amount,

                    method:
                        method,

                    phone_number:
                        phone,

                    status:
                        "pending",

                    created_at:
                        new Date().toISOString()

                });


        if (error) {
            throw error;
        }


        showMessage(
            "sellerWithdrawalMessage",
            "Demann retrè ou a voye avèk siksè. Super Admin ap verifye li.",
            "success"
        );


        const form =
            document.getElementById(
                "sellerWithdrawalForm"
            );


        if (form) {
            form.reset();
        }


        await loadSellerWithdrawalHistory();


    } catch (error) {

        console.error(
            "Seller withdrawal error:",
            error
        );


        showMessage(
            "sellerWithdrawalMessage",
            error.message ||
            "Pa kapab voye demann retrè a.",
            "error"
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "📤 Voye demann retrè";

        }

    }

}


async function loadSellerWithdrawalHistory() {

    const container =
        document.getElementById(
            "sellerWithdrawalHistory"
        );


    if (
        !container ||
        !currentUser
    ) {
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
                    amount,
                    method,
                    phone_number,
                    status,
                    created_at
                `)
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(10);


        if (error) {
            throw error;
        }


        if (!data || !data.length) {

            container.innerHTML = `
                <div class="seller-empty">
                    <div class="seller-empty-icon">
                        📭
                    </div>

                    <p>
                        Ou poko fè okenn demann retrè.
                    </p>
                </div>
            `;

            return;
        }


        container.innerHTML = `
            ${data.map(
                function (request) {

                    const status =
                        String(
                            request.status ||
                            "pending"
                        ).toLowerCase();


                    const statusText =
                        status === "approved"
                            ? "Apwouve"
                            : status === "rejected"
                                ? "Rejte"
                                : "An atant";


                    return `

                        <div class="seller-request">

                            <div class="seller-request-top">

                                <strong>
                                    -${money(
                                        request.amount
                                    )}
                                </strong>

                                <span
                                    class="seller-status ${escapeHtml(
                                        status
                                    )}"
                                >
                                    ${statusText}
                                </span>

                            </div>


                            <div class="seller-request-details">

                                <span>
                                    Metòd:
                                    ${escapeHtml(
                                        request.method ||
                                        "—"
                                    )}
                                </span>

                                <span>
                                    📱
                                    ${escapeHtml(
                                        request.phone_number ||
                                        "—"
                                    )}
                                </span>

                            </div>


                            <div class="seller-request-date">

                                ${formatDate(
                                    request.created_at
                                )}

                            </div>

                        </div>

                    `;

                }
            ).join("")}
        `;


    } catch (error) {

        console.error(
            "Seller withdrawal history error:",
            error
        );


        container.innerHTML = `
            <div class="seller-empty">
                <div class="seller-empty-icon">
                    ⚠️
                </div>

                <p>
                    Nou pa kapab chaje demann retrè yo.
                </p>
            </div>
        `;

    }

}


function setupSellerWalletActions() {

    const withdrawalButton =
        document.getElementById(
            "showSellerWithdrawal"
        );


    const withdrawalSection =
        document.getElementById(
            "sellerWithdrawalSection"
        );


    if (withdrawalButton) {

        withdrawalButton.addEventListener(
            "click",
            function () {

                if (!withdrawalSection) {
                    return;
                }


                withdrawalSection.classList.remove(
                    "hidden-section"
                );


                withdrawalSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    }

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function money(value) {

    return new Intl.NumberFormat(
        "fr-FR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    ) + " HTG";

}


function formatDate(value) {

    if (!value) {
        return "Dat pa disponib";
    }


    try {

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(
            new Date(value)
        );

    } catch (error) {

        return String(value);

    }

}


function showMessage(
    elementId,
    text,
    type
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        text;


    element.className =
        "form-message show " +
        (type || "");

}


function hideMessage(elementId) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.className =
        "form-message";

}


async function initializeSellerWallet() {

    if (!supabase) {

        console.error(
            "Supabase client pa disponib."
        );

        return;

    }


    const {
        data: auth,
        error: authError
    } =
        await supabase.auth.getUser();


    if (
        authError ||
        !auth?.user
    ) {

        location.href =
            "login.html";

        return;

    }


    currentUser =
        auth.user;


    /*
     * ============================
     * WALLET VANDÈ A
     * ============================
     *
     * Nou itilize user.id ki soti
     * dirèkteman nan Supabase Auth.
     *
     * Konsa chak vandè jwenn
     * sèlman wallet pa li.
     */


    const {
        data: wallet,
        error: walletError
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
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (walletError) {

        console.error(
            "Seller wallet error:",
            walletError
        );

        return;

    }


    if (!wallet) {

        console.error(
            "Pa gen wallet pou vandè sa a."
        );

        return;

    }


    if (
        String(wallet.user_id) !==
        String(currentUser.id)
    ) {

        console.error(
            "Seller wallet ownership mismatch."
        );

        return;

    }


    currentWallet =
        wallet;


    const balanceElement =
        document.getElementById(
            "sellerWalletBalance"
        );


    if (balanceElement) {

        balanceElement.textContent =
            money(
                currentWallet.balance
            );

    }


    const userElement =
        document.getElementById(
            "sellerWalletUser"
        );


    if (userElement) {

        userElement.textContent =
            currentUser.email ||
            "Vandè";

    }


    setupSellerWalletActions();


    await loadSellerTransactions();


    await loadSellerWithdrawalHistory();


    const withdrawalForm =
        document.getElementById(
            "sellerWithdrawalForm"
        );


    if (withdrawalForm) {

        withdrawalForm.addEventListener(
            "submit",
            submitSellerWithdrawal
        );

    }

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSellerWallet
    );

} else {

    initializeSellerWallet();

                       }

                container.appendChild(item);

            }
        );

    }
