// ============================================================
// MACHEYA — DASHBOARD.JS
// Travay ak supabase.config.js ki itilize window.supabaseClient
// ============================================================


// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabase = window.supabaseClient;


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

const productCount =
    document.getElementById("productCount");

const orderCount =
    document.getElementById("orderCount");

const salesTotal =
    document.getElementById("salesTotal");


// ============================================================
// VERIFY SUPABASE
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
        // VERIFY USER
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


        // Si pa gen moun konekte
        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        console.log(
            "Macheya: User konekte:",
            user.id
        );


        // ====================================================
        // GET PROFILE
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

            console.error(
                "Macheya: Profile error:",
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
            "Macheya: Profile:",
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


        const seller =
            profile.est_vendeur === true ||
            profile.is_seller === true ||
            profile.vendeur === true ||
            role === "vendeur" ||
            role === "vande" ||
            role === "seller";


        const buyer =
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
            seller,
            "Buyer:",
            buyer
        );


        // ====================================================
        // SELLER
        // ====================================================

        if (seller) {

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


            // Chaje kantite pwodwi
            await loadSellerStats(user.id);

            return;
        }


        // ====================================================
        // BUYER
        // ====================================================

        if (buyer) {

            if (userRole) {
                userRole.textContent = "Achtè";
            }


            if (welcomeText) {

                welcomeText.textContent =
                    "Dekouvri pwodwi epi swiv kòmand ou yo.";
           
