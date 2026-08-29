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


    function showMessage(elementId, text, type) {

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


    function hideMessage(elementId) {

        const element =
            document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent = "";

        element.className =
            "form-message";

    }


    function showWalletError(text) {

        const message =
            document.getElementById("wallet-message");

        const content =
            document.getElementById("wallet-content");

        if (content) {
            content.hidden = true;
        }

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
                href="dashboard.html"
                class="main-button"
            >
                Retounen Dashboard
            </a>

        `;

    }


    function showWalletContent() {

        const message =
            document.getElementById("wallet-message");

        const content =
            document.getElementById("wallet-content");

        if (message) {
            message.hidden = true;
        }

        if (content) {
            content.hidden = false;
        }

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
                data?.email ||
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

        try {

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
                throw error;
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
                document.getElementById(
                    "wallet-balance"
                );


            if (balanceElement) {

                balanceElement.textContent =
                    money(wallet.balance);

            }


            return true;

        } catch (error) {

            console.error(
                "Seller wallet error:",
                error
            );

            showWalletError(
                "Nou pa kapab chaje wallet vandè a."
            );

            return false;

        }

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
            (
                withdrawalFeePercentage /
                100
            );


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


    function setupWithdrawalButton() {

        const button =
            document.getElementById(
                "openWithdrawal"
            );

        const section =
            document.getElementById(
                "withdrawalSection"
            );

        if (!button || !section) {
            return;
        }

        button.addEventListener(
            "click",
            function () {

                section.classList.remove(
                    "hidden"
                );

                section.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    }


    async function loadTransactions() {

        const container =
            document.getElementById(
                "wallet-transactions"
            );

        if (
            !container ||
            !currentWallet
        ) {
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
                    credit
                        ? "+"
                        : "-";


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
                    document.createElement(
                        "div"
                    );


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

        if (
            !container ||
            !currentUser ||
            !currentWallet
        ) {
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


                const statusText =
                    status === "approved"
                        ? "Apwouve"
                        : status === "rejected"
                            ? "Rejte"
                            : "An atant";


                const amount =
                    Number(
                        request.amount
                    ) || 0;


                const fee =
                    amount *
                    (
                        withdrawalFeePercentage /
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
                    "request-item";


                item.innerHTML = `

                    <div class="request-top">

                        <span class="request-amount">
                            ${money(amount)}
                        </span>

                        <span
                            class="request-status ${escapeHtml(
                                status
                            )}"
                        >
                            ${statusText}
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


                container.appendChild(item);

            }
        );

                }
        async function submitWithdrawal(event) {

        event.preventDefault();


        const button =
            document.getElementById(
                "withdrawalSubmit"
            );


        const method =
            document.getElementById(
                "withdrawalMethod"
            )?.value;


        const phone =
            document.getElementById(
                "withdrawalPhone"
            )?.value.trim();


        const amount =
            Number(
                document.getElementById(
                    "withdrawalAmount"
                )?.value
            );


        hideMessage(
            "withdrawalMessage"
        );


        if (!method) {

            showMessage(
                "withdrawalMessage",
                "Tanpri chwazi metòd retrè a.",
                "error"
            );

            return;

        }


        if (!phone) {

            showMessage(
                "withdrawalMessage",
                "Tanpri antre nimewo kote w ap resevwa lajan an.",
                "error"
            );

            return;

        }


        if (!amount || amount <= 0) {

            showMessage(
                "withdrawalMessage",
                "Tanpri antre yon montan ki valab.",
                "error"
            );

            return;

        }


        if (!currentWallet) {

            showMessage(
                "withdrawalMessage",
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
                "withdrawalMessage",
                "Montan an pi gran pase balans disponib la.",
                "error"
            );

            return;

        }


        const fee =
            amount *
            (
                withdrawalFeePercentage /
                100
            );


        const net =
            Math.max(
                0,
                amount - fee
            );


        if (button) {

            button.disabled = true;

            button.textContent =
                "Ap voye...";

        }


        try {

            const {
                error
            } = await supabase
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
                "withdrawalMessage",
                `Demann retrè ou a voye avèk siksè. Frè ${withdrawalFeePercentage}% la se ${money(fee)}. W ap resevwa ${money(net)} apre frè a.`,
                "success"
            );


            const form =
                document.getElementById(
                    "withdrawalForm"
                );


            if (form) {
                form.reset();
            }


            updateWithdrawalCalculation();


            await loadWithdrawalHistory();


        } catch (error) {

            console.error(
                "Seller withdrawal error:",
                error
            );


            showMessage(
                "withdrawalMessage",
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


    async function loadWalletSummary() {

        if (
            !currentUser ||
            !currentWallet
        ) {
            return;
        }


        const earnedElement =
            document.getElementById(
                "total-earned"
            );


        const withdrawnElement =
            document.getElementById(
                "total-withdrawn"
            );


        try {

            const {
                data: transactions,
                error: transactionsError
            } = await supabase
                .from("wallet_transactions")
                .select(
                    "type,amount"
                )
                .eq(
                    "wallet_id",
                    currentWallet.id
                );


            if (transactionsError) {
                throw transactionsError;
            }


            let totalEarned = 0;


            (transactions || []).forEach(
                function (transaction) {

                    const type =
                        String(
                            transaction.type || ""
                        ).toLowerCase();


                    const isCredit =
                        type === "credit" ||
                        type === "sale" ||
                        type === "deposit";


                    if (isCredit) {

                        totalEarned +=
                            Number(
                                transaction.amount
                            ) || 0;

                    }

                }
            );


            if (earnedElement) {

                earnedElement.textContent =
                    money(totalEarned);

            }


            const {
                data: withdrawals,
                error: withdrawalsError
            } = await supabase
                .from("withdrawal_requests")
                .select(
                    "amount,status"
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .eq(
                    "wallet_id",
                    currentWallet.id
                );


            if (withdrawalsError) {
                throw withdrawalsError;
            }


            let totalWithdrawn = 0;


            (withdrawals || []).forEach(
                function (request) {

                    const status =
                        String(
                            request.status || ""
                        ).toLowerCase();


                    if (
                        status === "approved" ||
                        status === "completed" ||
                        status === "paid"
                    ) {

                        totalWithdrawn +=
                            Number(
                                request.amount
                            ) || 0;

                    }

                }
            );


            if (withdrawnElement) {

                withdrawnElement.textContent =
                    money(totalWithdrawn);

            }


        } catch (error) {

            console.error(
                "Seller wallet summary error:",
                error
            );

        }

    }


    function setupWithdrawalForm() {

        const form =
            document.getElementById(
                "withdrawalForm"
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            submitWithdrawal
        );

    }


    async function initializeSellerWallet() {

        if (!supabase) {

            console.error(
                "Supabase client pa disponib."
            );

            showWalletError(
                "Supabase pa disponib. Verify koneksyon an."
            );

            return;

        }


        try {

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


            const walletLoaded =
                await loadWallet();


            if (!walletLoaded) {
                return;
            }


            await loadProfile();


            await loadWithdrawalFee();


            setupWithdrawalButton();


            setupWithdrawalCalculation();


            setupWithdrawalForm();


            await loadTransactions();


            await loadWithdrawalHistory();


            await loadWalletSummary();


            showWalletContent();


        } catch (error) {

            console.error(
                "Seller wallet initialization error:",
                error
            );


            showWalletError(
                "Gen yon pwoblèm pandan n ap chaje wallet vandè a."
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

})();
