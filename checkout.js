(function () {
    "use strict";

    const supabase = window.supabaseClient;
    const params = new URLSearchParams(location.search);

    const productId =
        params.get("id") ||
        params.get("product_id") ||
        params.get("product");

    const cartAll = params.get("cart") === "all";

    const form = document.getElementById("checkout-form");
    const name = document.getElementById("checkout-name");
    const phone = document.getElementById("checkout-phone");
    const address = document.getElementById("checkout-address");
    const note = document.getElementById("checkout-note");

    const quantity =
        document.getElementById("checkout-quantity");

    const minus =
        document.getElementById("checkout-quantity-minus");

    const plus =
        document.getElementById("checkout-quantity-plus");

    const submit =
        document.getElementById("checkout-submit");

    const message =
        document.getElementById("checkout-message");

    const productName =
        document.getElementById("checkout-product-name");

    const productDescription =
        document.getElementById("checkout-product-description");

    const productPrice =
        document.getElementById("checkout-product-price");

    const productImage =
        document.getElementById("checkout-product-image");

    const summaryProduct =
        document.getElementById("checkout-summary-product");

    const summaryQuantity =
        document.getElementById("checkout-summary-quantity");

    // ✅ NOUVO eleman yo
    const subtotalEl =
        document.getElementById("checkout-subtotal");

    const feeEl =
        document.getElementById("checkout-fee");

    const total =
        document.getElementById("checkout-total");

    let product = null;
    let cartProducts = [];
    let feePercent = 0;


    function msg(text) {
        if (message) {
            message.textContent = text;
        }
    }


    function money(value) {
        return new Intl.NumberFormat("fr-FR")
            .format(Number(value || 0)) + " HTG";
    }


    function updateTotal() {
        if (cartAll && cartProducts.length > 0) {
            // Plizyè pwodwi
            let subtotal = 0;
            let totalQty = 0;

            cartProducts.forEach(function (item) {
                const qty = Number(item.quantity || 1);
                const price = Number(item.price || 0);
                subtotal += price * qty;
                totalQty += qty;
            });

            const fee = Math.round(subtotal * feePercent / 100 * 100) / 100;
            const grandTotal = subtotal + fee;

            if (summaryProduct) {
                summaryProduct.textContent = cartProducts.length + " pwodwi";
            }

            if (summaryQuantity) {
                summaryQuantity.textContent = totalQty;
            }

            // ✅ NOUVO: Mete soutotal ak frè
            if (subtotalEl) {
                subtotalEl.textContent = money(subtotal);
            }

            if (feeEl) {
                feeEl.textContent = money(fee);
            }

            if (total) {
                total.textContent = money(grandTotal);
            }

        } else if (product) {
            // Yon sèl pwodwi
            const q = Number(quantity?.value || 1);
            const price = Number(product.price || 0);
            const subtotal = price * q;
            const fee = Math.round(subtotal * feePercent / 100 * 100) / 100;
            const grandTotal = subtotal + fee;

            if (summaryQuantity) {
                summaryQuantity.textContent = q;
            }

            // ✅ NOUVO: Mete soutotal ak frè
            if (subtotalEl) {
                subtotalEl.textContent = money(subtotal);
            }

            if (feeEl) {
                feeEl.textContent = money(fee);
            }

            if (total) {
                total.textContent = money(grandTotal);
            }
        }
    }


    async function loadFeePercent() {
        try {
            const { data, error } = await supabase.rpc("get_public_settings");

            if (error) {
                console.error("Fee load error:", error);
                feePercent = 0;
                return;
            }

            if (data && data.length > 0) {
                feePercent = Number(data[0].fee_percentage || 0);
            }
        } catch (error) {
            console.error("Fee load exception:", error);
            feePercent = 0;
        }
    }


    async function start() {

        if (!supabase) {
            msg("Macheya pa kapab konekte ak bazdone a.");
            return;
        }

        const { data: auth } =
            await supabase.auth.getUser();

        if (!auth?.user) {
            alert(
                "Tanpri konekte ak kont achtè ou anvan ou fè yon kòmand."
            );

            location.href = "login.html";
            return;
        }

        // Chaje fee percent
        await loadFeePercent();

        if (cartAll) {
            // Plizyè pwodwi depi cart
            try {
                const saved = localStorage.getItem("macheya_checkout_cart");

                if (!saved) {
                    msg("Panier ou vid.");
                    return;
                }

                cartProducts = JSON.parse(saved);

                if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
                    msg("Panier ou vid.");
                    return;
                }

                // Montre premye pwodwi a kòm preview
                product = cartProducts[0];

                if (productName) {
                    productName.textContent = cartProducts.length + " pwodwi nan panier ou";
                }

                if (productDescription) {
                    productDescription.textContent = "W ap achte tout pwodwi ki nan panier ou.";
                }

                if (productPrice) {
                    productPrice.textContent = "Plizyè pri";
                }

                if (summaryProduct) {
                    summaryProduct.textContent = cartProducts.length + " pwodwi";
                }

                // Kache quantity controls pou cart
                if (minus) minus.style.display = "none";
                if (plus) plus.style.display = "none";
                if (quantity) quantity.style.display = "none";

            } catch (error) {
                console.error("Cart load error:", error);
                msg("Erè chajman panier.");
                return;
            }

        } else {
            // Yon sèl pwodwi
            let pid = productId;

            if (!pid) {
                try {
                    const saved =
                        localStorage.getItem("macheya_checkout_product");

                    if (saved) {
                        const savedProduct = JSON.parse(saved);
                        pid = savedProduct?.id || null;
                    }
                } catch (error) {
                    console.error("Checkout localStorage:", error);
                }
            }

            if (!pid) {
                msg("Pa gen pwodwi pou achte.");
                return;
            }

            const { data, error } =
                await supabase
                    .from("products_public")
                    .select("id,name,description,price,stock,category,seller_id,image_url,product_type")
                    .eq("id", pid)
                    .maybeSingle();

            if (error) {
                console.error("Checkout Product Error:", error);
                msg("Nou pa kapab chaje pwodwi sa a.");
                return;
            }

            if (!data) {
                msg("Pwodwi sa a pa disponib ankò.");
                return;
            }

            product = data;

            if (productName) {
                productName.textContent = data.name || "Pwodwi san non";
            }

            if (productDescription) {
                productDescription.textContent = data.description || "";
            }

            if (productPrice) {
                productPrice.textContent = money(data.price);
            }

            if (summaryProduct) {
                summaryProduct.textContent = data.name || "Pwodwi";
            }

            if (productImage && data.image_url) {
                productImage.style.backgroundImage =
                    `url("${data.image_url}")`;
                productImage.style.backgroundSize = "cover";
                productImage.style.backgroundPosition = "center";
                productImage.style.backgroundRepeat = "no-repeat";
                productImage.textContent = "";
            }
        }

        // Chaje profile itilizatè a
        const { data: profile, error: profileError } =
            await supabase
                .from("profiles")
                .select("name,nom_complet,telephone")
                .eq("id", auth.user.id)
                .maybeSingle();

        if (profileError) {
            console.error("Profile Error:", profileError);
        }

        if (profile) {
            if (name) {
                name.value = profile.name || profile.nom_complet || "";
            }

            if (phone) {
                phone.value = profile.telephone || "";
            }
        }

        updateTotal();
    }


    if (minus) {
        minus.addEventListener("click", function () {
            const value = Number(quantity?.value || 1);

            if (value > 1) {
                quantity.value = value - 1;
                updateTotal();
            }
        });
    }


    if (plus) {
        plus.addEventListener("click", function () {
            const value = Number(quantity?.value || 1);
            const stock = Number(product?.stock || 0);
            const productType = product?.product_type || "physical";

            // ✅ Sèlman bloke pou pwodwi fizik
            if (productType === "physical" && stock > 0 && value >= stock) {
                msg("Ou pa ka ajoute plis — stock la fini.");
                return;
            }

            quantity.value = value + 1;
            updateTotal();
        });
    }


    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            if (!product && cartProducts.length === 0) {
                msg("Pwodwi a poko chaje.");
                return;
            }

            if (!name?.value.trim() || !phone?.value.trim() || !address?.value.trim()) {
                msg("Tanpri ranpli non, telefòn ak adrès livrezon an.");
                return;
            }

            const { data: auth } = await supabase.auth.getUser();

            if (!auth?.user) {
                location.href = "login.html";
                return;
            }

            if (submit) {
                submit.disabled = true;
                submit.textContent = "Kreyasyon kòmand...";
            }

            msg("");

            try {
                if (cartAll && cartProducts.length > 0) {
                    // Plizyè pwodwi
                    const orderIds = [];

                    for (let i = 0; i < cartProducts.length; i++) {
                        const item = cartProducts[i];

                        const q = Number(item.quantity || 1);
                        const stock = Number(item.stock || 0);
                        const productType = item.product_type || "physical";

                        // ✅ Sèlman tcheke stock pou pwodwi fizik
                        if (productType === "physical" && stock > 0 && q > stock) {
                            throw new Error(
                                `Kantite pou "${item.name}" depase stock vandè a.`
                            );
                        }

                        // Kreye order
                        const { data: orderId, error: createError } =
                            await supabase.rpc("create_order", {
                                p_product_id: item.id,
                                p_quantity: q,
                                p_buyer_name: name.value.trim(),
                                p_buyer_phone: phone.value.trim(),
                                p_delivery_address: address.value.trim(),
                                p_delivery_note: note?.value.trim() || null
                            });

                        if (createError) {
                            throw new Error(
                                `Erè kreyasyon kòmand pou "${item.name}": ${createError.message}`
                            );
                        }

                        orderIds.push(orderId);
                    }

                    // Peye tout orders yo
                    for (let i = 0; i < orderIds.length; i++) {
                        const { error: payError } =
                            await supabase.rpc("pay_order", {
                                p_order_id: orderIds[i]
                            });

                        if (payError) {
                            throw new Error(
                                `Erè peman pou kòmand ${i + 1}: ${payError.message}`
                            );
                        }
                    }

                } else if (product) {
                    // Yon sèl pwodwi
                    const q = Number(quantity?.value || 1);
                    const stock = Number(product.stock || 0);
                    const productType = product.product_type || "physical";

                    // ✅ Sèlman tcheke stock pou pwodwi fizik
                    if (productType === "physical" && stock > 0 && q > stock) {
                        throw new Error("Kantite ou chwazi a depase stock vandè a.");
                    }

                    // Kreye order
                    const { data: orderId, error: createError } =
                        await supabase.rpc("create_order", {
                            p_product_id: product.id,
                            p_quantity: q,
                            p_buyer_name: name.value.trim(),
                            p_buyer_phone: phone.value.trim(),
                            p_delivery_address: address.value.trim(),
                            p_delivery_note: note?.value.trim() || null
                        });

                    if (createError) {
                        throw new Error("Erè kreyasyon kòmand: " + createError.message);
                    }

                    // Peye order la
                    const { error: payError } =
                        await supabase.rpc("pay_order", {
                            p_order_id: orderId
                        });

                    if (payError) {
                        throw new Error("Erè peman: " + payError.message);
                    }
                }

                // Netwaye localStorage
                localStorage.removeItem("macheya_checkout_product");
                localStorage.removeItem("macheya_checkout_cart");
                localStorage.removeItem("macheya_cart");

                alert("Kòmand ou kreye epi peye avèk siksè!");

                location.href = "buyer-orders.html";

            } catch (error) {
                console.error("MACHEYA CHECKOUT:", error);

                msg(error.message || "Nou pa t kapab kreye kòmand lan.");

                if (submit) {
                    submit.disabled = false;
                    submit.textContent = "Konfime kòmand";
                }
            }
        });
    }


    start();

})();
