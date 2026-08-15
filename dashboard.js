// ============================================================
// MACHEYA — DASHBOARD.JS
// ============================================================


// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabase =
    window.supabaseClient;


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
// CHECK SUPABASE
// ============================================================

if (!supabase) {

    console.error(
        "Macheya: window.supabaseClient pa disponib."
    );

    showError(
        "Koneksyon Macheya ak Supabase pa disponib."
    );

} else {

    console.log(
        "Macheya: Dashboard jwenn Supabase client."
    );

    loadDashboard();
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
// NORMALIZE ROLE
// ============================================================

function normalizeRole(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


// ============================================================
// FORMAT MONEY
// ============================================================

function formatHTG(amount) {

    return Number(amount || 0)
        .toLocaleString("en-US") + " HTG";
}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        hideError();


        // ====================================================
        // GET USER
        // ====================================================

        const {
            data,
            error
        } =
            await supabase.auth.getUser();


        if (error) {
            throw error;
        }


        const user =
            data?.user;


        console.log(
            "Macheya user:",
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
        // GET PROFILE
        // ====================================================

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

            throw profileError;
        }


        console.log(
            "Macheya profile:",
            profile
        );


        // ====================================================
        // PROFILE NOT FOUND
        // ====================================================

        if (!profile) {

            showError(
                "Kont ou konekte, men pwofil ou poko egziste nan Macheya."
            );

            return;
        }


        // ====================================================
        // NAME
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
            normalizeRole(
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
            role,
            "Seller:",
            isSeller,
            "Buyer:",
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


            buyerDashboard.style.display =
                "none";


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


            sellerDashboard.style.display =
                "none";


            return;
        }


        // ====================================================
        // UNKNOWN ROLE
        // ====================================================

        showError(
            "Kont ou konekte, men Macheya pa jwenn si se vandè oswa achtè ou ye."
        );

    }

    catch (error) {

        console.error(
            "MACHEYA DASHBOARD ERROR:",
            error
        );


        showError(
            "Nou pa kapab chaje enfòmasyon kont ou."
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


        if (productCount) {
            productCount.textContent =
                "0";
        }

    } else {

        if (productCount) {

            productCount.textContent =
                count ?? 0;
        }
    }


    // ========================================================
    // ORDERS
    // ========================================================

    const {
        data: orders,
        error: ordersError
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


    // ========================================================
    // ORDERS TABLE NOT READY
    // ========================================================

    if (ordersError) {

        console.log(
            "Macheya: orders table poko pare."
        );


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


    // ========================================================
    // ORDER COUNT
    // ========================================================

    if (orderCount) {

        orderCount.textContent =
            orders?.length ?? 0;
    }


    // ========================================================
    // SALES
    // ========================================================

    const totalSales =
        (orders || []).reduce(
            (total, order) => {

                return total +
                    Number(
                        order.amount || 0
                    );
            },
            0
        );


    if (salesTotal) {

        salesTotal.textContent =
            formatHTG(
                totalSales
            );
    }
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

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
    );
}


// ============================================================
// RELOAD
// ============================================================

if (reloadDashboard) {

    reloadDashboard.addEventListener(
        "click",
        () => {

            window.location.reload();
        }
    );
            }
