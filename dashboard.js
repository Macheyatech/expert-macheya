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

const reloadDashboard =
    document.getElementById("reloadDashboard");

const productCount =
    document.getElementById("productCount");

const orderCount =
    document.getElementById("orderCount");

const salesTotal =
    document.getElementById("salesTotal");


// ========================================
// SHOW ERROR
// ========================================

function showError(message) {

    buyerDashboard.style.display = "none";

    sellerDashboard.style.display = "none";

    dashboardError.style.display = "block";

    errorMessage.textContent = message;
}


// ========================================
// HIDE ERROR
// ========================================

function hideError() {

    dashboardError.style.display = "none";
}


// ========================================
// FORMAT HTG
// ========================================

function formatHTG(amount) {

    const value = Number(amount || 0);

    return value.toLocaleString("en-US") + " HTG";
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


        welcomeName.textContent =
            `Bonjou, ${name} 👋`;



        // =================================
        // DETERMINE ROLE
        // =================================

        let role = profile.role;


        if (!role) {

            if (profile.est_vendeur === true) {

                role = "vendeur";

            } else if (
                profile.est_acheteur === true
            ) {

                role = "acheteur";
            }
        }



        // =================================
        // SELLER
        // =================================

        if (
            role === "vendeur" ||
            role === "vendeur " ||
            role === "seller" ||
            profile.est_vendeur === true
        ) {

            userRole.textContent =
                "Vandè";


            welcomeText.textContent =
                "Men espas kote ou ka jere biznis ou.";


            sellerDashboard.style.display =
                "block";


            buyerDashboard.style.display =
                "none";


            await loadSellerStats(user.id);

            return;
        }



        // =================================
        // BUYER
        // =================================

        if (
            role === "achte" ||
            role === "acheteur" ||
            role === "buyer" ||
            role === "achtè" ||
            profile.est_acheteur === true
        ) {

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


        productCount.textContent = "0";

    } else {

        productCount.textContent =
            productsCount || 0;
    }



    // ====================================
    // ORDERS
    // ====================================

    try {

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


        /*
         * orders table poko oblije egziste.
         * Lè li poko la, nou montre 0.
         */

        if (ordersError) {

            console.warn(
                "Orders table poko disponib:",
                ordersError.message
            );


            orderCount.textContent =
                "0";


            salesTotal.textContent =
                "0 HTG";


            return;
        }



        // =================================
        // ORDER COUNT
        // =================================

        orderCount.textContent =
            orders?.length || 0;



        // =================================
        // SALES
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


        salesTotal.textContent =
            formatHTG(totalSales);

    }

    catch (error) {

        console.warn(
            "Orders poko disponib:",
            error
        );


        orderCount.textContent =
            "0";


        salesTotal.textContent =
            "0 HTG";
    }

}


// ========================================
// LOGOUT
// ========================================

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


// ========================================
// RELOAD
// ========================================

reloadDashboard.addEventListener(
    "click",
    () => {

        window.location.reload();

    }
);


// ========================================
// START
// ========================================

loadDashboard();
