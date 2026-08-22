(function () {
    "use strict";

    const supabase = window.supabaseClient;

    const params = new URLSearchParams(location.search);

    const id =
        params.get("id") ||
        params.get("product_id") ||
        params.get("product");

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

    const total =
        document.getElementById("checkout-total");

    let product = null;


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

        const q =
            Number(quantity?.value || 1);

        const price =
            Number(product?.price || 0);

        if (summaryQuantity) {
            summaryQuantity.textContent = q;
        }

        if (total) {
            total.textContent =
                money(price * q);
        }
    }


    async function start() {

        if (!supabase) {
            msg(
                "Macheya pa kapab konekte ak bazdone a."
            );
            return;
        }


        const { data: auth } =
            await supabase.auth.getUser();


        if (!auth?.user) {

            alert(
                "Tanpri konekte ak kont achtè ou anvan ou fè yon kòmand."
            );

            location.href =
                "login.html";

            return;
        }


        /*
         * Nou itilize product_id ki soti
         * nan product-view.js.
         */

        let productId = id;


        /*
         * Si pa gen ID nan URL la,
         * verifye pwodwi ki te sove pou checkout la.
         */

        if (!productId) {

            try {

                const saved =
                    localStorage.getItem(
                        "macheya_checkout_product"
                    );

                if (saved) {

                    const savedProduct =
                        JSON.parse(saved);

                    productId =
                        savedProduct?.id || null;
                }

            } catch (error) {

                console.error(
                    "Macheya checkout localStorage:",
                    error
                );
            }
        }


        if (!productId) {

            msg(
                "Pa gen pwodwi pou achte."
            );

            return;
        }


        console.log(
            "Macheya Checkout Product ID:",
            productId
        );


        const {
            data,
            error
        } = await supabase
            .from("products")
            .select(
                "id,name,description,price,stock,category,seller_id,image_url,is_active"
            )
            .eq("id", productId)
            .eq("is_active", true)
            .maybeSingle();


        if (error) {

            console.error(
                "Macheya Checkout Product Error:",
                error
            );

            msg(
                "Nou pa kapab chaje pwodwi sa a."
            );

            return;
        }


        if (!data) {

            msg(
                "Pwodwi sa a pa disponib ankò."
            );

            return;
        }


        product = data;


        /*
         * PRODUCT INFORMATION
         */

        if (productName) {
            productName.textContent =
                data.name || "Pwodwi san non";
        }


        if (productDescription) {
            productDescription.textContent =
                data.description || "";
        }


        if (productPrice) {
            productPrice.textContent =
                money(data.price);
        }


        if (summaryProduct) {
            summaryProduct.textContent =
                data.name || "Pwodwi";
        }


        /*
         * IMAGE
         */

        if (
            productImage &&
            data.image_url
        ) {

            productImage.style.backgroundImage =
                `url("${data.image_url}")`;

            productImage.style.backgroundSize =
                "cover";

            productImage.style.backgroundPosition =
                "center";

            productImage.style.backgroundRepeat =
                "no-repeat";

            productImage.textContent = "";
        }


        /*
         * BUYER PROFILE
         */

        const {
            data: profile,
            error: profileError
        } = await supabase
            .from("profiles")
            .select("name,full_name,nom_complet,phone")
            .eq("id", auth.user.id)
            .maybeSingle();


        if (profileError) {

            console.error(
                "Macheya Profile Error:",
                profileError
            );
        }


        if (profile) {

            if (name) {

                name.value =
                    profile.name ||
                    profile.full_name ||
                    profile.nom_complet ||
                    "";
            }


            if (phone) {

                phone.value =
                    profile.phone || "";
            }
        }


        updateTotal();
    }


    /*
     * QUANTITY - MINUS
     */

    if (minus) {

        minus.addEventListener(
            "click",
            function () {

                const value =
                    Number(quantity?.value || 1);

                if (value > 1) {

                    quantity.value =
                        value - 1;

                    updateTotal();
                }
            }
        );
    }


    /*
     * QUANTITY - PLUS
     */

    if (plus) {

        plus.addEventListener(
            "click",
            function () {

                const value =
                    Number(quantity?.value || 1);

                const stock =
                    Number(product?.stock || 0);


                if (stock > 0) {

                    if (value < stock) {

                        quantity.value =
                            value + 1;

                        updateTotal();
                    }

                } else {

                    quantity.value =
                        value + 1;

                    updateTotal();
                }
            }
        );
    }


    /*
     * CHECKOUT
     */

    if (form) {

        form.addEventListener(
            "submit",
            async function (e) {

                e.preventDefault();


                if (!product) {

                    msg(
                        "Pwodwi a poko chaje."
                    );

                    return;
                }


                if (
                    !name?.value.trim() ||
                    !phone?.value.trim() ||
                    !address?.value.trim()
                ) {

                    msg(
                        "Tanpri ranpli non, telefòn ak adrès livrezon an."
                    );

                    return;
                }


                const {
                    data: auth
                } = await supabase.auth.getUser();


                if (!auth?.user) {

                    location.href =
                        "login.html";

                    return;
                }


                if (submit) {

                    submit.disabled =
                        true;

                    submit.textContent =
                        "Kreyasyon kòmand...";
                }

                msg("");


                try {

                    const q =
                        Number(
                            quantity?.value || 1
                        );

                    const unitPrice =
                        Number(
                            product.price || 0
                        );

                    const stock =
                        Number(
                            product.stock || 0
                        );

                    const orderTotal =
                        unitPrice * q;


                    if (
                        stock > 0 &&
                        q > stock
                    ) {

                        throw new Error(
                            "Kantite ou chwazi a depase stock vandè a."
                        );
                    }


                    const {
                        error
                    } = await supabase
                        .from("orders")
                        .insert({

                            buyer_id:
                                auth.user.id,

                            seller_id:
                                product.seller_id,

                            product_id:
                                product.id,

                            product_name:
                                product.name,

                            quantity:
                                q,

                            total:
                                orderTotal,

                            buyer_name:
                                name.value.trim(),

                            buyer_phone:
                                phone.value.trim(),

                            delivery_address:
                                address.value.trim(),

                            delivery_note:
                                note?.value.trim() ||
                                null
                        });


                    if (error) {
                        throw error;
                    }


                    /*
                     * Netwaye pwodwi checkout la
                     * apre kòmand lan fin kreye.
                     */

                    localStorage.removeItem(
                        "macheya_checkout_product"
                    );


                    alert(
                        "Kòmand ou kreye avèk siksè!"
                    );


                    location.href =
    "dashboard.html";


                } catch (error) {

                    console.error(
                        "MACHEYA CHECKOUT:",
                        error
                    );


                    msg(
                        error.message ||
                        "Nou pa t kapab kreye kòmand lan."
                    );


                    if (submit) {

                        submit.disabled =
                            false;

                        submit.textContent =
                            "Konfime kòmand";
                    }
                }
            }
        );
    }


    /*
     * START
     */

    start();

})();
