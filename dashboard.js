// ============================================================
// MACHEYA — DASHBOARD.JS
// ============================================================

(function () {

    "use strict";

    console.log(
        "MACHEYA: dashboard.js ap demare..."
    );


    // =========================================================
    // ELEMENTS
    // =========================================================

    const loading =
        document.getElementById(
            "loadingSection"
        );

    const buyer =
        document.getElementById(
            "buyerSpace"
        );

    const seller =
        document.getElementById(
            "sellerSpace"
        );

    const errorBox =
        document.getElementById(
            "errorSection"
        );

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );

    const retry =
        document.getElementById(
            "retryButton"
        );

    const userName =
        document.getElementById(
            "userName"
        );

    const welcomeMessage =
        document.getElementById(
            "welcomeMessage"
        );

    const roleBadge =
        document.getElementById(
            "roleBadge"
        );

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    const productCount =
        document.getElementById(
            "productCount"
        );

    const orderCount =
        document.getElementById(
            "orderCount"
        );

    const salesTotal =
        document.getElementById(
            "salesTotal"
        );


    // =========================================================
    // HELPERS
    // =========================================================

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
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );

    }


    function showError(message) {

        hide(loading);
        hide(buyer);
        hide(seller);

        show(errorBox);


        if (errorMessage) {

            errorMessage.textContent =
                message;

        }


        console.error(
            "MACHEYA ERROR:",
            message
        );

    }


    // =========================================================
    // SUPABASE CLIENT
    // =========================================================

    function getSupabaseClient() {

        if (
            window.supabaseClient
        ) {

            return window.supabaseClient;

        }


        if (
            typeof window.supabase ===
            "undefined"
        ) {

            return null;

        }


        const client =
            window.supabase.createClient(

                "https://iscktsymqntjgqaxcitv.supabase.co",

                "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW"

            );


        window.supabaseClient =
            client;


        return client;

    }


    // =========================================================
    // START
    // =========================================================

    async function start() {

        hide(buyer);
        hide(seller);
        hide(errorBox);

        show(loading);


        const client =
            getSupabaseClient();


        if (!client) {

            showError(
                "Supabase pa disponib. Verifye koneksyon an."
            );

            return;

        }


        console.log(
            "MACHEYA: Supabase client pare."
        );


        // =====================================================
        // USER
        // =====================================================

        let user = null;


        try {

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


            user =
                data?.user || null;


        } catch (error) {

            console.error(
                "USER ERROR:",
                error
            );

            showError(
                "Nou pa kapab verifye kont ou."
            );

            return;

        }


        // =====================================================
        // PA GEN USER
        // =====================================================

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "MACHEYA USER:",
            user
        );


        // =====================================================
        // PROFILE
        // =====================================================

        let profile = null;


        try {

            const {
                data,
                error
            } =
                await client
                    .from("profiles")
                    .select("*")
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();


            if (error) {

                console.warn(
                    "PROFILE READ ERROR:",
                    error
                );

            } else {

                profile = data;

            }

        } catch (error) {

            console.warn(
                "PROFILE EXCEPTION:",
                error
            );

        }


        console.log(
            "MACHEYA PROFILE:",
            profile
        );


        // =====================================================
        // NAME
        // =====================================================

        const metadata =
            user.user_metadata || {};


        const name =
            profile?.name ||
            profile?.nom_complet ||
            profile?.full_name ||
            profile?.nom ||
            metadata.name ||
            metadata.nom_complet ||
            metadata.full_name ||
            metadata.nom ||
            (
                user.email
                    ? user.email.split("@")[0]
                    : "Itilizatè"
            );


        if (userName) {

            userName.textContent =
                "Bonjou, " +
                name +
                " 👋";

        }


        // =====================================================
        // ROLE
        // =====================================================

        /*
         * PRIORITE:
         *
         * 1. profiles.role
         * 2. user.user_metadata.role
         *
         * Sa pèmèt yon nouvo achtè antre
         * menm si profiles pa gen liy li ankò.
         */

        let role =
            normalize(
                profile?.role
            );


        if (!role) {

            role =
                normalize(
                    metadata.role
                );

        }


        console.log(
            "MACHEYA ROLE FINAL:",
            role
        );


        // =====================================================
        // DETERMINE TYPE KONT
        // =====================================================

        const isSeller =
            role === "vendeur" ||
            role === "vande" ||
            role === "seller" ||
            role === "vandè";


        const isBuyer =
            role === "acheteur" ||
            role === "achte" ||
            role === "buyer" ||
            role === "achtè";


        // =====================================================
        // SELLER
        // =====================================================

        if (isSeller) {

            console.log(
                "MACHEYA: kont VANDÈ."
            );


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


        // =====================================================
        // BUYER
        // =====================================================

        if (isBuyer) {

            console.log(
                "MACHEYA: kont ACHTÈ."
            );


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


        // =====================================================
        // ROLE PA JWENN
        // =====================================================

        console.error(
            "ROLE PA JWENN:",
            {
                profile:
                    profile,

                metadata:
                    metadata,

                role:
                    role
            }
        );


        showError(
            "Kont ou konekte, men Macheya pa jwenn si ou se Achtè oswa Vandè."
        );

    }


    // =========================================================
    // SELLER DATA
    // =========================================================

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


        try {

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


        } catch (error) {

            console.error(
                "PRODUCT EXCEPTION:",
                error
            );

            productCount.textContent =
                "0";

        }

    }


    // =========================================================
    // LOGOUT
    // =========================================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function () {

                logoutButton.disabled =
                    true;

                logoutButton.textContent =
                    "Dekonekte...";


                const client =
                    getSupabaseClient();


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


                localStorage.removeItem(
                    "macheyaUserName"
                );

                localStorage.removeItem(
                    "macheyaUserRole"
                );

                localStorage.removeItem(
                    "macheyaUserId"
                );


                window.location.href =
                    "login.html";

            }
        );

    }


    // =========================================================
    // RETRY
    // =========================================================

    if (retry) {

        retry.addEventListener(
            "click",
            function () {

                start();

            }
        );

    }


    // =========================================================
    // RUN
    // =========================================================

    start();

})();
