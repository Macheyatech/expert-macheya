// ============================================================
// MACHEYA — DASHBOARD
// KONPATIB AK supabase.config.js
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
// HIDE ALL DASHBOARDS
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
// SHOW ERROR
// ============================================================

function showError(message) {

    hideDashboards();

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

function formatHTG(value) {

    const amount =
        Number(value || 0);

    return (
        amount.toLocaleString("en-US") +
        " HTG"
    );
}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    hideError();

    hideDashboards();


    // ========================================================
    // CHECK SUPABASE
    // ========================================================

    if (!supabase) {

        console.error(
            "Macheya: window.supabaseClient pa jwenn."
        );

        showError(
            "Koneksyon Macheya ak Supabase pa disponib."
        );

        return;
    }


    // ========================================================
    // GET CURRENT USER
    // ========================================================

    const {
        data: sessionData,
        error: sessionError
    } = await supabase.auth.getSession();


    if (sessionError) {

        console.error(
            "Session error:",
            sessionError
        );

        showError(
            "Nou pa kapab verifye sesyon kont ou."
        );

        return;
    }


    const user =
        sessionData?.session?.user;


    // ========================================================
    // NO USER
    // ========================================================

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    console.log(
        "Macheya user:",
        user.id
    );


    // ========================================================
    // GET PROFILE
    // ========================================================

    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();


    if (profileError) {

        console.error(
            "Macheya profile error:",
            profileError
        );

        showError(
            "Nou pa kapab jwenn pwofil kont ou."
        );

        return;
    }


    // ========================================================
    // PROFILE DOES NOT EXIST
    // ========================================================

    if (!profile) {

        console.error(
            "Pa gen profile pou user:",
            user.id
        );

        showError(
            "Kont ou konekte, men pwofil Macheya a poko egziste."
        );

        return;
    }


    console.log(
        "Macheya profile:",
        profile
    );


    // ========================================================
    // USER NAME
    // ========================================================

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


    // ========================================================
    // ROLE
    // ========================================================

    const role =
        normalizeRole(profile.role);


    const seller =
        profile.est_vendeur === true ||
        profile.is_seller === true ||
        profile.vendeur === true;


    const buyer =
        profile.est_acheteur === true ||
        profile.is_buyer === true ||
        profile.acheteur === true;


    const isSeller =
        seller ||
        role === "vendeur" ||
        role === "vande" ||
        role === "vander" ||
        role === "seller";


    const isBuyer =
        buyer ||
        role === "acheteur" ||
        role === "achte" ||
        role === "buyer";


    console.log(
        "Macheya role:",
        role,
        "seller:",
        isSeller,
        "buyer:",
        isBuyer
    );


    // ========================================================
    // SELLER
    // ========================================================

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


        await loadSellerStats(
            user.id
        );

        return;
    }


    // ========================================================
    // BUYER
    // ========================================================

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

        return;
    }


    // ========================================================
    // ROLE UNKNOWN
    // ========================================================

    console.error(
        "Macheya: role pa rekonèt.",
        profile
    );


    showError(
        "Kont ou konekte, men kalite kont lan pa defini nan pwofil la."
    );
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
    } = await supabase
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

    if (!orderCount || !salesTotal) {
        return;
    }


    const {
        data: orders,
        error: ordersError
    } = await supabase
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
            "Macheya: orders poko disponib."
        );


        orderCount.textContent =
            "0";


        salesTotal.textContent =
            "0 HTG";


        return;
    }


    // ========================================================
    // ORDER COUNT
    // ========================================================

    orderCount.textContent =
        orders?.length ?? 0;


    // ========================================================
    // SALES
    // ========================================================

    const totalSales =
        (orders || []).reduce(
            (
                total,
                order
            ) => {

                return (
                    total +
                    Number(
                        order.amount || 0
                    )
                );
            },
            0
        );


    salesTotal.textContent =
        formatHTG(totalSales);
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            if (!supabase) {
                return;
            }


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


// ============================================================
// START
// ============================================================
//
// ENPÒTAN:
// Nou rele loadDashboard() sèlman APRÈ tout
// const elements yo fin defini.
// Se la ansyen JS la te gen pwoblèm.
//

loadDashboard();
