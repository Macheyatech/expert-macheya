(function () {
    "use strict";

    const supabase = window.supabaseClient;

    const list = document.getElementById("orders-list");
    const message = document.getElementById("orders-message");

    // Status vizib pou seller
    const statusText = {
        pending_payment: "Ap tann peman",  // Seller pa wè sa (pa peye ankò)
        confirmed: "Konfime - Prepare livrezon",
        delivered: "Resevwa - Ap tann konfimasyon",
        completed: "Fini",
        refunded: "Refunded",
        cancelled: "Anile"
    };

    function money(value) {
        return new Intl.NumberFormat("fr-FR").format(
            Number(value || 0)
        ) + " HTG";
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ============================================================
       VERIFYE WÒL SELLER
    ============================================================ */

    async function verifySellerRole(userId) {
        const { data: profile, error } = await supabase
            .from("profiles")
            .select("role, est_vendeur")
            .eq("id", userId)
            .maybeSingle();

        if (error || !profile) {
            return false;
        }

        const role = String(profile.role || "").toLowerCase().trim();
        return role === "vendeur" || role === "seller" || profile.est_vendeur === true;
    }

    /* ============================================================
       CHAJÉ KÒMAND YO
    ============================================================ */

    async function loadOrders() {
        if (!supabase) {
            message.textContent = "Supabase pa disponib.";
            return;
        }

        const { data: auth } = await supabase.auth.getUser();

        if (!auth?.user) {
            location.href = "login.html";
            return;
        }

        // Verifye seller role
        const isSeller = await verifySellerRole(auth.user.id);
        if (!isSeller) {
            message.textContent = "Ou pa gen pèmisyon pou wè paj sa a.";
            setTimeout(() => {
                location.href = "marketplace.html";
            }, 2000);
            return;
        }

        message.textContent = "Ap chaje kòmand yo...";

        // Chaje sèlman orders ki peye (confirmed ak plis)
        // Orders ki poko peye (pending_payment) pa konsène seller la
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("seller_id", auth.user.id)
            .neq("funds_status", "unpaid")  // Pa montre orders ki poko peye
            .order("created_at", { ascending: false });

        if (error) {
            console.error("MACHEYA LOAD ORDERS:", error);
            message.textContent = "Nou pa kapab chaje kòmand yo.";
            return;
        }

        if (!data || !data.length) {
            list.innerHTML = "";
            message.textContent = "Pa gen kòmand pou kounye a.";
            return;
        }

        message.textContent = "";
        list.innerHTML = "";

        data.forEach(renderOrder);
    }

    /* ============================================================
       MONTRÉ YON KÒMAND
    ============================================================ */

    function renderOrder(order) {
        const card = document.createElement("article");
        card.className = "order-card";

        const status = order.status || "pending";

        let orderTotal = Number(order.total || 0);
        let unitPrice = Number(order.price || 0);

        if (orderTotal <= 0 && unitPrice > 0) {
            orderTotal = unitPrice * Number(order.quantity || 1);
        }

        // Kantite seller ap resevwa (pa gen ladan fee Macheya)
        const sellerAmount = Number(order.seller_amount || orderTotal);

        card.innerHTML = `
            <div class="order-top">
                <div class="order-product">
                    ${escapeHTML(order.product_name || "Pwodwi")}
                </div>
                <span class="order-status">
                    ${statusText[status] || status}
                </span>
            </div>

            <div class="order-info">
                <div>
                    👤 Kliyan:
                    <strong>${escapeHTML(order.buyer_name || "")}</strong>
                </div>

                <div>
                    📞 Telefòn:
                    <strong>${escapeHTML(order.buyer_phone || "")}</strong>
                </div>

                <div>
                    📍 Adrès:
                    <strong>${escapeHTML(order.delivery_address || "")}</strong>
                </div>

                <div>
                    📦 Kantite:
                    <strong>${Number(order.quantity || 1)}</strong>
                </div>

                <div>
                    💰 Ou ap resevwa:
                    <strong>${money(sellerAmount)}</strong>
                </div>

                ${order.delivery_note ? `
                    <div>
                        📝 Remak:
                        <strong>${escapeHTML(order.delivery_note)}</strong>
                    </div>
                ` : ""}

                ${order.status === "completed" && order.completed_at ? `
                    <div>
                        ✅ Fini le:
                        <strong>${new Date(order.completed_at).toLocaleString("fr-FR")}</strong>
                    </div>
                ` : ""}
            </div>

            <div class="order-actions">
                ${status === "confirmed" ? `
                    <button
                        class="deliver"
                        data-action="deliver"
                        data-id="${order.id}"
                    >
                        🚚 Mete kòm livre
                    </button>
                ` : ""}
            </div>
        `;

        list.appendChild(card);

        const deliverBtn = card.querySelector('[data-action="deliver"]');
        if (deliverBtn) {
            deliverBtn.addEventListener("click", function () {
                markAsDelivered(this.dataset.id, this);
            });
        }
    }

    /* ============================================================
       METE KÒMAND KÒM LIVRE (via RPC)
    ============================================================ */

    async function markAsDelivered(orderId, button) {
        if (!button) return;

        const confirmed = confirm(
            "Èske ou sèten pwodwi a livre bay kliyan an?\n\n" +
            "Apre aksyon sa a, kliyan an ap gen 3 jou pou konfime " +
            "ke li resevwa pwodwi a. Lajan an ap kredite nan wallet ou " +
            "apre konfimasyon an oswa apre 3 jou otomatikman."
        );

        if (!confirmed) return;

        button.disabled = true;
        button.textContent = "M ap trete...";

        try {
            const { error } = await supabase.rpc(
                "seller_mark_order_delivered",
                { p_order_id: orderId }
            );

            if (error) {
                throw error;
            }

            button.textContent = "✓ Livre";
            button.classList.add("disabled");

            // Refresh lis la
            setTimeout(() => loadOrders(), 1000);

        } catch (error) {
            console.error("MARK DELIVERED ERROR:", error);

            alert(
                "Nou pa t kapab make kòmand lan kòm livre.\n\n" +
                (error.message || "Eseye ankò pita.")
            );

            button.disabled = false;
            button.textContent = "🚚 Mete kòm livre";
        }
    }

    /* ============================================================
       INISYALIZASYON
    ============================================================ */

    loadOrders();

})();
