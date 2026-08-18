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
            message.textContent =
                "Supabase pa disponib.";
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
                .eq("seller_id", auth.user.id)
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
                "Pa gen kòmand kliyan pou kounye a.";
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
                    👤 Kliyan:
                    <strong>
                        ${escapeHTML(
                            order.buyer_name || ""
                        )}
                    </strong>
                </div>

                <div>
                    📞 Telefòn:
                    <strong>
                        ${escapeHTML(
                            order.buyer_phone || ""
                        )}
                    </strong>
                </div>

                <div>
                    📍 Adrès:
                    <strong>
                        ${escapeHTML(
                            order.delivery_address || ""
                        )}
                    </strong>
                </div>

                <div>
                    📦 Kantite:
                    <strong>
                        ${order.quantity || 1}
                    </strong>
                </div>

                <div>
                    💰 Pri:
                    <strong>
                        ${money(
                            Number(order.price || 0) *
                            Number(order.quantity || 1)
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

            <div class="order-actions">

                <button
                    class="confirm"
                    data-action="confirm"
                    data-id="${order.id}"
                    ${status !== "pending" ? "disabled" : ""}
                >
                    ✓ Konfime disponiblite
                </button>

                <button
                    class="deliver"
                    data-action="deliver"
                    data-id="${order.id}"
                    ${status !== "confirmed" ? "disabled" : ""}
                >
                    🚚 Mete kòm livre
                </button>

            </div>
        `;

        list.appendChild(card);

        card.querySelectorAll("button").forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => updateStatus(
                        button.dataset.id,
                        button.dataset.action
                    )
                );

            }
        );
    }

    async function updateStatus(id, action) {

        let update = null;

        if (action === "confirm") {

            update = {
                status: "confirmed"
            };

        }

        if (action === "deliver") {

            update = {
                status: "shipped",
                delivered_at:
                    new Date().toISOString()
            };

        }

        if (!update) return;

        const { error } =
            await supabase
                .from("orders")
                .update(update)
                .eq("id", id);

        if (error) {

            console.error(
                "MACHEYA ORDER UPDATE:",
                error
            );

            alert(
                "Nou pa t kapab mete ajou kòmand lan."
            );

            return;
        }

        await loadOrders();
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
