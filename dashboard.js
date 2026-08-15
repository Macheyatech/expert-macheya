// ============================================================
// MACHEYA — DASHBOARD.JS
// VÈSYON KOREKTE
// ============================================================


// ============================================================
// ELEMENTS
// ============================================================

const buyerDashboard =
    document.getElementById("buyerDashboard");

const sellerDashboard =
    document.getElementById("sellerDashboard");

const dashboardError =
    document.getElementById("dashboardError");

const errorMessage =
    document.getElementById("errorMessage");

const welcomeName =
    document.getElementById("welcomeName");

const welcomeText =
    document.getElementById("welcomeText");

const userRole =
    document.getElementById("userRole");

const logoutButton =
    document.getElementById("logoutButton");

const reloadDashboard =
    document.getElementById("reloadDashboard");

const productCount =
    document.getElementById("productCount");

const orderCount =
    document.getElementById("orderCount");

const salesTotal =
    document.getElementById("salesTotal");


// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabase =
    window.supabaseClient;


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
// FORMAT MONEY
// ============================================================

function formatHTG(amount) {

    return Number(amount || 0)
        .toLocaleString("en-US") + " HTG";
}


// ============================================================
// SHOW ERROR
// ============================================================

function showError(message) {

    if (buyerDashboard) {
        buyerDashboard.style.display = "none";
    }

    if (sellerDashboard) {
        sellerDashboard.style.display = "none";
    }

    if (dashboardError) {
        dashboardError.style.display = "block";
    }

    if (errorMessage) {
        errorMessage.textContent = message;
    }
}


// ============================================================
// HIDE ERROR
// ============================================================

function hideError() {

    if (dashboardError) {
        dashboardError.style.display = "none";
    }
}


// ============================================================
// HIDE DASHBOARDS
// ============================================================

function hideDashboards() {

    if (buyerDashboard) {
        buyerDashboard.style.display = "none";
    }

    if (sellerDashboard) {
        sellerDashboard.style.display = "none";
    }
}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        hideError();
        hideDashboards();


        // ====================================================
        // VERIFY SUPABASE
        // ====================================================

        if (!supabase) {

            showError(
                "Koneksyon Macheya ak Supabase pa disponib."
            );

            return;
        }


        // ====================================================
        // GET CURRENT USER
        // ====================================================

        const {
            data,
            error: authError
        } =
            await supabase.auth.getUser();


        if (authError) {

            console.error(
                "Auth error:",
                authError
            );

            showError(
                "Nou pa kapab verifye kont ou."
            );

            return;
        }


        const user =
            data?.user;


        // ====================================================
        // NO USER
        // ====================================================

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        console.log(
            "Macheya user:",
            user.id
        );


        // ====================================================
        // GET PROFILE
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
                "Profile error:",
                profileError
            );

            showError(
                "Nou pa kapab chaje pwofil kont ou."
            );

            return;
        }


        // ====================================================
        // PROFILE NOT FOUND
        // ====================================================

        if (!profile) {

            console.error(
                "Pa gen profile pou user:",
                user.id
            );

            showError(
                "Nou jwenn kont lan, men pwofil li poko egziste."
            );

            return;
        }


        console.log(
            "Macheya profile:",
            profile
        );


        // ====================================================
        // USER NAME
        // ====================================================

        const name =
            profile.nom_complet ||
            profile.full_name ||
            profile.name ||
            profile.nom ||
            user.user_metadata?.nom_complet ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Itilizatè";


        welcomeName.textContent =
            `Bonjou, ${name} 👋`;


        // ====================================================
        // ROLE
        // ====================================================

        const role =
            normalizeText(
                profile.role
            );


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


        console.log(
            "Macheya isSeller:",
            isSeller
        );


        console.log(
            "Macheya isBuyer:",
            isBuyer
        );


        // ====================================================
        // SELLER
        // ====================================================

        if (isSeller) {

            userRole.textContent =
                "Vandè";


            welcomeText.textContent =
                "Men espas kote ou ka jere biznis ou.";


            sellerDashboard.style.display =
                "block";


            await loadSellerStats(
                user.id
            );


            return;
        }


        // ====================================================
        // BUYER
        // ====================================================

        if (isBuyer) {

            userRole.textContent =
                "Achtè";


            welcomeText.textContent =
                "Dekouvri pwodwi epi swiv kòmand ou yo.";


            buyerDashboard.style.display =
                "block";


            return;
        }


        // ====================================================
        // UNKNOWN ROLE
        // ====================================================

        console.error(
            "Role pa rekonèt:",
            profile
        );


        showError(
            "Kont ou konekte, men Macheya pa konnen si se yon kont achtè oswa vandè."
        );

    }

    catch (error) {

        console.error(
            "MACHEYA DASHBOARD ERROR:",
            error
        );


        showError(
            "Yon pwoblèm rive pandan chajman dashboard la."
        );
    }
}


// ============================================================
// SELLER STATISTICS
// ============================================================

async function loadSellerStats(userId) {

    // ========================================================
    // PRODUCT COUNT
    // ========================================================

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
                "Product count error:",
                error
            );

            productCount.textContent =
                "0";

        } else {

            productCount.textContent =
                count ?? 0;
        }

    }

    catch (error) {

        console.error(
            "Product statistics error:",
            error
        );

        productCount.textContent =
            "0";
    }


    // ========================================================
    // ORDERS
    // ========================================================

    try {

        const {
            data: orders,
            error
        } =
            await supabase
                .from("orders")
                .select(
                    "id, amount"
                )
                .eq(
                    "seller_id",
                    userId
                );


        // Orders table poko kreye
        if (error) {

            console.log(
                "Orders poko disponib."
            );


            orderCount.textContent =
                "0";


            salesTotal.textContent =
                "0 HTG";


            return;
        }


        // ====================================================
        // ORDER COUNT
        // ====================================================

        orderCount.textContent =
            orders?.length ?? 0;


        // ====================================================
        // SALES TOTAL
        // ====================================================

        const total =
            (orders || []).reduce(
                (
                    sum,
                    order
                ) => {

                    return sum +
                        Number(
                            order.amount || 0
                        );
                },
                0
            );


        salesTotal.textContent =
            formatHTG(total);

    }

    catch (error) {

        console.log(
            "Orders poko disponib:",
            error
        );


        orderCount.textContent =
            "0";


        salesTotal.textContent =
            "0 HTG";
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

                const {
                    error
                } =
                    await supabase.auth.signOut();


                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    return;
                }


                window.location.href =
                    "login.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }
        }
    );
}


// ============================================================
// RELOAD BUTTON
// ============================================================

if (reloadDashboard) {

    reloadDashboard.addEventListener(
        "click",
        () => {

            window.location.reload();

        }
    );
}


// ============================================================
// START
// ============================================================

// IMPORTANT:
// Tout element yo deja defini AVAN loadDashboard() lan.

loadDashboard();
