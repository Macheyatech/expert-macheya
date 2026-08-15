// ============================================================
// MACHEYA — DASHBOARD
// VÈSYON FINAL
// ============================================================


// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabase =
    window.supabaseClient;


// ============================================================
// VERIFY SUPABASE
// ============================================================

if (!supabase) {

    console.error(
        "Macheya: Supabase client pa disponib."
    );

    const errorBox =
        document.getElementById("dashboardError");

    const errorText =
        document.getElementById("errorMessage");


    if (errorBox) {
        errorBox.style.display = "block";
    }


    if (errorText) {

        errorText.textContent =
            "Koneksyon Macheya ak Supabase pa disponib.";
    }

} else {

    startDashboard();
}



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
// START DASHBOARD
// ============================================================

async function startDashboard() {

    try {

        hideError();

        await loadDashboard();

    } catch (error) {

        console.error(
            "Macheya Dashboard Error:",
            error
        );

        showError(
            "Nou pa kapab chaje enfòmasyon kont ou."
        );
    }
}



// ============================================================
// SHOW ERROR
// ============================================================

function showError(message) {

    if (buyerDashboard) {

        buyerDashboard.style.display =
            "none";
    }


    if (sellerDashboard) {

        sellerDashboard.style.display =
            "none";
    }


    if (dashboardError) {

        dashboardError.style.display =
            "block";
    }


    if (errorMessage) {

        errorMessage.textContent =
            message;
    }
}



// ============================================================
// HIDE ERROR
// ============================================================

function hideError() {

    if (dashboardError) {

        dashboardError.style.display =
            "none";
    }
}



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
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {


    // ========================================================
    // GET CONNECTED USER
    // ========================================================

    const {
        data,
        error: authError
    } = await supabase.auth.getUser();


    if (authError) {

        throw authError;
    }


    const user =
        data?.user;


    if (!user) {

        window.location.href =
            "login.html";

        return;
    }



    // ========================================================
    // GET PROFILE
    // ========================================================

    /*
       Nou itilize select("*") isit la.
       Sa pèmèt dashboard la pa kraze si gen
       yon kolòn profile nou poko konnen non egzak li.
    */

    const {
        data: profile,
        error: profileError
    } = await supabase
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

        throw profileError;
    }


    if (!profile) {

        showError(
            "Nou pa jwenn pwofil kont sa a nan Macheya."
        );

        return;
    }



    // ========================================================
    // NAME
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
        normalizeText(
            profile.role
        );


    const sellerFlag =
        profile.est_vendeur === true ||
        profile.is_seller === true ||
        profile.vendeur === true;


    const buyerFlag =
        profile.est_acheteur === true ||
        profile.is_buyer === true ||
        profile.acheteur === true;



    // ========================================================
    // CHECK SELLER
    // ========================================================

    const isSeller =
        sellerFlag ||
        role === "vendeur" ||
        role === "seller" ||
        role === "vandè" ||
        role === "vande";



    // ========================================================
    // CHECK BUYER
    // ========================================================

    const isBuyer =
        buyerFlag ||
        role === "acheteur" ||
        role === "buyer" ||
        role === "achte" ||
        role === "achtè";



    // ========================================================
    // SELLER DASHBOARD
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


        if (buyerDashboard) {

            buyerDashboard.style.display =
                "none";
        }


        await loadSellerStats(
            user.id
        );


        return;
    }



    // ========================================================
    // BUYER DASHBOARD
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


        if (sellerDashboard) {

            sellerDashboard.style.display =
                "none";
        }


        return;
    }



    // ========================================================
    // ROLE UNKNOWN
    // ========================================================

    console.warn(
        "Macheya: Role pa rekonèt.",
        profile
    );


    showError(
        "Nou jwenn kont ou, men nou pa jwenn kalite kont lan."
    );
}



// ============================================================
// SELLER STATISTICS
// ============================================================

async function loadSellerStats(
    userId
) {


    // ========================================================
    // PRODUCT COUNT
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
            "Products count error:",
            productsError
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

    if (!orderCount && !salesTotal) {

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


    /*
       Orders poko fèt nan sistèm nan.
       Se poutèt sa nou pa konsidere sa kòm yon
       erè ki dwe kraze dashboard la.
    */

    if (ordersError) {

        console.log(
            "Macheya: orders poko disponib."
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
    // TOTAL SALES
    // ========================================================

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


    if (salesTotal) {

        salesTotal.textContent =
            totalSales.toLocaleString(
                "en-US"
            ) + " HTG";
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

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }
        }
    );
}
