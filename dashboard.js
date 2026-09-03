// ============================================================
// MACHEYA — DASHBOARD.JS
// ============================================================

(function () {

    "use strict";

    console.log("MACHEYA: dashboard.js ap demare...");

    // ========================================================
    // ELEMENTS
    // ========================================================

    const loading = document.getElementById("loadingSection");
    const buyerSpace = document.getElementById("buyerSpace");
    const sellerSpace = document.getElementById("sellerSpace");
    const errorSection = document.getElementById("errorSection");
    const errorMessage = document.getElementById("errorMessage");
    const retryButton = document.getElementById("retryButton");
    const userName = document.getElementById("userName");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const roleBadge = document.getElementById("roleBadge");
    const logoutButton = document.getElementById("logoutButton");
    const productCount = document.getElementById("productCount");
    const orderCount = document.getElementById("orderCount");
    const salesTotal = document.getElementById("salesTotal");

    // ========================================================
    // SUPABASE
    // ========================================================

    const supabase = window.supabaseClient;

    if (!supabase) {
        showError("Macheya pa kapab konekte ak Supabase. Verifye supabase-config.js.");
        return;
    }

    // ========================================================
    // HELPERS
    // ========================================================

    function hide(element) {
        if (element) element.hidden = true;
    }

    function show(element) {
        if (element) element.hidden = false;
    }

    function showError(message) {
        hide(loading);
        hide(buyerSpace);
        hide(sellerSpace);
        show(errorSection);
        if (errorMessage) errorMessage.textContent = message;
        console.error("MACHEYA ERROR:", message);
    }

    function formatMoney(amount) {
        return new Intl.NumberFormat("fr-FR").format(amount) + " HTG";
    }

    // ========================================================
    // RESET DASHBOARD
    // ========================================================

    function resetDashboard() {
        hide(buyerSpace);
        hide(sellerSpace);
        hide(errorSection);
        show(loading);
    }

    // ========================================================
    // START
    // ========================================================

    async function start() {
        resetDashboard();

        try {
            console.log("MACHEYA: N ap verifye sesyon...");

            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error("SESSION ERROR:", sessionError);
                throw new Error("Nou pa kapab verifye sesyon ou.");
            }

            const session = sessionData?.session;

            if (!session || !session.user) {
                console.log("MACHEYA: Pa gen sesyon aktif.");
                window.location.href = "login.html";
                return;
            }

            const user = session.user;
            console.log("MACHEYA USER:", user.id);

            console.log("MACHEYA: N ap chèche pwofil...");

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id, nom_complet, telephone, role, est_acheteur, est_vendeur")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) {
                console.error("PROFILE ERROR:", profileError);
                throw new Error("Nou pa kapab li pwofil kont ou.");
            }

            if (!profile) {
                throw new Error("Kont ou konekte, men pwofil Macheya a pa egziste.");
            }

            console.log("MACHEYA PROFILE:", profile);

            const name = profile.nom_complet || user.user_metadata?.nom_complet || user.email?.split("@")[0] || "Itilizatè";

            if (userName) {
                userName.textContent = `Bonjou, ${name} 👋`;
            }

            const role = String(profile.role || "").trim().toLowerCase();
            const isBuyer = role === "acheteur" && profile.est_acheteur === true;
            const isSeller = role === "vendeur" && profile.est_vendeur === true;
            const isAdmin = role === "admin";

            console.log("MACHEYA ROLE:", role);
            console.log("MACHEYA IS BUYER:", isBuyer);
            console.log("MACHEYA IS SELLER:", isSeller);
            console.log("MACHEYA IS ADMIN:", isAdmin);

            // Admin redireksyon
            if (isAdmin) {
                console.log("MACHEYA: Admin detekte, redireksyon...");
                window.location.href = "admin.html";
                return;
            }

            // Buyer space
            if (isBuyer) {
                if (roleBadge) roleBadge.textContent = "Achtè";
                if (welcomeMessage) welcomeMessage.textContent = "Dekouvri pwodwi epi swiv kòmand ou yo.";

                hide(loading);
                hide(sellerSpace);
                show(buyerSpace);

                console.log("MACHEYA: Dashboard Achtè aktive.");
                return;
            }

            // Seller space
            if (isSeller) {
                if (roleBadge) roleBadge.textContent = "Vandè";
                if (welcomeMessage) welcomeMessage.textContent = "Men espas kote ou ka jere biznis ou.";

                hide(loading);
                hide(buyerSpace);
                show(sellerSpace);

                console.log("MACHEYA: Dashboard Vandè aktive.");
                await loadSellerData(user.id);
                return;
            }

            throw new Error("Pwofil kont ou pa gen yon kalite kont Macheya valab. Verifye role, est_acheteur ak est_vendeur nan profiles.");

        } catch (error) {
            console.error("MACHEYA DASHBOARD ERROR:", error);
            showError(error.message || "Nou pa kapab chaje dashboard la.");
        }
    }

    // ========================================================
    // SELLER DATA — AMELYORE
    // ========================================================

    async function loadSellerData(userId) {
        if (productCount) productCount.textContent = "...";
        if (orderCount) orderCount.textContent = "...";
        if (salesTotal) salesTotal.textContent = "...";

        try {
            // 1. Product count
            const { count: pCount, error: pError } = await supabase
                .from("products")
                .select("id", { count: "exact", head: true })
                .eq("seller_id", userId);

            if (pError) {
                console.error("PRODUCT COUNT ERROR:", pError);
                if (productCount) productCount.textContent = "0";
            } else {
                if (productCount) productCount.textContent = pCount ?? 0;
            }

            // 2. Order count
            const { count: oCount, error: oError } = await supabase
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("seller_id", userId);

            if (oError) {
                console.error("ORDER COUNT ERROR:", oError);
                if (orderCount) orderCount.textContent = "0";
            } else {
                if (orderCount) orderCount.textContent = oCount ?? 0;
            }

            // 3. Sales total (completed orders only)
            const { data: salesData, error: sError } = await supabase
                .from("orders")
                .select("total")
                .eq("seller_id", userId)
                .eq("status", "completed");

            if (sError) {
                console.error("SALES TOTAL ERROR:", sError);
                if (salesTotal) salesTotal.textContent = "0 HTG";
            } else {
                const total = salesData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
                if (salesTotal) salesTotal.textContent = formatMoney(total);
            }

        } catch (error) {
            console.error("LOAD SELLER DATA ERROR:", error);
        }
    }

    // ========================================================
    // LOGOUT
    // ========================================================

    if (logoutButton) {
        logoutButton.addEventListener("click", async function () {
            logoutButton.disabled = true;
            logoutButton.textContent = "Dekonekte...";

            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                window.location.href = "login.html";
            } catch (error) {
                console.error("LOGOUT ERROR:", error);
                alert(error.message || "Nou pa kapab dekonekte kounye a.");
                logoutButton.disabled = false;
                logoutButton.textContent = "Dekonekte";
            }
        });
    }

    // ========================================================
    // RETRY
    // ========================================================

    if (retryButton) {
        retryButton.addEventListener("click", function () {
            start();
        });
    }

    // ========================================================
    // RUN
    // ========================================================

    start();

})();
