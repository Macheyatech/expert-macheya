/* ============================================================
   MACHEYA — BUYER JS
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       SUPABASE
    ======================================================== */

    const db = window.supabaseClient;

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
       GET USER NAME
    ======================================================== */

    function getUserName(profile, user) {

        return (
            profile?.nom_complet ||
            profile?.full_name ||
            profile?.name ||
            profile?.nom ||
            profile?.username ||
            user?.user_metadata?.nom_complet ||
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.user_metadata?.username ||
            user?.email?.split("@")[0] ||
            "Itilizatè"
        );
    }


    /* ========================================================
       SHOW BUYER CONTENT
    ======================================================== */

    function showBuyerContent() {

        if (loadingSection) {
            loadingSection.hidden = true;
        }

        if (buyerContent) {
            buyerContent.hidden = false;
        }
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


        if (!db) {

            console.error(
                "Macheya: Supabase pa konekte."
            );

            showError(
                "Supabase pa konekte. Tanpri verifye configuration la."
            );

            return;
        }


        try {

            /* ------------------------------------------------
               AUTH SESSION
            ------------------------------------------------ */

            const {
                data: sessionData,
                error: sessionError
            } =
                await db.auth.getSession();


            if (sessionError) {
                throw sessionError;
            }


            const user =
                sessionData?.session?.user;


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
               NAME FROM AUTH FIRST
            ------------------------------------------------ */

            const authName =
                getUserName(null, user);


            if (userName) {

                userName.textContent =
                    authName;
            }


            if (roleBadge) {

                roleBadge.textContent =
                    "Achtè";
            }


            if (welcomeMessage) {

                welcomeMessage.textContent =
                    "Dekouvri pwodwi, jere acha ou epi swiv kòmand ou yo.";
            }


            /* ------------------------------------------------
               SHOW DASHBOARD
               
               Nou montre dashboard la an premye.
               Pwofil la pap kapab bloke paj la.
            ------------------------------------------------ */

            showBuyerContent();


            /* ------------------------------------------------
               LOAD PROFILE
            ------------------------------------------------ */

            try {

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

                    /*
                     * Pa bloke Espas Achtè a.
                     * Itilizatè a deja konekte.
                     */

                } else if (profile) {

                    console.log(
                        "Macheya Buyer Profile:",
                        profile
                    );


                    /* ----------------------------------------
                       NAME
                    ---------------------------------------- */

                    const name =
                        getUserName(
                            profile,
                            user
                        );


                    if (userName) {

                        userName.textContent =
                            name;
                    }


                    /* ----------------------------------------
                       ROLE
                    ---------------------------------------- */

                    const role =
                        normalize(profile.role);


                    const isBuyer =
                        profile.est_acheteur === true ||
                        profile.is_buyer === true ||
                        profile.acheteur === true ||
                        role === "acheteur" ||
                        role === "achte" ||
                        role === "buyer";


                    console.log(
                        "Macheya Buyer Role:",
                        {
                            role,
                            isBuyer
                        }
                    );


                    if (roleBadge) {

                        roleBadge.textContent =
                            "Achtè";
                    }
                }


            } catch (profileError) {

                console.error(
                    "Macheya Profile Loading Error:",
                    profileError
                );

                /*
                 * Pwofil la pa dwe anpeche dashboard
                 * achtè a parèt.
                 */

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
