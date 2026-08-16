// ============================================================
// MACHEYA — DASHBOARD.JS
// ============================================================

(function () {

    "use strict";

    console.log("MACHEYA: dashboard.js ap demare...");


    // ========================================================
    // ELEMENTS
    // ========================================================

    const loading =
        document.getElementById("loadingSection");

    const buyer =
        document.getElementById("buyerSpace");

    const seller =
        document.getElementById("sellerSpace");

    const errorBox =
        document.getElementById("errorSection");

    const errorMessage =
        document.getElementById("errorMessage");

    const retry =
        document.getElementById("retryButton");

    const userName =
        document.getElementById("userName");

    const welcomeMessage =
        document.getElementById("welcomeMessage");

    const roleBadge =
        document.getElementById("roleBadge");

    const logoutButton =
        document.getElementById("logoutButton");

    const productCount =
        document.getElementById("productCount");

    const orderCount =
        document.getElementById("orderCount");

    const salesTotal =
        document.getElementById("salesTotal");


    // ========================================================
    // HELPERS
    // ========================================================

    function hide(element) {

        if (element) {
            element.hidden = true;
        }
    }


    function show(element) {

        if (element) {
            element.hidden = false;
        }
    }


    function normalize(value) {

        return String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }


    function showError(message) {

        hide(loading);
        hide(buyer);
        hide(seller);

        show(errorBox);

        if (errorMessage) {
            errorMessage.textContent = message;
        }

        console.error(
            "MACHEYA ERROR:",
            message
        );
    }


    // ========================================================
    // START
    // ========================================================

    async function start() {

        show(loading);

        hide(buyer);
        hide(seller);
        hide(errorBox);


        // ====================================================
        // SUPABASE CLIENT
        // ====================================================

        let client =
            window.supabaseClient;


        /*
         * Si config.supabase.js pa kreye client la,
         * dashboard la eseye kreye l dirèkteman.
         */

        if (!client) {

            console.warn(
                "MACHEYA: supabaseClient pa jwenn. Nou pral kreye li."
            );


            if (!window.supabase) {

                showError(
                    "Bibliyotèk Supabase la pa chaje. Verifye koneksyon entènèt la oswa lyen Supabase CDN lan."
                );

                return;
            }


            const url =
                "https://iscktsymqntjgqaxcitv.supabase.co";

            const key =
                "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


            client =
                window.supabase.createClient(
                    url,
                    key
                );


            window.supabaseClient =
                client;
        }


        console.log(
            "MACHEYA: Supabase client pare."
        );


        // ====================================================
        // USER
        // ====================================================

        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (error) {

            console.error(
                "AUTH ERROR:",
                error
            );

            showError(
                "Nou pa kapab verifye sesyon kont ou."
            );

            return;
        }


        const user =
            data?.user;


        console.log(
            "MACHEYA USER:",
            user
        );


        // ====================================================
        // NO USER
        // ====================================================

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        // ====================================================
        // PROFILE
        // ====================================================

        const {
            data: profile,
            error: profileError
        } =
            await client
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();


        console.log(
            "MACHEYA PROFILE:",
            profile
        );


        if (profileError) {

            console.error(
                "PROFILE ERROR:",
                profileError
            );

            showError(
                "Nou pa kapab li pwofil kont ou. Verifye tab profiles la nan Supabase."
            );

            return;
        }


        // ====================================================
        // NAME
        // ====================================================

        const name =
            profile?.nom_complet ||
            profile?.full_name ||
            profile?.name ||
            profile?.nom ||
            user.user_metadata?.nom_complet ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Itilizatè";


        if (userName) {

            userName.textContent =
                `Bonjou, ${name} 👋`;
        }


        // ====================================================
        // ROLE
        // ====================================================

        let role =
            normalize(
                profile?.role
            );


        /*
         * Si role pa nan profiles,
         * n ap chèche l nan metadata itilizatè a tou.
         */

        if (!role) {

            role =
                normalize(
                    user.user_metadata?.role
                );
        }


        console.log(
            "MACHEYA ROLE:",
            role
        );


        // ====================================================
        // SELLER
        // ====================================================

        const isSeller =
            role === "vendeur" ||
            role === "vande" ||
            role === "seller" ||
            profile?.est_vendeur === true ||
            profile?.is_seller === true ||
            profile?.vendeur === true;


        // ====================================================
        // BUYER
        // ====================================================

        const isBuyer =
            role === "acheteur" ||
            role === "achte" ||
            role === "buyer" ||
            profile?.est_acheteur === true ||
            profile?.is_buyer === true ||
            profile?.acheteur === true;


        // ====================================================
        // SELLER DASHBOARD
        // ====================================================

        if (isSeller) {

            if (roleBadge) {
                roleBadge.textContent =
                    "Vandè";
            }


            if (welcomeMessage) {

                welcomeMessage.textContent =
                    "Men espas kote ou ka jere biznis ou.";
            }


            hide(loading);
            hide(buyer);
            show(seller);


            await loadSellerData(
                client,
                user.id
            );


            return;
        }


        // ====================================================
        // BUYER DASHBOARD
        // ====================================================

        if (isBuyer) {

            if (roleBadge) {
                roleBadge.textContent =
                    "Achtè";
            }


            if (welcomeMessage) {

                welcomeMessage.textContent =
                    "Dekouvri pwodwi epi swiv kòmand ou yo.";
            }


            hide(loading);
            hide(seller);
            show(buyer);


            return;
        }


        // ====================================================
        // ROLE NOT FOUND
        // ====================================================

        showError(
            "Kont ou konekte, men Macheya pa jwenn si ou se Achtè oswa Vandè."
        );

    }


    // ========================================================
    // SELLER DATA
    // ========================================================

    async function loadSellerData(
        client,
        userId
    ) {

        if (orderCount) {
            orderCount.textContent =
                "0";
        }


        if (salesTotal) {
            salesTotal.textContent =
                "0 HTG";
        }


        if (!productCount) {
            return;
        }


        productCount.textContent =
            "...";


        const {
            count,
            error
        } =
            await client
                .from("products")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "seller_id",
                    userId
                );


        if (error) {

            console.error(
                "PRODUCT ERROR:",
                error
            );


            productCount.textContent =
                "0";

            return;
        }


        productCount.textContent =
            count ?? 0;
    }


    // ========================================================
    // LOGOUT
    // ========================================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function () {

                logoutButton.disabled =
                    true;

                logoutButton.textContent =
                    "Dekonekte...";


                const client =
                    window.supabaseClient;


                if (!client) {

                    window.location.href =
                        "login.html";

                    return;
                }


                const {
                    error
                } =
                    await client.auth.signOut();


                if (error) {

                    console.error(
                        "LOGOUT ERROR:",
                        error
                    );

                    logoutButton.disabled =
                        false;

                    logoutButton.textContent =
                        "Dekonekte";

                    return;
                }


                window.location.href =
                    "login.html";
            }
        );
    }


    // ========================================================
    // RETRY
    // ========================================================

    if (retry) {

        retry.addEventListener(
            "click",
            function () {

                start();

            }
        );
    }


    // ========================================================
    // RUN
    // ========================================================

    start();

})();
