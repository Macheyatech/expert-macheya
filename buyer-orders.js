(function () {
    "use strict";

    const supabase = window.supabaseClient;
    const list = document.getElementById("orders-list");
    const message = document.getElementById("orders-message");

    const statusText = {
        pending_payment: "Ap tann peman",
        confirmed: "Konfime - Seller ap prepare",
        delivered: "Livre - Ap tann konfimasyon ou",
        completed: "Fini",
        refunded: "Refunded",
        cancelled: "Anile"
    };

    const money = value =>
        new Intl.NumberFormat("fr-FR").format(
            Number(value || 0)
        ) + " HTG";

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

        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("buyer_id", auth.user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            message.textContent = "Nou pa kapab chaje kòmand yo.";
            return;
        }

        list.innerHTML = "";

        if (!data?.length) {
            message.textContent = "Ou poko gen okenn kòmand.";
            return;
        }

        message.textContent = "";
        data.forEach(renderOrder);
    }

    function renderOrder(order) {
        const card = document.createElement("article");
        card.className = "order-card";

        const status = order.status || "pending_payment";
        const fundsStatus = order.funds_status || "unpaid";
        const isDigital = order.product_type === "digital" || 
                          (order.digital_file_url && order.digital_file_url.length > 0);

        // Kalkile total ak frè
        const buyerPaidTotal = Number(order.buyer_paid_total || 0);
        const platformFee = Number(order.platform_fee || 0);
        const subtotal = buyerPaidTotal - platformFee;

        // Kalkile jou ki rete pou konfime livrezon
        let warning = "";
        let remainingDays = null;

        if (status === "delivered" && order.delivered_at) {
            const deadline = new Date(order.delivered_at);
            deadline.setDate(deadline.getDate() + 3);
            const remaining = deadline - new Date();

            if (remaining > 0) {
                remainingDays = Math.ceil(remaining / (1000 * 60 * 60 * 24));
                warning = `
                    <div class="delivery-warning">
                        🚚 Vandè a make kòmand lan kòm livre.
                        Ou gen ${remainingDays} jou pou konfime resepsyon an.
                        Apre ${remainingDays} jou, lajan an ap lage otomatikman bay vandè a.
                    </div>
                `;
            }
        }

        // Bouton aksyon yo
        let actions = "";

        // Orders ki poko peye
        if (fundsStatus === "unpaid") {
            actions = `
                <div class="order-actions">
                    <button type="button" class="pay-button" data-id="${order.id}">
                        💳 Peye kounye a
                    </button>
                    <button type="button" class="cancel-button" data-id="${order.id}" style="background:#666;">
                        ✕ Anile kòmand
                    </button>
                </div>
            `;
        }
        // Orders ki livre (ap tann konfimasyon buyer)
        else if (status === "delivered" && fundsStatus === "held") {
            actions = `
                <div class="order-actions">
                    <button type="button" class="confirm-button" data-id="${order.id}">
                        ✓ Mwen resevwa kòmand lan
                    </button>
                    <button type="button" class="refund-button" data-id="${order.id}" style="background:#dc2626;">
                        ↩ Mande refund
                    </button>
                </div>
            `;
        }
        // Orders ki fini (completed) - bouton download pou dijital
        else if (status === "completed" && isDigital) {
            actions = `
                <div class="order-actions">
                    <button type="button" class="download-button" data-id="${order.id}">
                        📥 Telechaje fichye a
                    </button>
                </div>
            `;
        }
        // Orders ki refunded - bouton download si dijital
        else if (status === "refunded" && isDigital) {
            actions = `
                <div class="order-actions">
                    <button type="button" class="download-button" data-id="${order.id}">
                        📥 Telechaje fichye a
                    </button>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="order-top">
                <div class="order-product">
                    ${escapeHTML(order.product_name || "Pwodwi")}
                    ${isDigital ? ' <small style="color:#f97316;">(Dijital)</small>' : ''}
                </div>

                <span class="order-status">
                    ${statusText[status] || status}
                </span>
            </div>

            <div class="order-info">

                <div>
                    📦 Kantite:
                    <strong>${order.quantity || 1}</strong>
                </div>

                <div>
                    💰 Soutotal:
                    <strong>${money(subtotal)}</strong>
                </div>

                ${platformFee > 0 ? `
                <div>
                    💳 Frè Macheya:
                    <strong>${money(platformFee)}</strong>
                </div>
                ` : ""}

                <div>
                    💰 Total peye:
                    <strong>${money(buyerPaidTotal)}</strong>
                </div>

                <div>
                    📍 Adrès:
                    <strong>${escapeHTML(order.delivery_address || "")}</strong>
                </div>

                ${order.delivery_note ? `
                <div>
                    📝 Remak:
                    <strong>${escapeHTML(order.delivery_note)}</strong>
                </div>
                ` : ""}

                ${status === "completed" && order.completed_at ? `
                <div>
                    ✅ Fini le:
                    <strong>${new Date(order.completed_at).toLocaleString("fr-FR")}</strong>
                </div>
                ` : ""}

                ${status === "refunded" && order.refund_reason ? `
                <div>
                    ↩ Rezon refund:
                    <strong>${escapeHTML(order.refund_reason)}</strong>
                </div>
                ` : ""}

            </div>

            ${warning}

            ${actions}
        `;

        list.appendChild(card);

        // Atache event listeners
        const confirmBtn = card.querySelector(".confirm-button");
        if (confirmBtn) {
            confirmBtn.onclick = () => confirmReceived(confirmBtn.dataset.id);
        }

        const refundBtn = card.querySelector(".refund-button");
        if (refundBtn) {
            refundBtn.onclick = () => requestRefund(refundBtn.dataset.id);
        }

        const downloadBtn = card.querySelector(".download-button");
        if (downloadBtn) {
            downloadBtn.onclick = () => downloadDigitalFile(downloadBtn.dataset.id);
        }

        const cancelBtn = card.querySelector(".cancel-button");
        if (cancelBtn) {
            cancelBtn.onclick = () => cancelOrder(cancelBtn.dataset.id);
        }

        const payBtn = card.querySelector(".pay-button");
        if (payBtn) {
            payBtn.onclick = () => payOrder(payBtn.dataset.id);
        }
    }

    async function confirmReceived(id) {
        if (!confirm(
            "Èske ou konfime ou resevwa kòmand lan?\n\n" +
            "Apre konfimasyon sa a, lajan an ap lage bay vandè a."
        )) return;

        try {
            const { error } = await supabase.rpc("confirm_order_delivery", {
                p_order_id: id
            });

            if (error) throw error;

            alert("Resepsyon kòmand lan konfime. Mèsi!");
            loadOrders();

        } catch (error) {
            console.error(error);
            alert("Nou pa t kapab konfime resepsyon an: " + error.message);
        }
    }

    async function requestRefund(id) {
        const reason = prompt(
            "Poukisa ou mande refund?\n\n" +
            "Tanpri eksplike pwoblèm nan (egzanp: pwodwi pa rive, pwodwi domaje, etc.)"
        );

        if (!reason || !reason.trim()) return;

        if (!confirm(
            "Èske ou sèten ou vle mande refund?\n\n" +
            "Lajan an ap retounen nan wallet ou."
        )) return;

        try {
            const { error } = await supabase.rpc("refund_order", {
                p_order_id: id,
                p_reason: reason.trim()
            });

            if (error) throw error;

            alert("Refund demann trete. Lajan an retounen nan wallet ou.");
            loadOrders();

        } catch (error) {
            console.error(error);
            alert("Nou pa t kapab trete refund la: " + error.message);
        }
    }

    async function downloadDigitalFile(id) {
        try {
            const { data: fileUrl, error } = await supabase.rpc("get_order_digital_file", {
                p_order_id: id
            });

            if (error) throw error;

            if (fileUrl) {
                window.open(fileUrl, "_blank");
            } else {
                alert("Fichye a pa disponib.");
            }

        } catch (error) {
            console.error(error);
            alert("Nou pa t kapab telechaje fichye a: " + error.message);
        }
    }

    async function cancelOrder(id) {
        if (!confirm(
            "Èske ou sèten ou vle anile kòmand sa a?\n\n" +
            "Stock la ap retounen bay vandè a."
        )) return;

        try {
            const { error } = await supabase.rpc("cancel_order", {
                p_order_id: id
            });

            if (error) throw error;

            alert("Kòmand lan anile avèk siksè.");
            loadOrders();

        } catch (error) {
            console.error(error);
            alert("Nou pa t kapab anile kòmand lan: " + error.message);
        }
    }

    async function payOrder(id) {
        if (!confirm(
            "Èske ou vle peye kòmand sa a kounye a?\n\n" +
            "Lajan an ap soti nan wallet ou."
        )) return;

        try {
            const { error } = await supabase.rpc("pay_order", {
                p_order_id: id
            });

            if (error) throw error;

            alert("Peman konfime! Vandè a pral prepare kòmand ou a.");
            loadOrders();

        } catch (error) {
            console.error(error);
            alert("Nou pa t kapab trete peman an: " + error.message);
        }
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    loadOrders();

})();
