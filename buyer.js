/* ============================================================
   MACHEYA — BUYER JS
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       SUPABASE
    ======================================================== */

    const db = window.supabaseClient;

    if (!db) {

        console.error(
            "Macheya: Supabase pa konekte."
        );

        showError(
            "Supabase pa konekte. Tanpri verifye configuration la."
        );

        return;
    }


    /* ========================================================
       ELEMENTS
    ======================================================== */

    const loadingSection =
        document.getElementById("loadingSection");

    const buyerContent =
        document.getElementById("buyerContent");

    const errorSection =
        document.getElementById("errorSection");

    const errorMessage =
        document.getElementById("errorMessage");

    const retryButton =
        document.getElementById("retryButton");

    const userName =
        document.getElementById("userName");

    const welcomeMessage =
        document.getElementById("welcomeMessage");

    const roleBadge =
        document.getElementById("roleBadge");

    const logoutButton =
        document.getElementById("logoutButton");


    /* ========================================================
       ERROR
    ======================================================== */

    function showError(message) {

        if (loadingSection) {
            loadingSection.hidden = true;
        }

        if (buyerContent) {
            buyerContent.hidden = true;
        }

        if (errorSection) {
            errorSection.hidden = false;
        }

        if (errorMessage) {
            errorMessage.textContent =
                message;
        }
    }


    /* ========================================================
       HIDE ERROR
    ======================================================== */

    function hideError() {

        if (errorSection) {
            errorSection.hidden = true;
        }
    }


    /* ========================================================
       NORMALIZE
    ======================================================== */

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


    /* ========================================================
       GET NAME
    ======================================================== */

    function getUserName(profile, user) {

        return (
            profile?.nom_complet ||
            profile?.full_name ||
            profile?.name ||
            profile?.nom ||
            user?.user_metadata?.nom_complet ||
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.email?.split("@")[0] ||
            "Itilizatè"
        );
    }


    /* ========================================================
       LOAD BUYER
    ======================================================== */

    async function loadBuyer() {

        hideError();


        if (loadingSection) {
            loadingSection.hidden = false;
        }


        if (buyerContent) {
            buyerContent.hidden = true;
        }


        try {

            /* ------------------------------------------------
               USER
            ------------------------------------------------ */

            const {
                data,
                error
            } =
                await db.auth.getUser();


            if (error) {
                throw error;
            }


            const user =
                data?.user;


            if (!user) {

                window.location.href =
                    "login.html?role=buyer";

                return;
            }


            console.log(
                "Macheya Buyer User:",
                user
            );


            /* ------------------------------------------------
               PROFILE
            ------------------------------------------------ */

            const {
                data: profile,
                error: profileError
            } =
                await db
                    .from("profiles")
                    .select("*")
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();


            if (profileError) {

                console.error(
                    "Macheya Profile Error:",
                    profileError
                );

                throw new Error(
                    "Nou pa kapab li pwofil kont ou."
                );
            }


            if (!profile) {

                throw new Error(
                    "Pwofil kont sa a pa egziste."
                );
            }


            console.log(
                "Macheya Buyer Profile:",
                profile
            );


            /* ------------------------------------------------
               VERIFY ROLE
            ------------------------------------------------ */

            const role =
                normalize(profile.role);


            const isBuyer =
                profile.est_acheteur === true ||
                profile.is_buyer === true ||
                profile.acheteur === true ||
                role === "acheteur" ||
                role === "achte" ||
                role === "buyer";


            if (!isBuyer) {

                throw new Error(
                    "Kont sa a pa yon kont achtè."
                );
            }


            /* ------------------------------------------------
               NAME
            ------------------------------------------------ */

            const name =
                getUserName(
                    profile,
                    user
                );


            if (userName) {

                userName.textContent =
                    name;
            }


            /* ------------------------------------------------
               ROLE
            ------------------------------------------------ */

            if (roleBadge) {

                roleBadge.textContent =
                    "Achtè";
            }


            /* ------------------------------------------------
               WELCOME MESSAGE
            ------------------------------------------------ */

            if (welcomeMessage) {

                welcomeMessage.textContent =
                    "Dekouvri pwodwi, jere acha ou epi swiv kòmand ou yo.";
            }


            /* ------------------------------------------------
               SHOW CONTENT
            ------------------------------------------------ */

            if (loadingSection) {
                loadingSection.hidden = true;
            }


            if (buyerContent) {
                buyerContent.hidden = false;
            }


            console.log(
                "Macheya: Espas achtè chaje avèk siksè."
            );

        }

        catch (error) {

            console.error(
                "Macheya Buyer Error:",
                error
            );


            showError(
                error.message ||
                "Yon pwoblèm rive pandan chajman espas achtè a."
            );
        }
    }


    /* ========================================================
       LOGOUT
    ======================================================== */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    logoutButton.disabled =
                        true;

                    logoutButton.textContent =
                        "Dekonekte...";


                    const {
                        error
                    } =
                        await db.auth.signOut();


                    if (error) {
                        throw error;
                    }


                    window.location.href =
                        "login.html";

                }

                catch (error) {

                    console.error(
                        "Macheya Logout Error:",
                        error
                    );


                    logoutButton.disabled =
                        false;

                    logoutButton.textContent =
                        "Dekonekte";
                }
            }
        );
    }


    /* ========================================================
       RETRY
    ======================================================== */

    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () => {

                loadBuyer();

            }
        );
    }


    /* ========================================================
       START
    ======================================================== */

    loadBuyer();

});
