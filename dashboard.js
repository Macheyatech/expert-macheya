// ============================================================
// MACHEYA — DASHBOARD.JS
// Konpatib ak supabase.config.js ki itilize
// window.supabaseClient
// ============================================================


// ============================================================
// ELEMENTS — TOUJOU ANVAN KÒD KI KÒMANSE DASHBOARD LA
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
// VERIFY CLIENT
// ============================================================

if (!supabase) {

    console.error(
        "Macheya: Supabase client pa disponib."
    );

    showError(
        "Koneksyon Macheya ak Supabase pa disponib."
    );

} else {

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
// FORMAT HTG
// ============================================================

function formatHTG(value) {

    const number =
        Number(value || 0);

    return number.toLocaleString("en-US") + " HTG";
}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        hideError();


        // ====================================================
        // VERIFY USER
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

            throw authError;
        }


        const user =
            data?.user;


        if (!user) {

            console.warn(
                "Macheya: Pa gen itilizatè konekte."
            );

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
                .eq("id", user.id)
                .maybeSingle();


        if (profileError) {

            console.error(
                "Profile error:",
                profileError
            );

            throw profileError;
        }


        if (!profile) {

            showError(
                "Nou pa jwenn pwofil kont sa a nan Macheya."
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


        if (welcomeName) {

            welcomeName.textContent =
                `Bonjou, ${name} 👋`;
        }


        // ====================================================
        // ROLE
        // ====================================================

        const role =
            normalizeRole(profile.role);


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

            if (userRole) {
                userRole.textContent =
                    "Vandè";
            }


            if (welcomeText) {

                welcomeText.textContent =
                    "Men espas kote ou ka jere biznis ou.";
            }


            if (sellerDashboard) {

                sellerDashboard.style.display =
                    "block";
            }


            if (buyerDashboard) {

                buyerDashboard.style.display =
                    "none";
            }


            await loadSellerStats(
                user.id
            );


            return;
        }


        // ====================================================
        // BUYER
        // ====================================================

        if (isBuyer) {

            if (userRole) {
                userRole.textContent =
                    "Achtè";
            }


            if (welcomeText) {

                welcomeText.textContent =
                    "Dekouvri pwodwi epi swiv kòmand ou yo.";
            }


            if (buyerDashboard) {

                buyerDashboard.style.display =
                    "block";
            }


            if (sellerDashboard) {

                sellerDashboard.style.display =
                    "none";
            }


            return;
        }


        // ====================================================
        // ROLE UNKNOWN
        // ====================================================

        console.warn(
            "Macheya: Role pa rekonèt.",
            profile
        );


        showError(
            "Kont lan egziste, men Macheya pa jwenn si se vandè oswa achtè."
        );

    }

    catch (error) {

        console.error(
            "Macheya Dashboard Error:",
            error
        );


        showError(
            "Yon pwoblèm rive pandan chajman dashboard la. Verifye koneksyon Supabase la."
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

    if (productCount) {

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


    // ========================================================
    // ORDERS
    // ========================================================

    if (!orderCount && !salesTotal) {
        return;
    }


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
    // ORDERS TABLE PA EGZISTE ANKÒ
    // ========================================================

    if (ordersError) {

        console.warn(
            "Macheya: orders poko disponib.",
            ordersError.message
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
    // SALES TOTAL
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
            formatHTG(totalSales);
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
