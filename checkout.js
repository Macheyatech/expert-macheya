(function () {
    "use strict";

    const supabase = window.supabaseClient;
    const id = new URLSearchParams(location.search).get("id");

    const form = document.getElementById("checkout-form");
    const name = document.getElementById("checkout-name");
    const phone = document.getElementById("checkout-phone");
    const address = document.getElementById("checkout-address");
    const note = document.getElementById("checkout-note");
    const quantity = document.getElementById("checkout-quantity");
    const minus = document.getElementById("checkout-quantity-minus");
    const plus = document.getElementById("checkout-quantity-plus");
    const submit = document.getElementById("checkout-submit");
    const message = document.getElementById("checkout-message");

    const productName = document.getElementById("checkout-product-name");
    const productDescription = document.getElementById("checkout-product-description");
    const productPrice = document.getElementById("checkout-product-price");
    const productImage = document.getElementById("checkout-product-image");
    const summaryProduct = document.getElementById("checkout-summary-product");
    const summaryQuantity = document.getElementById("checkout-summary-quantity");
    const total = document.getElementById("checkout-total");

    let product = null;

    function msg(text) {
        message.textContent = text;
    }

    function money(value) {
        return new Intl.NumberFormat("fr-FR").format(Number(value || 0)) + " HTG";
    }

    function updateTotal() {
        const q = Number(quantity.value || 1);
        summaryQuantity.textContent = q;
        total.textContent = money(Number(product?.price || 0) * q);
    }

    async function start() {
        if (!supabase || !id) {
            msg("Macheya pa kapab prepare kòmand lan.");
            return;
        }

        const { data: auth } = await supabase.auth.getUser();

        if (!auth?.user) {
            alert("Tanpri konekte ak kont achtè ou anvan ou fè yon kòmand.");
            location.href = "login.html";
            return;
        }

        const { data, error } = await supabase
            .from("products")
            .select("id,name,description,price,stock,category,seller_id,image_url,is_active")
            .eq("id", id)
            .eq("is_active", true)
            .single();

        if (error || !data) {
            msg("Pwodwi sa a pa disponib ankò.");
            return;
        }

        product = data;

        productName.textContent = data.name;
        productDescription.textContent = data.description || "";
        productPrice.textContent = money(data.price);
        summaryProduct.textContent = data.name;

        if (data.image_url) {
            productImage.style.backgroundImage = `url("${data.image_url}")`;
            productImage.textContent = "";
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("name,phone,role")
            .eq("id", auth.user.id)
            .maybeSingle();

        if (profile) {
            name.value = profile.name || "";
            phone.value = profile.phone || "";
        }

        updateTotal();
    }

    minus.addEventListener("click", function () {
        const value = Number(quantity.value);
        if (value > 1) {
            quantity.value = value - 1;
            updateTotal();
        }
    });

    plus.addEventListener("click", function () {
        const value = Number(quantity.value);
        const stock = Number(product?.stock || 0);

        if (stock > 0 && value < stock) {
            quantity.value = value + 1;
            updateTotal();
        }
    });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!product) return;

        if (!name.value.trim() || !phone.value.trim() || !address.value.trim()) {
            msg("Tanpri ranpli non, telefòn ak adrès livrezon an.");
            return;
        }

        const { data: auth } = await supabase.auth.getUser();

        if (!auth?.user) {
            location.href = "login.html";
            return;
        }

        submit.disabled = true;
        submit.textContent = "Kreyasyon kòmand...";
        msg("");

        try {
            const q = Number(quantity.value);
            const stock = Number(product.stock || 0);

            if (stock > 0 && q > stock) {
                throw new Error("Kantite ou chwazi a depase stock vandè a.");
            }

            const { error } = await supabase
                .from("orders")
                .insert({
                    buyer_id: auth.user.id,
                    seller_id: product.seller_id,
                    product_id: product.id,
                    product_name: product.name,
                    quantity: q,
                    price: Number(product.price),
                    buyer_name: name.value.trim(),
                    buyer_phone: phone.value.trim(),
                    delivery_address: address.value.trim(),
                    delivery_note: note.value.trim() || null
                });

            if (error) throw error;

            alert("Kòmand ou kreye avèk siksè!");
            location.href = "buyer.html";

        } catch (error) {
            console.error("MACHEYA CHECKOUT:", error);
            msg(error.message || "Nou pa t kapab kreye kòmand lan.");
            submit.disabled = false;
            submit.textContent = "Konfime kòmand";
        }
    });

    start();
})();
