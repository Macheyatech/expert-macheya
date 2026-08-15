import { supabase } from "./supabase.config.js";


// ========================================
// ELEMENTS
// ========================================

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

const productCount =
    document.getElementById("productCount");


// ========================================
// SHOW ERROR
// ========================================

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


// ========================================
// HIDE ERROR
// ========================================

function hideError() {

    if (dashboardError) {
        dashboardError.style.display = "none";
    }
}


// ========================================
// FORMAT HTG
// ========================================

function formatHTG(amount) {

    const value = Number(amount || 0);

    return value.toLocaleString("en-US") + " HTG";
}


// ========================================
// NORMALIZE ROLE
// ========================================

function normalizeRole(role) {

    return String(role || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


// ========================================
// LOAD DASHBOARD
// ========================================

async function loadDashboard() {

    try {

        hideError();


        // =================================
        // VERIFY USER
        // =================================

        const {
            data: {
                user
            },
            error: userError
        } = await supabase.auth.getUser();


        if (userError) {
            throw userError;
        }


        if (!user) {

            window.location.href = "login.html";

            return;
        }


        // =================================
        // GET PROFILE
        // =================================

        const {
            data: profile,
            error: profileError
        } = await supabase
            .from("profiles")
            .select(`
                id,
                nom_complet,
                est_acheteur,
                est_vendeur,
                role
            `)
            .eq("id", user.id)
            .maybeSingle();


        if (profileError) {
            throw profileError;
        }


        if (!profile) {

            showError(
                "Nou pa jwenn pwofil kont sa a."
            );

            return;
        }


        // =================================
        // USER NAME
        // =================================

        const name =
            profile.nom_complet ||
            user.email?.split("@")[0] ||
            "Itilizatè";


        if (welcomeName) {

            welcomeName.textContent =
                `Bonjou, ${name} 👋`;
        }


        // =================================
        // DETERMINE ROLE
        // =================================

        const normalizedRole =
            normalizeRole(profile.role);


        const isSeller =
            profile.est_vendeur === true ||
            normalizedRole === "vendeur" ||
            normalizedRole === "vander" ||
            normalizedRole === "seller";


        const isBuyer =
            profile.est_acheteur === true ||
            normalizedRole === "acheteur" ||
            normalizedRole === "achte" ||
            normalizedRole === "buyer";


        // =================================
        // SELLER DASHBOARD
        // =================================

        if (isSeller) {

            if (userRole) {
                userRole.textContent = "Vandè";
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


            await loadSellerStats(user.id);

            return;
        }


        // =================================
        // BUYER DASHBOARD
        // =================================

        if (isBuyer) {

            if (userRole) {
                userRole.textContent = "Achtè";
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


        // =================================
        // UNKNOWN ROLE
        // =================================

        showError(
            "Nou pa kapab detèmine kalite kont ou."
        );

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        showError(
            "Yon pwoblèm rive pandan chajman dashboard la."
        );
    }
}


// ========================================
// SELLER STATISTICS
// ========================================

async function loadSellerStats(userId) {

    // ====================================
    // PRODUCTS
    // ====================================

    const {
        count: productsCount,
        error: productsError
    } = await supabase
        .from("products")
        .select("id", {
            count: "exact",
            head: true
        })
        .eq("seller_id", userId);


    if (productsError) {

        console.error(
            "Products count error:",
            productsError
        );


        if (productCount) {
            productCount.textContent = "0";
        }

    } else {

        if (productCount) {

            productCount.textContent =
                productsCount || 0;
        }
    }


    // ====================================
    // ORDERS
    // ====================================

    const orderStat =
        document.querySelector(
            ".stats-section .stat-card:nth-child(2) strong"
        );


    const salesStat =
        document.querySelector(
            ".stats-section .stat-card:nth-child(3) strong"
        );


    try {

        const {
            data: orders,
            error: ordersError
        } = await supabase
            .from("orders")
            .select(`
                id,
                amount
            `)
            .eq("seller_id", userId);


        // =================================
        // ORDERS TABLE NOT READY
        // =================================

        if (ordersError) {

            console.warn(
                "Orders table poko disponib:",
                ordersError.message
            );


            if (orderStat) {
                orderStat.textContent = "0";
            }


            if (salesStat) {
                salesStat.textContent = "0 HTG";
            }


            return;
        }


        // =================================
        // ORDER COUNT
        // =================================

        if (orderStat) {

            orderStat.textContent =
                orders?.length || 0;
        }


        // =================================
        // TOTAL SALES
        // =================================

        const totalSales =
            (orders || []).reduce(
                (
                    total,
                    order
                ) => {

                    return total +
                        Number(
                            order.amount || 0
                        );

                },
                0
            );


        if (salesStat) {

            salesStat.textContent =
                formatHTG(totalSales);
        }

    }

    catch (error) {

        console.warn(
            "Orders poko disponib:",
            error
        );


        if (orderStat) {
            orderStat.textContent = "0";
        }


        if (salesStat) {
            salesStat.textContent = "0 HTG";
        }
    }
}


// ========================================
// LOGOUT
// ========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const {
                error
            } = await supabase.auth.signOut();


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


// ========================================
// START
// ========================================

loadDashboard();
