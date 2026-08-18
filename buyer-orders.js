(function () {
    "use strict";

    const supabase = window.supabaseClient;

    const list = document.getElementById("orders-list");
    const message = document.getElementById("orders-message");

    const statusText = {
        pending: "Nouvo",
        confirmed: "Konfime",
        shipped: "Livre",
        delivered: "Resevwa",
        cancelled: "Anile"
    };

    function money(value) {
        return new Intl.NumberFormat("fr-FR").format(
            Number(value || 0)
        ) + " HTG";
    }

    async function loadOrders() {

        if (!supabase) {
            message.textContent = "Supabase pa disponib.";
            return;
        }

        const { data: auth } =
            await supabase.auth.getUser();

        if (!auth?.user) {
            location.href = "login.html";
            return;
        }

        const { data, error } =
            await supabase
                .from("orders")
                .select("*")
                .eq("buyer_id", auth.user.id)
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            console.error(error);
            message.textContent =
                "Nou pa kapab chaje kòmand yo.";
            return;
        }

        if (!data?.length) {
            message.textContent =
                "Ou poko gen okenn kòmand.";
            return;
        }

        message.textContent = "";
        list.innerHTML = "";

        data.forEach(renderOrder);
    }

    function renderOrder(order) {

        const card =
            document.createElement("article");

        card.className = "order-card";

        const status =
            order.status || "pending";

        let warning = "";

        if (status === "shipped" && order.delivered_at) {

            const deliveredAt =
                new Date(order.delivered_at);

            const deadline =
                new Date(deliveredAt);

            deadline.setDate(
                deadline.getDate() + 3
            );

            const now = new Date();

            if (now < deadline) {

                const days =
                    Math.ceil(
                        (deadline - now) /
                        (1000 * 60 * 60 * 24)
                    );

                warning =
                    `<div class="delivery-warning">
                        🚚 Kòmand lan make kòm livre.
                        Ou gen anviwon ${days} jou pou konfime resepsyon an.
                    </div>`;
            }
        }

        card.innerHTML = `
            <div class="order-top">

                <div class="order-product">
                    ${escapeHTML(
                        order.product_name || "Pwodwi"
                    )}
                </div>

                <span class="order-status">
                    ${statusText[status] || status}
                </span>

            </div>

            <div class="order-info">

                <div>
                    📦 Kantite:
                    <strong>
                        ${order.quantity || 1}
                    </strong>
                </div>

                <div>
                    💰 Total:
                    <strong>
                        ${money(
                            Number(order.price || 0) *
                            Number(order.quantity || 1)
                        )}
                    </strong>
                </div>

                <div>
                    📍 Adrès livrezon:
                    <strong>
                        ${escapeHTML(
                            order.delivery_address || ""
                        )}
                    </strong>
                </div>

                ${
                    order.delivery_note
                    ? `
                    <div>
                        📝 Remak:
                        <strong>
                            ${escapeHTML(
                                order.delivery_note
                            )}
                        </strong>
                    </div>
                    `
                    : ""
                }

            </div>

            ${warning}

            <div class="order-actions">

                ${
                    status === "shipped"
                    ? `
                    <button
                        data-id="${order.id}"
                    >
                        ✓ Mwen resevwa kòmand lan
                    </button>
                    `
                    : ""
                }

            </div>
        `;

        list.appendChild(card);

        const button =
            card.querySelector("button");

        if (button) {

            button.addEventListener(
                "click",
                function () {
                    confirmReceived(
                        button.dataset.id
                    );
                }
            );
        }
    }

    async function confirmReceived(id) {

        if (!confirm(
            "Èske ou konfime ou resevwa kòmand lan?"
        )) {
            return;
        }

        const { error } =
            await supabase
                .from("orders")
                .update({
                    status: "delivered",
                    delivered_at: new Date().toISOString()
                })
                .eq("id", id);

        if (error) {

            console.error(error);

            alert(
                "Nou pa t kapab konfime resepsyon an."
            );

            return;
        }

        alert(
            "Resepsyon kòmand lan konfime."
        );

        loadOrders();
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
