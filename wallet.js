(function () {
    "use strict";

    const supabase = window.supabaseClient;

    let currentUser = null;
    let currentWallet = null;

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
            return value;
        }
    }

    function showMessage(elementId, text, type) {
        const element = document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent = text;

        element.className =
            "form-message show " +
            (type || "");
    }

    function hideMessage(elementId) {
        const element = document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent = "";
        element.className = "form-message";
    }

    function showWalletError(text) {
        const message =
            document.getElementById("wallet-message");

        const content =
            document.getElementById("wallet-content");

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

        if (content) {
            content.hidden = true;
        }
    }

    function setupWalletActions() {
        const depositButton =
            document.getElementById(
                "showDepositButton"
            );

        const withdrawalButton =
            document.getElementById(
                "showWithdrawalButton"
            );

        const depositSection =
            document.getElementById(
                "depositSection"
            );

        const withdrawalSection =
            document.getElementById(
                "withdrawalSection"
            );

        if (depositButton) {
            depositButton.addEventListener(
                "click",
                function () {

                    if (!depositSection) {
                        return;
                    }

                    depositSection.classList.remove(
                        "hidden-section"
                    );

                    if (withdrawalSection) {
                        withdrawalSection.classList.add(
                            "hidden-section"
                        );
                    }

                    depositSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            );
        }

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

                    if (depositSection) {
                        depositSection.classList.add(
                            "hidden-section"
                        );
                    }

                    withdrawalSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            );
        }
    }

    async function loadWallet() {
        if (!supabase) {
            showWalletError(
                "Macheya pa kapab konekte ak bazdone a."
            );
            return;
        }

        const {
            data: auth,
            error: authError
        } = await supabase.auth.getUser();

        if (
            authError ||
            !auth?.user
        ) {
            location.href = "login.html";
            return;
        }

        currentUser = auth.user;

        const {
            data: profile,
            error: profileError
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

        if (profileError) {
            console.error(
                "Profile error:",
                profileError
            );
        }

        const displayName =
            profile?.name ||
            profile?.full_name ||
            profile?.nom_complet ||
            currentUser.email ||
            "Achtè";

        const userElement =
            document.getElementById(
                "wallet-user"
            );

        if (userElement) {
            userElement.textContent =
                displayName;
        }

        const {
            data: wallet,
            error: walletError
        } = await supabase
            .from("wallets")
            .select(
                "id,user_id,balance,currency,updated_at"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();

        if (walletError) {
            console.error(
                "Wallet error:",
                walletError
            );

            showWalletError(
                "Nou pa kapab chaje wallet ou."
            );

            return;
        }

        if (!wallet) {
            showWalletError(
                "Wallet ou poko kreye."
            );

            return;
        }

        if (
            String(wallet.user_id) !==
            String(currentUser.id)
        ) {
            console.error(
                "Wallet ownership mismatch."
            );

            showWalletError(
                "Aksè ak wallet sa a pa otorize."
            );

            return;
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

        const message =
            document.getElementById(
                "wallet-message"
            );

        const content =
            document.getElementById(
                "wallet-content"
            );

        if (message) {
            message.hidden = true;
        }

        if (content) {
            content.hidden = false;
        }

        setupWalletActions();

        await loadPaymentSettings();
        await loadTransactions();
        await loadDepositHistory();
        await loadWithdrawalHistory();

        const depositForm =
            document.getElementById(
                "depositForm"
            );

        const withdrawalForm =
            document.getElementById(
                "withdrawalForm"
            );

        if (depositForm) {
            depositForm.addEventListener(
                "submit",
                submitDeposit
            );
        }

        if (withdrawalForm) {
            withdrawalForm.addEventListener(
                "submit",
                submitWithdrawal
            );
        }
    }

    async function loadPaymentSettings() {
        const moncash =
            document.getElementById(
                "walletMoncashNumber"
            );

        const natcash =
            document.getElementById(
                "walletNatcashNumber"
            );

        try {
            const {
                data,
                error
            } = await supabase
                .from("macheya_settings")
                .select(
                    "moncash_number,natcash_number"
                )
                .eq(
                    "id",
                    1
                )
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (moncash) {
                moncash.textContent =
                    data?.moncash_number ||
                    "Nimewo a poko disponib";
            }

            if (natcash) {
                natcash.textContent =
                    data?.natcash_number ||
                    "Nimewo a poko disponib";
            }

        } catch (error) {
            console.error(
                "Payment settings error:",
                error
            );

            if (moncash) {
                moncash.textContent =
                    "Pa disponib";
            }

            if (natcash) {
                natcash.textContent =
                    "Pa disponib";
            }
        }
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

            if (!data?.length) {
                container.innerHTML = `
                    <div class="wallet-message">
                        <div class="message-icon">
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

                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "transaction";

                    item.innerHTML = `
                        <div class="transaction-left">

                            <div class="transaction-title">
                                ${escapeHtml(
                                    transaction.description ||
                                    (
                                        credit
                                            ? "Kredi wallet"
                                            : "Debi wallet"
                                    )
                                )}
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

                    container.appendChild(
                        item
                    );
                }
            );

        } catch (error) {
            console.error(
                "Transactions error:",
                error
            );

            container.innerHTML = `
                <div class="wallet-message">
                    <div class="message-icon">
                        📭
                    </div>

                    <p>
                        Pa kapab chaje tranzaksyon yo.
                    </p>
                </div>
            `;
        }
              }
      async function submitDeposit(event) {

        event.preventDefault();

        const button =
            document.getElementById(
                "depositButton"
            );

        const method =
            document.getElementById(
                "depositMethod"
            )?.value;

        const amount =
            Number(
                document.getElementById(
                    "depositAmount"
                )?.value
            );

        const transactionId =
            document.getElementById(
                "depositTransactionId"
            )?.value.trim();

        hideMessage("depositMessage");

        if (!method) {
            showMessage(
                "depositMessage",
                "Tanpri chwazi metòd peman an.",
                "error"
            );
            return;
        }

        if (!amount || amount <= 0) {
            showMessage(
                "depositMessage",
                "Tanpri antre yon montan ki valab.",
                "error"
            );
            return;
        }

        if (!transactionId) {
            showMessage(
                "depositMessage",
                "Tanpri antre ID tranzaksyon an.",
                "error"
            );
            return;
        }

        if (!currentUser) {
            showMessage(
                "depositMessage",
                "Sesyon itilizatè a pa disponib.",
                "error"
            );
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Ap voye...";
        }

        try {

            const {
                data: existingRequest,
                error: duplicateError
            } = await supabase
                .from("recharge_requests")
                .select("id")
                .eq(
                    "transaction_id",
                    transactionId
                )
                .maybeSingle();

            if (
                duplicateError &&
                duplicateError.code !== "PGRST116"
            ) {
                throw duplicateError;
            }

            if (existingRequest) {
                throw new Error(
                    "ID tranzaksyon sa a deja itilize."
                );
            }

            const {
                error
            } = await supabase
                .from("recharge_requests")
                .insert({
                    user_id:
                        currentUser.id,

                    amount:
                        amount,

                    method:
                        method,

                    transaction_id:
                        transactionId,

                    status:
                        "pending",

                    created_at:
                        new Date().toISOString()
                });

            if (error) {
                throw error;
            }

            showMessage(
                "depositMessage",
                "Demann rechaj ou a voye avèk siksè. Super Admin ap verifye li.",
                "success"
            );

            const form =
                document.getElementById(
                    "depositForm"
                );

            if (form) {
                form.reset();
            }

            await loadDepositHistory();

        } catch (error) {

            console.error(
                "Deposit request error:",
                error
            );

            showMessage(
                "depositMessage",
                error.message ||
                "Pa kapab voye demann rechaj la.",
                "error"
            );

        } finally {

            if (button) {
                button.disabled = false;
                button.textContent =
                    "📤 Voye demann rechaj";
            }
        }
    }


    async function submitWithdrawal(event) {

        event.preventDefault();

        const button =
            document.getElementById(
                "withdrawalButton"
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

        hideMessage("withdrawalMessage");

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
                "Tanpri antre nimewo pou resevwa lajan an.",
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

        if (!currentUser || !currentWallet) {
            showMessage(
                "withdrawalMessage",
                "Wallet ou pa disponib.",
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
                "Montan an pi gran pase balans wallet ou.",
                "error"
            );
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Ap voye...";
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
                "Demann retrè ou a voye avèk siksè. Super Admin ap verifye li.",
                "success"
            );

            const form =
                document.getElementById(
                    "withdrawalForm"
                );

            if (form) {
                form.reset();
            }

            await loadWithdrawalHistory();

        } catch (error) {

            console.error(
                "Withdrawal request error:",
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


    async function loadDepositHistory() {

        const container =
            document.getElementById(
                "depositHistory"
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
            } = await supabase
                .from("recharge_requests")
                .select(`
                    amount,
                    method,
                    transaction_id,
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

            if (!data?.length) {

                container.innerHTML = `
                    <div class="empty-request">
                        Ou poko gen demann rechaj.
                    </div>
                `;

                return;
            }

            container.innerHTML =
                data.map(
                    function (request) {

                        const status =
                            String(
                                request.status ||
                                "pending"
                            ).toLowerCase();

                        return `
                            <div class="request-item">

                                <div class="request-top">

                                    <span class="request-amount">
                                        +${money(
                                            request.amount
                                        )}
                                    </span>

                                    <span class="request-status ${escapeHtml(
                                        status
                                    )}">
                                        ${escapeHtml(
                                            status
                                        )}
                                    </span>

                                </div>

                                <div>
                                    ${escapeHtml(
                                        request.method ||
                                        "—"
                                    )}
                                </div>

                                <div>
                                    ID:
                                    ${escapeHtml(
                                        request.transaction_id ||
                                        "—"
                                    )}
                                </div>

                                <div class="request-date">
                                    ${escapeHtml(
                                        formatDate(
                                            request.created_at
                                        )
                                    )}
                                </div>

                            </div>
                        `;
                    }
                ).join("");

        } catch (error) {

            console.error(
                "Deposit history error:",
                error
            );

            container.innerHTML = `
                <div class="empty-request">
                    Pa kapab chaje istwa rechaj yo.
                </div>
            `;
        }
    }


    async function loadWithdrawalHistory() {

        const container =
            document.getElementById(
                "withdrawalHistory"
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
            } = await supabase
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

            if (!data?.length) {

                container.innerHTML = `
                    <div class="empty-request">
                        Ou poko gen demann retrè.
                    </div>
                `;

                return;
            }

            container.innerHTML =
                data.map(
                    function (request) {

                        const status =
                            String(
                                request.status ||
                                "pending"
                            ).toLowerCase();

                        return `
                            <div class="request-item">

                                <div class="request-top">

                                    <span class="request-amount">
                                        -${money(
                                            request.amount
                                        )}
                                    </span>

                                    <span class="request-status ${escapeHtml(
                                        status
                                    )}">
                                        ${escapeHtml(
                                            status
                                        )}
                                    </span>

                                </div>

                                <div>
                                    ${escapeHtml(
                                        request.method ||
                                        "—"
                                    )}
                                </div>

                                <div>
                                    📱 ${escapeHtml(
                                        request.phone_number ||
                                        "—"
                                    )}
                                </div>

                                <div class="request-date">
                                    ${escapeHtml(
                                        formatDate(
                                            request.created_at
                                        )
                                    )}
                                </div>

                            </div>
                        `;
                    }
                ).join("");

        } catch (error) {

            console.error(
                "Withdrawal history error:",
                error
            );

            container.innerHTML = `
                <div class="empty-request">
                    Pa kapab chaje istwa retrè yo.
                </div>
            `;
        }
    }


    async function initializeWallet() {

        if (!supabase) {

            showWalletError(
                "Macheya pa kapab konekte ak Supabase."
            );

            return;
        }

        const {
            data: auth,
            error: authError
        } = await supabase.auth.getUser();

        if (
            authError ||
            !auth?.user
        ) {
            location.href = "login.html";
            return;
        }

        currentUser = auth.user;

        const {
            data: wallet,
            error: walletError
        } = await supabase
            .from("wallets")
            .select(
                "id,user_id,balance,currency,updated_at"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();

        if (walletError) {

            console.error(
                "Wallet initialization error:",
                walletError
            );

            showWalletError(
                "Nou pa kapab chaje wallet ou."
            );

            return;
        }

        if (!wallet) {

            showWalletError(
                "Wallet ou poko kreye."
            );

            return;
        }

        if (
            String(wallet.user_id) !==
            String(currentUser.id)
        ) {

            showWalletError(
                "Aksè ak wallet sa a pa otorize."
            );

            return;
        }

        currentWallet = wallet;

        const depositForm =
            document.getElementById(
                "depositForm"
            );

        const withdrawalForm =
            document.getElementById(
                "withdrawalForm"
            );

        if (depositForm) {
            depositForm.addEventListener(
                "submit",
                submitDeposit
            );
        }

        if (withdrawalForm) {
            withdrawalForm.addEventListener(
                "submit",
                submitWithdrawal
            );
        }
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            loadWallet
        );

    } else {

        loadWallet();
    }

})();
