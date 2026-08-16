// ============================================================
// MACHEYA — DASHBOARD.JS
// ============================================================

(function () {

    "use strict";

    console.log(
        "MACHEYA: dashboard.js ap demare..."
    );


    // ========================================================
    // ELEMENTS
    // ========================================================

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


    // ========================================================
    // SUPABASE CLIENT
    // ========================================================

    function getClient() {

        let client =
            window.supabaseClient;


        if (client) {
            return client;
        }


        if (
            typeof window.supabase ===
            "undefined"
        ) {

            return null;
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


        return client;

    }


    // ========================================================
    // PROFILE
    // ========================================================

    async function getProfile(
        client,
        user
    ) {

        const {
            data: profile,
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
                "MACHEYA: profile pa disponib:",
                error.message
            );

        }


        return profile || null;

    }


    // ========================================================
    // CREATE / SYNC PROFILE
    // ========================================================

    async function syncProfile(
        client,
        user,
        profile,
        name,
        role
    ) {

        if (profile) {
            return profile;
        }


        if (
            !name ||
            !role
        ) {

            return null;
        }


        try {

            const {
                data,
                error
            } =
                await client
                    .from("profiles")
                    .upsert(
                        {
                            id: user.id,

                            name: name,

                            role: role

                        },
                        {
                            onConflict: "id"
                        }
                    )
                    .select()
                    .single();


            if (error) {

                console.warn(
                    "MACHEYA: pa kapab sync profile:",
                    error.message
                );

                return null;
            }


            return data || null;

        } catch (error) {

            console.warn(
                "MACHEYA PROFILE SYNC ERROR:",
                error
            );

            return null;
        }

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
        // CLIENT
        // ====================================================

        const client =
            getClient();


        if (!client) {

            showError(
                "Bibliyotèk Supabase la pa chaje. Verifye koneksyon entènèt la."
            );

            return;
        }


        console.log(
            "MACHEYA: Supabase client pare."
        );


        // ====================================================
        // AUTH USER
        // ====================================================

        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (error) {

            console.error(
                "MACHEYA AUTH ERROR:",
                error
            );


            showError(
                "Nou pa kapab verifye sesyon kont ou."
            );

            return;
        }


        const user =
            data?.user;


        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        console.log(
            "MACHEYA USER:",
            user.id
        );


        // ====================================================
        // PROFILE
        // ====================================================

        let profile =
            await getProfile(
                client,
                user
            );


        console.log(
            "MACHEYA PROFILE:",
            profile
        );


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
            localStorage.getItem(
                "macheyaUserName"
            ) ||
            user.email?.split("@")[0] ||
            "Itilizatè";


        if (userName) {

            userName.textContent =
                `Bonjou, ${name} 👋`;

        }


        // ====================================================
        // ROLE
        //
        // Priority:
        // 1. profiles.role
        // 2. auth metadata role
        // 3. localStorage
        // ====================================================

        let role =
            normalize(
                profile?.role
            );


        if (!role) {

            role =
                normalize(
                    user.user_metadata?.role
                );

        }


        if (!role) {

            role =
                normalize(
                    localStorage.getItem(
                        "macheyaUserRole"
                    )
                );

        }


        console.log(
            "MACHEYA ROLE:",
            role
        );


        // ====================================================
        // SAVE LOCAL INFO
        // ====================================================

        localStorage.setItem(
            "macheyaUserId",
            user.id
        );


        localStorage.setItem(
            "macheyaUserName",
            name
        );


        if (role) {

            localStorage.setItem(
                "macheyaUserRole",
                role
            );

        }


        // ====================================================
        // SYNC PROFILE IF MISSING
        // ====================================================

        if (
            !profile &&
            role
        ) {

            profile =
                await syncProfile(
                    client,
                    user,
                    profile,
                    name,
                    role
                );

        }


        // ====================================================
        // SELLER
        // ====================================================

        const isSeller =
            role === "vendeur" ||
            role === "vande" ||
            role === "seller";


        // ====================================================
        // BUYER
        // ====================================================

        const isBuyer =
            role === "acheteur" ||
            role === "achte" ||
            role === "buyer";


        // ====================================================
        // SELLER SPACE
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
        // BUYER SPACE
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
        // UNKNOWN ROLE
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
                "MACHEYA PRODUCT ERROR:",
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
                    getClient();


                if (!client) {

                    localStorage.removeItem(
                        "macheyaUserId"
                    );

                    localStorage.removeItem(
                        "macheyaUserName"
                    );

                    localStorage.removeItem(
                        "macheyaUserRole"
                    );


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
                        "MACHEYA LOGOUT ERROR:",
                        error
                    );


                    logoutButton.disabled =
                        false;


                    logoutButton.textContent =
                        "Dekonekte";

                    return;
                }


                localStorage.removeItem(
                    "macheyaUserId"
                );


                localStorage.removeItem(
                    "macheyaUserName"
                );


                localStorage.removeItem(
                    "macheyaUserRole"
                );


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
