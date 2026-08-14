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
            data: {
                session
            }
        } = await supabase.auth.getSession();


        if (!session || !session.user) {

            window.location.href =
                "login.html";

            return;
        }


        const user =
            session.user;


        /* =========================
           CHÈCHE PROFIL LA
        ========================= */

        const {
            data: profile,
            error: profileError
        } = await supabase
            .from("profiles")
            .select("name, role")
            .eq("id", user.id)
            .single();


        if (profileError) {

            throw profileError;
        }


        if (!profile) {

            throw new Error(
                "Profil itilizatè a pa jwenn."
            );
        }


        const name =
            profile.name || "Macheya User";

        const role =
            profile.role;


        /* =========================
           NON ITILIZATÈ
        ========================= */

        welcomeName.textContent =
            `Bonjou, ${name} 👋`;


        /* =========================
           ACHETÈ
        ========================= */

        if (role === "acheteur") {

            userRole.textContent =
                "Acheteur";

            welcomeText.textContent =
                "Dekouvri pwodwi, jere panier ou epi swiv kòmand ou yo.";

            buyerDashboard.style.display =
                "block";

            sellerDashboard.style.display =
                "none";

        }


        /* =========================
           VENDEUR
        ========================= */

        else if (role === "vendeur") {

            userRole.textContent =
                "Vendeur";

            welcomeText.textContent =
                "Jere pwodwi ou yo, kòmand kliyan yo ak aktivite biznis ou.";

            sellerDashboard.style.display =
                "block";

            buyerDashboard.style.display =
                "none";

        }


        /* =========================
           ROLE PA VALAB
        ========================= */

        else {

            throw new Error(
                "Wòl itilizatè a pa rekonèt."
            );

        }


        /* =========================
           DEKONEKTE
        ========================= */

        logoutButton.addEventListener(
            "click",
            async () => {

                logoutButton.disabled =
                    true;

                logoutButton.textContent =
                    "Dekoneksyon...";


                const {
                    error
                } = await supabase.auth.signOut();


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


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        buyerDashboard.style.display =
            "none";

        sellerDashboard.style.display =
            "none";

        dashboardError.style.display =
            "block";


        errorMessage.textContent =
            error.message ||
            "Yon erè rive pandan chajman dashboard la.";

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
