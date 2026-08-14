const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


const script = document.createElement("script");

script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


script.onload = async () => {

    const supabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    const welcomeName =
        document.getElementById("welcomeName");

    const welcomeText =
        document.getElementById("welcomeText");

    const userRole =
        document.getElementById("userRole");

    const buyerDashboard =
        document.getElementById("buyerDashboard");

    const sellerDashboard =
        document.getElementById("sellerDashboard");

    const dashboardError =
        document.getElementById("dashboardError");

    const errorMessage =
        document.getElementById("errorMessage");

    const logoutButton =
        document.getElementById("logoutButton");


    try {

        /* =========================
           VERIFYE SESSION
        ========================= */

        const {
            data: sessionData,
            error: sessionError
        } = await supabase.auth.getSession();


        if (sessionError) {
            throw sessionError;
        }


        const session =
            sessionData.session;


        if (!session || !session.user) {

            window.location.href =
                "login.html";

            return;
        }


        const user =
            session.user;


        /* =========================
           CHÈCHE PROFILE LA
        ========================= */

        const {
            data: profiles,
            error: profileError
        } = await supabase
            .from("profiles")
            .select(
                "id, nom_complet, telephone, est_acheteur, est_vendeur, role"
            )
            .eq("id", user.id)
            .limit(1);


        if (profileError) {
            throw profileError;
        }


        /* =========================
           PREPARE DONE PROFILE
        ========================= */

        let profile = null;


        if (
            profiles &&
            profiles.length > 0
        ) {

            profile =
                profiles[0];

        }


        /* =========================
           NON UTILIZATÈ
        ========================= */

        const name =
            profile?.nom_complet ||
            user.user_metadata?.nom_complet ||
            user.user_metadata?.name ||
            "Macheya User";


        /* =========================
           DETÈMINE ROLE
        ========================= */

        let role =
            profile?.role ||
            user.user_metadata?.role ||
            null;


        if (!role) {

            if (
                profile?.est_vendeur === true
            ) {

                role =
                    "vendeur";

            }

            else if (
                profile?.est_acheteur === true
            ) {

                role =
                    "acheteur";

            }

        }


        /* =========================
           SI PROFILE PA GEN ROLE
        ========================= */

        if (!role) {

            throw new Error(
                "Nou jwenn kont lan, men wòl itilizatè a poko defini nan Supabase."
            );

        }


        /* =========================
           AFFICHE NON
        ========================= */

        if (welcomeName) {

            welcomeName.textContent =
                `Bonjou, ${name} 👋`;

        }


        /* =========================
           ACHETÈ
        ========================= */

        if (
            role === "acheteur"
        ) {

            if (userRole) {

                userRole.textContent =
                    "Acheteur";

            }


            if (welcomeText) {

                welcomeText.textContent =
                    "Dekouvri pwodwi, jere panier ou epi swiv kòmand ou yo.";

            }


            if (buyerDashboard) {

                buyerDashboard.style.display =
                    "block";

            }


            if (sellerDashboard) {

                sellerDashboard.style.display =
                    "none";

            }

        }


        /* =========================
           VENDEUR
        ========================= */

        else if (
            role === "vendeur"
        ) {

            if (userRole) {

                userRole.textContent =
                    "Vendeur";

            }


            if (welcomeText) {

                welcomeText.textContent =
                    "Jere pwodwi ou yo, kòmand kliyan yo ak aktivite biznis ou.";

            }


            if (sellerDashboard) {

                sellerDashboard.style.display =
                    "block";

            }


            if (buyerDashboard) {

                buyerDashboard.style.display =
                    "none";

            }

        }


        /* =========================
           ROLE PA VALAB
        ========================= */

        else {

            throw new Error(
                `Wòl "${role}" pa rekonèt.`
            );

        }


        /* =========================
           DEKONEKTE
        ========================= */

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                async () => {

                    logoutButton.disabled =
                        true;

                    logoutButton.textContent =
                        "Dekoneksyon...";


                    const {
                        error
                    } =
                        await supabase.auth.signOut();


                    if (error) {

                        console.error(error);

                        logoutButton.disabled =
                            false;

                        logoutButton.textContent =
                            "Dekonekte";

                        alert(
                            "Nou pa t kapab dekonekte."
                        );

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


    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        if (buyerDashboard) {

            buyerDashboard.style.display =
                "none";

        }


        if (sellerDashboard) {

            sellerDashboard.style.display =
                "none";

        }


        if (dashboardError) {

            dashboardError.style.display =
                "block";

        }


        if (errorMessage) {

            errorMessage.textContent =
                error.message ||
                "Yon erè rive pandan chajman dashboard la.";

        }

    }

};


script.onerror = () => {

    console.error(
        "Supabase library could not load."
    );

    window.location.href =
        "login.html";

};


document.head.appendChild(script);
