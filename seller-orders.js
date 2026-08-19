(function () {
    "use strict";

    const supabase = window.supabaseClient;

    const list = document.getElementById("orders-list");
    const message = document.getElementById("orders-message");

    const statusText = {
        pending: "Nouvo",
        confirmed: "Konfime",
        rejected: "Refize",
        delivered: "Resevwa",
        completed: "Fini"
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
            console.error(
                "MACHEYA LOAD ORDERS:",
                error
            );

            message.textContent =
                "Nou pa kapab chaje kòmand yo.";

            return;
        }

        if (!data || !data.length) {
            list.innerHTML = "";

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

        /*
         * Nou sipòte tou de price ak total
         * paske orders genyen toude kolòn.
         */
        let unitPrice =
            Number(order.price || 0);

        let orderTotal =
            Number(order.total || 0);

        if (orderTotal <= 0 && unitPrice > 0) {
            orderTotal =
                unitPrice *
                Number(order.quantity || 1);
        }

        card.innerHTML = `
            <div class="order-top">

                <div class="order-product">
                    ${escapeHTML(
                        order.product_name || "Pwodwi"
                    )}
                </div>

                <span class="order-status">
                    ${
                        statusText[status] ||
                        status
                    }
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
                        ${Number(
                            order.quantity || 1
                        )}
                    </strong>
                </div>


                <div>
                    💰 Pri:
                    <strong>
                        ${money(orderTotal)}
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

                ${
                    status === "pending"
                    ? `
                        <button
                            class="confirm"
                            data-action="confirm"
                            data-id="${order.id}"
                        >
                            ✓ Konfime disponiblite
                        </button>

                        <button
                            class="reject"
                            data-action="reject"
                            data-id="${order.id}"
                        >
                            ✕ Refize
                        </button>
                    `
                    : ""
                }


                ${
                    status === "confirmed"
                    ? `
                        <button
                            class="deliver"
                            data-action="deliver"
                            data-id="${order.id}"
                        >
                            🚚 Mete kòm livre
                        </button>
                    `
                    : ""
                }

            </div>
        `;


        list.appendChild(card);


        card
            .querySelectorAll("button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        updateStatus(
                            button.dataset.id,
                            button.dataset.action
                        );

                    }
                );

            });
    }


    async function updateStatus(id, action) {

        let update = null;


        /*
         * Vandè konfime li gen pwodwi a
         */
        if (action === "confirm") {

            update = {
                status: "confirmed",
                confirmed_at:
                    new Date().toISOString()
            };

        }


        /*
         * Vandè refize kòmand lan
         */
        if (action === "reject") {

            update = {
                status: "rejected"
            };

        }


        /*
         * Vandè mete kòmand lan kòm livre.
         *
         * ATANSYON:
         * Nou itilize "delivered" paske se youn
         * nan status SQL ou a.
         */
        if (action === "deliver") {

            update = {
                status: "delivered"
            };

        }


        if (!update) {
            return;
        }


        const button =
            document.querySelector(
                `[data-id="${id}"][data-action="${action}"]`
            );


        if (button) {
            button.disabled = true;
            button.textContent =
                "M ap mete ajou...";
        }


        const { error } =
            await supabase
                .from("orders")
                .update(update)
                .eq("id", id)
                .eq(
                    "seller_id",
                    (
                        await supabase.auth.getUser()
                    ).data.user.id
                );


        if (error) {

            console.error(
                "MACHEYA ORDER UPDATE:",
                error
            );

            alert(
                "Nou pa t kapab mete ajou kòmand lan.\n\n" +
                error.message
            );

            if (button) {
                button.disabled = false;
            }

            return;
        }


        await loadOrders();
    }


    function escapeHTML(value) {

        return String(value)
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


    loadOrders();

})();
