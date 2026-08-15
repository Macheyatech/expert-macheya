// ============================================================
// MACHEYA — DASHBOARD
// ============================================================

import { supabase } from "./supabase.config.js";


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
// ERROR
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

    console.error("Macheya:", message);
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
// ROLE
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

    return Number(value || 0)
        .toLocaleString("en-US") + " HTG";
}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    hideError();

    try {

        // ====================================================
        // USER CONNECTED
        // ====================================================

        const {
            data: {
                user
            },
            error: authError
        } = await supabase.auth.getUser();


        if (authError) {
            throw authError;
        }


        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        console.log(
            "Macheya — User:",
            user.id
        );


        // ====================================================
        // PROFILE
        // ====================================================

        const {
            data: profile,
            error: profileError
        } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();


        if (profileError) {
            throw profileError;
        }


        console.log(
            "Macheya — Profile:",
            profile
        );


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
        // ROLE NOT FOUND
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
            "Yon pwoblèm rive pandan chajman dashboard la."
        );
    }
}


// ============================================================
// SELLER STATISTICS
// ============================================================

async function loadSellerStats(userId) {

    // ========================================================
    // PRODUCTS
    // ========================================================

    const {
        count,
        error: productsError
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


    if (productsError) {

        console.error(
            "Product count error:",
            productsError
        );

        if (productCount) {
            productCount.textContent = "0";
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
    // ORDERS TABLE PA FÈT ANKO
    // ========================================================

    if (ordersError) {

        console.warn(
            "Orders pa disponib ankò:",
            ordersError.message
        );

        if (orderCount) {
            orderCount.textContent = "0";
        }

        if (salesTotal) {
            salesTotal.textContent = "0 HTG";
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
            formatHTG(totalSales);
    }
}


// ============================================================
// LOGOUT
// ============================================================

logoutButton?.addEventListener(
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


// ============================================================
// RELOAD
// ============================================================

reloadDashboard?.addEventListener(
    "click",
    () => {

        window.location.reload();
    }
);


// ============================================================
// START
// ============================================================

loadDashboard();
