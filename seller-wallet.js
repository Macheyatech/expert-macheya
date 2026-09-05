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
        if (!value) return "Dat pa disponib";
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

    function isCreditType(type) {
        return ["sale", "deposit", "refund", "credit"].includes(type);
    }

    function showWalletMessage(text, type) {
        const message = document.getElementById("wallet-message");
        const content = document.getElementById("wallet-content");

        if (!message) return;

        message.hidden = false;
        if (content) content.hidden = true;

        if (type === "loading") {
            message.innerHTML = `
                <div class="message-icon">💰</div>
                <p>${escapeHtml(text)}</p>
            `;
            return;
        }

        message.innerHTML = `
            <div class="message-icon">⚠️</div>
            <p>${escapeHtml(text)}</p>
            <a href="dashboard.html" class="main-button">Retounen Dashboard</a>
        `;
    }

    function showWalletContent() {
        const message = document.getElementById("wallet-message");
        const content = document.getElementById("wallet-content");

        if (message) message.hidden = true;
        if (content) content.hidden = false;
    }

    function showMessage(elementId, text, type) {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.textContent = text;
        element.className = "form-message show " + (type || "");
    }

    function hideMessage(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.textContent = "";
        element.className = "form-message";
    }

    async function loadProfile() {
        if (!currentUser) return;

        const userElement = document.getElementById("wallet-user");
        if (!userElement) return;

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("name, nom_complet")
                .eq("id", currentUser.id)
                .maybeSingle();

            if (error) throw error;

            userElement.textContent =
                data?.name ||
                data?.nom_complet ||
                currentUser.email ||
                "Vandè";

        } catch (error) {
            console.error("Seller profile error:", error);
            userElement.textContent = currentUser.email || "Vandè";
        }
    }

    async function loadWallet() {
        if (!currentUser) return false;

        try {
            const { data: wallet, error } = await supabase
                .from("wallets")
                .select("id, user_id, balance, currency, updated_at")
                .eq("user_id", currentUser.id)
                .maybeSingle();

            if (error) throw error;

            if (!wallet) {
                showWalletMessage("Wallet ou poko kreye.");
                return false;
            }

            currentWallet = wallet;

            const balanceElement = document.getElementById("wallet-balance");
            if (balanceElement) {
                balanceElement.textContent = money(wallet.balance);
            }

            showWalletContent();
            return true;

        } catch (error) {
            console.error("Seller wallet error:", error);
            showWalletMessage("Nou pa kapab chaje wallet la.");
            return false;
        }
    }

    async function loadWithdrawalFee() {
        withdrawalFeePercentage = 0;

        try {
            const { data, error } = await supabase.rpc("get_public_settings");

            if (error) throw error;

            if (Array.isArray(data) && data.length > 0) {
                withdrawalFeePercentage =
                    Number(data[0].withdrawal_fee_percent) || 0;
            }

        } catch (error) {
            console.error("Withdrawal fee settings error:", error);
        }

        updateWithdrawalCalculation();
    }

    function updateWithdrawalCalculation() {
        const amountInput = document.getElementById("withdrawalAmount");
        const feeElement = document.getElementById("withdrawalFee");
        const totalElement = document.getElementById("withdrawalTotal");
        const netElement = document.getElementById("withdrawalNet");

        if (!amountInput) return;

        const amount = Number(amountInput.value) || 0;
        const fee = Math.round((amount * withdrawalFeePercentage / 100) * 100) / 100;
        const total = Math.round((amount + fee) * 100) / 100;

        if (feeElement) feeElement.textContent = money(fee);
        if (totalElement) totalElement.textContent = money(total);
        if (netElement) netElement.textContent = money(amount);
    }

    // ✅ NOUVO: Montre/kache avètisman frè MonCash/NatCash
    function updateWithdrawalNotice() {
        const methodSelect = document.getElementById("withdrawalMethod");
        const noticeBox = document.getElementById("withdrawalFeeNotice");
        const noticeText = document.getElementById("withdrawalFeeNoticeText");

        if (!methodSelect || !noticeBox) return;

        const method = methodSelect.value;

        if (method === "moncash") {
            noticeBox.classList.remove("hidden");
            if (noticeText) noticeText.textContent = "MonCash";
        } else if (method === "natcash") {
            noticeBox.classList.remove("hidden");
            if (noticeText) noticeText.textContent = "NatCash";
        } else {
            noticeBox.classList.add("hidden");
        }
    }

    function setupWithdrawalCalculation() {
        const amountInput = document.getElementById("withdrawalAmount");
        const methodSelect = document.getElementById("withdrawalMethod");

        if (amountInput) {
            amountInput.addEventListener("input", updateWithdrawalCalculation);
        }

        // ✅ NOUVO: Event listener sou metòd la
        if (methodSelect) {
            methodSelect.addEventListener("change", updateWithdrawalNotice);
        }
    }

    async function loadTransactions() {
        const container = document.getElementById("wallet-transactions");
        if (!container || !currentWallet) return;

        try {
            const { data, error } = await supabase
                .from("wallet_transactions")
                .select("id, wallet_id, type, amount, description, created_at")
                .eq("wallet_id", currentWallet.id)
                .order("created_at", { ascending: false })
                .limit(30);

            if (error) throw error;

            renderTransactions(data || []);

        } catch (error) {
            console.error("Seller transactions error:", error);
            container.innerHTML = `
                <div class="empty-request">Pa kapab chaje tranzaksyon yo pou kounya.</div>
            `;
        }
    }

    function renderTransactions(transactions) {
        const container = document.getElementById("wallet-transactions");
        if (!container) return;

        if (!transactions.length) {
            container.innerHTML = `
                <div class="empty-request">Ou poko gen okenn tranzaksyon.</div>
            `;
            return;
        }

        container.innerHTML = "";

        transactions.forEach(function (transaction) {
            const type = String(transaction.type || "").toLowerCase();
            const credit = isCreditType(type);
            const sign = credit ? "+" : "-";
            const className = credit ? "credit" : "debit";
            const absAmount = Math.abs(Number(transaction.amount) || 0);

            const title = transaction.description ||
                (credit ? "Kredi wallet" : "Debi wallet");

            const item = document.createElement("div");
            item.className = "transaction";

            item.innerHTML = `
                <div class="transaction-left">
                    <div class="transaction-title">${escapeHtml(title)}</div>
                    <div class="transaction-date">${escapeHtml(formatDate(transaction.created_at))}</div>
                </div>
                <div class="transaction-amount ${className}">${sign}${money(absAmount)}</div>
            `;

            container.appendChild(item);
        });
    }

    async function calculateTotals() {
        if (!currentUser || !currentWallet) return;

        const earnedElement = document.getElementById("total-earned");
        const withdrawnElement = document.getElementById("total-withdrawn");

        try {
            const { data, error } = await supabase
                .from("wallet_transactions")
                .select("type, amount")
                .eq("wallet_id", currentWallet.id);

            if (!error && data) {
                let earned = 0;
                data.forEach(function (t) {
                    if (String(t.type || "").toLowerCase() === "sale") {
                        earned += Number(t.amount) || 0;
                    }
                });
                if (earnedElement) earnedElement.textContent = money(earned);
            }
        } catch (error) {
            console.error("Totals transactions error:", error);
        }

        try {
            const { data, error } = await supabase
                .from("withdrawal_requests")
                .select("amount, status")
                .eq("user_id", currentUser.id);

            if (!error && data) {
                let withdrawn = 0;
                data.forEach(function (r) {
                    if (String(r.status || "").toLowerCase() === "approved") {
                        withdrawn += Number(r.amount) || 0;
                    }
                });
                if (withdrawnElement) withdrawnElement.textContent = money(withdrawn);
            }
        } catch (error) {
            console.error("Totals withdrawals error:", error);
        }
    }

    async function loadWithdrawalHistory() {
        const container = document.getElementById("withdrawalHistory");
        if (!container || !currentUser || !currentWallet) return;

        try {
            const { data, error } = await supabase
                .from("withdrawal_requests")
                .select("id, amount, fee, total_deducted, method, destination_account, status, admin_note, created_at")
                .eq("user_id", currentUser.id)
                .eq("wallet_id", currentWallet.id)
                .order("created_at", { ascending: false })
                .limit(10);

            if (error) throw error;

            renderWithdrawalHistory(data || []);

        } catch (error) {
            console.error("Seller withdrawal history error:", error);
            container.innerHTML = `
                <div class="empty-request">Pa kapab chaje istwa retrè yo.</div>
            `;
        }
    }

    function renderWithdrawalHistory(requests) {
        const container = document.getElementById("withdrawalHistory");
        if (!container) return;

        if (!requests.length) {
            container.innerHTML = `
                <div class="empty-request">Ou poko fè okenn demann retrè.</div>
            `;
            return;
        }

        container.innerHTML = "";

        requests.forEach(function (request) {
            const status = String(request.status || "pending").toLowerCase();

            const statusText =
                status === "approved" ? "Apwouve" :
                status === "rejected" ? "Rejte" :
                "An atant";

            const amount = Number(request.amount) || 0;
            const fee = Number(request.fee) || 0;
            const totalDeducted = Number(request.total_deducted) || 0;

            const item = document.createElement("div");
            item.className = "request-item";

            item.innerHTML = `
                <div class="request-top">
                    <span class="request-amount">${money(amount)}</span>
                    <span class="request-status ${escapeHtml(status)}">${statusText}</span>
                </div>
                <div class="request-method">Metòd: ${escapeHtml(request.method || "—")}</div>
                <div class="request-phone">📱 ${escapeHtml(request.destination_account || "—")}</div>
                <div class="request-fee">Frè retrè: ${money(fee)}</div>
                <div class="request-net">Total ki soti: ${money(totalDeducted)}</div>
                ${request.admin_note ? `<div class="request-note">📝 ${escapeHtml(request.admin_note)}</div>` : ""}
                <div class="request-date">${escapeHtml(formatDate(request.created_at))}</div>
            `;

            container.appendChild(item);
        });
    }

    async function submitWithdrawal(event) {
        event.preventDefault();

        const button = document.getElementById("withdrawalSubmit");
        const method = document.getElementById("withdrawalMethod")?.value;
        const phone = document.getElementById("withdrawalPhone")?.value.trim();
        const amount = Number(document.getElementById("withdrawalAmount")?.value);

        hideMessage("withdrawalMessage");

        if (!method) {
            showMessage("withdrawalMessage", "Tanpri chwazi metòd retrè a.", "error");
            return;
        }

        if (!phone) {
            showMessage("withdrawalMessage", "Tanpri antre nimewo kote w ap resevwa lajan an.", "error");
            return;
        }

        if (!amount || amount <= 0) {
            showMessage("withdrawalMessage", "Tanpri antre yon montan ki valab.", "error");
            return;
        }

        if (!currentWallet) {
            showMessage("withdrawalMessage", "Wallet la pa disponib.", "error");
            return;
        }

        const balance = Number(currentWallet.balance) || 0;
        const fee = Math.round((amount * withdrawalFeePercentage / 100) * 100) / 100;

        if (amount + fee > balance) {
            showMessage(
                "withdrawalMessage",
                "Balans ou pa ase. Ou bezwen " + money(amount + fee) + " (montan + frè).",
                "error"
            );
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Ap voye...";
        }

        try {
            const { error } = await supabase.rpc("create_withdrawal_request", {
                p_amount: amount,
                p_method: method,
                p_destination_account: phone,
                p_note: null
            });

            if (error) throw error;

            showMessage(
                "withdrawalMessage",
                "Demann retrè ou a voye avèk siksè. Super Admin ap verifye li.",
                "success"
            );

            const form = document.getElementById("withdrawalForm");
            if (form) form.reset();

            updateWithdrawalCalculation();
            updateWithdrawalNotice();
            await loadWithdrawalHistory();
            await calculateTotals();

        } catch (error) {
            console.error("Seller withdrawal error:", error);
            showMessage("withdrawalMessage", error.message || "Pa kapab voye demann retrè a.", "error");

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "📤 Voye demann retrè";
            }
        }
    }

    function setupWithdrawalButton() {
        const button = document.getElementById("openWithdrawal");
        const section = document.getElementById("withdrawalSection");

        if (!button || !section) return;

        button.addEventListener("click", function () {
            section.classList.remove("hidden");
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    async function initializeSellerWallet() {
        if (!supabase) {
            showWalletMessage("Sistèm wallet la pa disponib pou kounya.");
            return;
        }

        showWalletMessage("Ap chaje wallet ou...", "loading");

        try {
            const { data: auth, error: authError } = await supabase.auth.getUser();

            if (authError || !auth?.user) {
                location.href = "login.html";
                return;
            }

            currentUser = auth.user;

            const walletLoaded = await loadWallet();
            if (!walletLoaded) return;

            await loadProfile();
            await loadWithdrawalFee();

            setupWithdrawalButton();
            setupWithdrawalCalculation();

            // ✅ NOUVO: Inisyalize avètisman an
            updateWithdrawalNotice();

            await loadTransactions();
            await loadWithdrawalHistory();
            await calculateTotals();

            const withdrawalForm = document.getElementById("withdrawalForm");
            if (withdrawalForm) {
                withdrawalForm.addEventListener("submit", submitWithdrawal);
            }

        } catch (error) {
            console.error("Seller wallet initialization error:", error);
            showWalletMessage("Nou pa kapab chaje wallet la pou kounya.");
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeSellerWallet);
    } else {
        initializeSellerWallet();
    }

})();
