// ============================================================
// MACHEYA — DASHBOARD.JS
// VÈSYON NOUVO
// Travay dirèkteman ak supabase.config.js
// ============================================================


// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabase = window.supabaseClient;


// ============================================================
// ELEMENTS
// ============================================================

const loadingSection =
    document.getElementById("loadingSection");

const buyerSpace =
    document.getElementById("buyerSpace");

const sellerSpace =
    document.getElementById("sellerSpace");

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

const productCount =
    document.getElementById("productCount");

const orderCount =
    document.getElementById("orderCount");

const salesTotal =
    document.getElementById("salesTotal");


// ============================================================
// HIDE ALL SPACES
// ============================================================

function hideAllSpaces() {

    if (buyerSpace) {
        buyerSpace.hidden = true;
    }

    if (sellerSpace) {
        sellerSpace.hidden = true;
    }

    if (errorSection) {
        errorSection.hidden = true;
    }
}


// ============================================================
// SHOW LOADING
// ============================================================

function showLoading() {

    hideAllSpaces();

    if (loadingSection) {
        loadingSection.hidden = false;
    }
}


// ============================================================
// HIDE LOADING
// ============================================================

function hideLoading() {

    if (loadingSection) {
        loadingSection.hidden = true;
    }
}


// ============================================================
// SHOW ERROR
// ============================================================

function showError(message) {

    hideAllSpaces();

    hideLoading();

    if (errorSection) {
        errorSection.hidden = false;
    }

    if (errorMessage) {
        errorMessage.textContent = message;
    }
}


// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
}


// ============================================================
// GET USER ROLE
// ============================================================

function getUserRole(profile) {

    const role =
        normalizeText(profile?.role);


    const seller =
        profile?.est_vendeur === true ||
        profile?.is_seller === true ||
        profile?.vendeur === true;


    const buyer =
        profile?.est_acheteur === true ||
        profile?.is_buyer === true ||
        profile?.acheteur === true;


    // --------------------------------------------------------
    // VENDEUR
    // --------------------------------------------------------

    if (
        seller ||
        role === "vendeur" ||
        role === "vande" ||
        role === "vander" ||
        role === "seller"
    ) {

        return "seller";
    }


    // --------------------------------------------------------
    // ACHETÈ
    // --------------------------------------------------------

    if (
        buyer ||
        role === "acheteur" ||
        role === "achte" ||
        role === "buyer"
    ) {

        return "buyer";
    }


    return null;
}


// ============================================================
// GET USER NAME
// ============================================================

function getUserName(user, profile) {

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


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        showLoading();


        // ====================================================
        // 1. VERIFY SUPABASE
        // ====================================================

        if (!supabase) {

            throw new Error(
                "Supabase client pa disponib."
            );
        }


        // ====================================================
        // 2. GET CURRENT USER
        // ====================================================

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabase.auth.getSession();


        if (sessionError) {

            throw sessionError;
        }


        const session =
            sessionData?.session;


        const user =
            session?.user;


        // ====================================================
        // SI PA GEN SESSION
        // ====================================================

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        // ====================================================
        // 3. GET PROFILE
        // ====================================================

        const {
            data: profile,
            error: profileError
        } =
            await supabase
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (profileError) {

            console.error(
                "Macheya profile error:",
                profileError
            );

            throw new Error(
                "Nou pa kapab jwenn pwofil kont ou."
            );
        }


        // ====================================================
        // 4. CHECK PROFILE
        // ====================================================

        if (!profile) {

            throw new Error(
                "Kont ou konekte, men pwofil li pa egziste nan Macheya."
            );
        }


        // ====================================================
        // 5. USER NAME
        // ====================================================

        const name =
            getUserName(
                user,
                profile
            );


        if (userName) {

            userName.textContent =
                `Bonjou, ${name} 👋`;
        }


        // ====================================================
        // 6. DETERMINE ROLE
        // ====================================================

        const role =
            getUserRole(profile);


        console.log(
            "Macheya dashboard:",
            {
                userId: user.id,
                email: user.email,
                profile: profile,
                role: role
            }
        );


        // ====================================================
        // 7. SELLER
        // ====================================================

        if (role === "seller") {

            if (roleBadge) {

                roleBadge.textContent =
                    "Vandè";
            }


            if (welcomeMessage) {

                welcomeMessage.textContent =
                    "Men espas kote ou ka jere biznis ou.";
            }


            hideLoading();


            if (sellerSpace) {

                sellerSpace.hidden =
                    false;
            }


            // -----------------------------------------------
            // CHARGE PRODUCT COUNT
            // -----------------------------------------------

            await loadSellerProductCount(
                user.id
            );


            // -----------------------------------------------
            // ORDERS / SALES
            // -----------------------------------------------

            /*
             * Nou pa konekte orders kounye a.
             *
             * Paske sistèm kòmand lan poko konstwi.
             *
             * Lè checkout/orders pare,
             * n ap konekte yo isit la.
             */

            if (orderCount) {

                orderCount.textContent =
                    "0";
            }


            if (salesTotal) {

                salesTotal.textContent =
                    "0 HTG";
            }


            return;
        }


        // ====================================================
        // 8. BUYER
        // ====================================================

        if (role === "buyer") {

            if (roleBadge) {

                roleBadge.textContent =
                    "Achtè";
            }


            if (welcomeMessage) {

                welcomeMessage.textContent =
                    "Dekouvri pwodwi epi swiv kòmand ou yo.";
            }


            hideLoading();


            if (buyerSpace) {

                buyerSpace.hidden =
                    false;
            }


            return;
        }


        // ====================================================
        // 9. UNKNOWN ROLE
        // ====================================================

        throw new Error(
            "Nou pa kapab detèmine si kont sa a se yon achtè oswa yon vandè."
        );

    }

    catch (error) {

        console.error(
            "Macheya Dashboard Error:",
            error
        );


        showError(
            error.message ||
            "Yon pwoblèm rive pandan chajman dashboard la."
        );
    }
}


// ============================================================
// SELLER — PRODUCT COUNT
// ============================================================

async function loadSellerProductCount(
    sellerId
) {

    try {

        const {
            count,
            error
        } =
            await supabase
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
                    sellerId
                );


        if (error) {

            console.error(
                "Macheya products count error:",
                error
            );


            if (productCount) {

                productCount.textContent =
                    "0";
            }


            return;
        }


        if (productCount) {

            productCount.textContent =
                count ?? 0;
        }

    }

    catch (error) {

        console.error(
            "Product count error:",
            error
        );


        if (productCount) {

            productCount.textContent =
                "0";
        }
    }
}


// ============================================================
// LOGOUT
// ============================================================

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
                    await supabase.auth.signOut();


                if (error) {

                    throw error;
                }


                window.location.href =
                    "login.html";

            }

            catch (error) {

                console.error(
                    "Macheya logout error:",
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


// ============================================================
// RETRY BUTTON
// ============================================================

if (retryButton) {

    retryButton.addEventListener(
        "click",
        () => {

            loadDashboard();

        }
    );
}


// ============================================================
// START
// ============================================================

loadDashboard();
