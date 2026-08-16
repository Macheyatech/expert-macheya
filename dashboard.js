// ============================================================
// MACHEYA — DASHBOARD
// ============================================================


// ============================================================
// SUPABASE
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
// NORMALIZE
// ============================================================

function normalize(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


// ============================================================
// HIDE CONTENT
// ============================================================

function hideContent() {

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
// ERROR
// ============================================================

function showError(message) {

    if (loadingSection) {
        loadingSection.hidden = true;
    }

    if (buyerSpace) {
        buyerSpace.hidden = true;
    }

    if (sellerSpace) {
        sellerSpace.hidden = true;
    }

    if (errorSection) {
        errorSection.hidden = false;
    }

    if (errorMessage) {
        errorMessage.textContent = message;
    }
}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    // Loading
    if (loadingSection) {
        loadingSection.hidden = false;
    }

    hideContent();


    try {

        // ----------------------------------------------------
        // CHECK SUPABASE
        // ----------------------------------------------------

        if (!supabase) {

            throw new Error(
                "Supabase client pa disponib. Verifye supabase.config.js."
            );
        }


        // ----------------------------------------------------
        // GET USER
        // ----------------------------------------------------

        const {
            data,
            error
        } =
            await supabase.auth.getUser();


        if (error) {
            throw error;
        }


        const user = data?.user;


        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        console.log(
            "Macheya user:",
            user
        );


        // ----------------------------------------------------
        // GET PROFILE
        // ----------------------------------------------------

        const {
            data: profile,
            error: profileError
        } =
            await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();


        if (profileError) {

            console.error(
                "Macheya profile error:",
                profileError
            );

            throw new Error(
                "Nou pa kapab li pwofil kont ou."
            );
        }


        if (!profile) {

            throw new Error(
                "Kont lan konekte, men pwofil li pa egziste nan tab profiles."
            );
        }


        console.log(
            "Macheya profile:",
            profile
        );


        // ----------------------------------------------------
        // NAME
        // ----------------------------------------------------

        const name =
            profile.nom_complet ||
            profile.full_name ||
            profile.name ||
            profile.nom ||
            user.user_metadata?.nom_complet ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Itilizatè";


        if (userName) {

            userName.textContent =
                `Bonjou, ${name} 👋`;
        }


        // ----------------------------------------------------
        // ROLE
        // ----------------------------------------------------

        const role =
            normalize(profile.role);


        const isSeller =
            profile.est_vendeur === true ||
            profile.is_seller === true ||
            profile.vendeur === true ||
            role === "vendeur" ||
            role === "vande" ||
            role === "vander" ||
            role === "seller";


        const isBuyer =
            profile.est_acheteur === true ||
            profile.is_buyer === true ||
            profile.acheteur === true ||
            role === "acheteur" ||
            role === "achte" ||
            role === "buyer";


        console.log(
            "Macheya role:",
            role
        );


        // ----------------------------------------------------
        // SELLER
        // ----------------------------------------------------

        if (isSeller) {

            if (roleBadge) {
                roleBadge.textContent = "Vandè";
            }


            if (welcomeMessage) {

                welcomeMessage.textContent =
                    "Men espas kote ou ka jere biznis ou.";
            }


            if (loadingSection) {
                loadingSection.hidden = true;
            }


            if (sellerSpace) {
                sellerSpace.hidden = false;
            }


            await loadSellerProducts(user.id);

            return;
        }


        // ----------------------------------------------------
        // BUYER
        // ----------------------------------------------------

        if (isBuyer) {

            if (roleBadge) {
                roleBadge.textContent = "Achtè";
            }


            if (welcomeMessage) {

                welcomeMessage.textContent =
                    "Dekouvri pwodwi epi swiv kòmand ou yo.";
            }


            if (loadingSection) {
                loadingSection.hidden = true;
            }


            if (buyerSpace) {
                buyerSpace.hidden = false;
            }


            return;
        }


        // ----------------------------------------------------
        // UNKNOWN ROLE
        // ----------------------------------------------------

        throw new Error(
            "Macheya pa jwenn si kont sa a se vandè oswa achtè."
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
// SELLER PRODUCTS
// ============================================================

async function loadSellerProducts(userId) {

    if (!productCount) {
        return;
    }


    productCount.textContent = "...";


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
                    userId
                );


        if (error) {

            console.error(
                "Macheya products error:",
                error
            );

            productCount.textContent =
                "0";

            return;
        }


        productCount.textContent =
            count ?? 0;

    }

    catch (error) {

        console.error(
            "Macheya product count error:",
            error
        );

        productCount.textContent =
            "0";
    }


    // Orders poko konekte
    if (orderCount) {
        orderCount.textContent = "0";
    }


    if (salesTotal) {
        salesTotal.textContent = "0 HTG";
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

                logoutButton.disabled = true;

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
                    "Logout error:",
                    error
                );


                logoutButton.disabled = false;

                logoutButton.textContent =
                    "Dekonekte";
            }
        }
    );
}


// ============================================================
// RETRY
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
