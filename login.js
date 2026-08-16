// ============================================================
// MACHEYA — LOGIN.JS
// ============================================================

(function () {

    "use strict";

    console.log("MACHEYA: login.js ap demare...");


    // ============================================================
    // ELEMENTS
    // ============================================================

    const form =
        document.getElementById("loginForm");

    const loginButton =
        document.getElementById("loginButton");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const forgotPassword =
        document.getElementById("forgotPassword");


    // ============================================================
    // VERIFY FORM
    // ============================================================

    if (!form) {

        console.error(
            "MACHEYA: loginForm pa jwenn."
        );

        return;
    }


    // ============================================================
    // GET SUPABASE CLIENT
    // ============================================================

    function getSupabaseClient() {

        if (window.supabaseClient) {

            return window.supabaseClient;
        }


        // Si supabase-config.js poko kreye client la,
        // nou kreye li avèk menm configuration Macheya a.

        if (
            window.supabase &&
            typeof window.supabase.createClient ===
            "function"
        ) {

            const SUPABASE_URL =
                "https://iscktsymqntjgqaxcitv.supabase.co";

            const SUPABASE_KEY =
                "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


            window.supabaseClient =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_KEY
                );


            console.log(
                "MACHEYA: Supabase client kreye."
            );


            return window.supabaseClient;
        }


        return null;
    }


    // ============================================================
    // SHOW / HIDE PASSWORD
    // ============================================================

    document
        .querySelectorAll(".show-password")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const target =
                        document.getElementById(
                            button.dataset.target
                        );


                    if (!target) {
                        return;
                    }


                    if (
                        target.type ===
                        "password"
                    ) {

                        target.type =
                            "text";

                        button.textContent =
                            "🙈";

                    } else {

                        target.type =
                            "password";

                        button.textContent =
                            "👁️";
                    }

                }
            );

        });


    // ============================================================
    // LOGIN
    // ============================================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                emailInput
                    ?.value
                    .trim()
                    .toLowerCase();


            const password =
                passwordInput
                    ?.value || "";


            // ========================================================
            // VALIDATION
            // ========================================================

            if (!email || !password) {

                alert(
                    "Tanpri antre imèl ou ak modpas ou."
                );

                return;
            }


            // ========================================================
            // BUTTON
            // ========================================================

            if (loginButton) {

                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "Koneksyon...";
            }


            try {

                // ====================================================
                // SUPABASE
                // ====================================================

                const supabase =
                    getSupabaseClient();


                if (!supabase) {

                    throw new Error(
                        "Supabase client pa disponib."
                    );
                }


                console.log(
                    "MACHEYA: N ap konekte..."
                );


                // ====================================================
                // AUTH
                // ====================================================

                const {
                    data,
                    error
                } =
                    await supabase.auth
                        .signInWithPassword({

                            email:
                                email,

                            password:
                                password

                        });


                if (error) {

                    throw error;
                }


                const user =
                    data?.user;


                if (!user) {

                    throw new Error(
                        "Macheya pa jwenn kont ou."
                    );
                }


                console.log(
                    "MACHEYA: Auth reyisi:",
                    user.id
                );


                // ====================================================
                // PROFILE
                // ====================================================

                const {
                    data: profile,
                    error: profileError
                } =
                    await supabase
                        .from("profiles")
                        .select(
                            "id, nom_complet, telephone, role, est_acheteur, est_vendeur"
                        )
                        .eq(
                            "id",
                            user.id
                        )
                        .maybeSingle();


                if (profileError) {

                    console.error(
                        "MACHEYA PROFILE ERROR:",
                        profileError
                    );

                    throw new Error(
                        "Kont lan konekte, men Macheya pa kapab li pwofil ou."
                    );
                }


                // ====================================================
                // PROFILE NOT FOUND
                // ====================================================

                if (!profile) {

                    throw new Error(
                        "Kont lan konekte, men pwofil Macheya ou a pa jwenn."
                    );
                }


                console.log(
                    "MACHEYA PROFILE:",
                    profile
                );


                // ====================================================
                // ROLE
                // ====================================================

                const role =
                    String(
                        profile.role || ""
                    )
                        .trim()
                        .toLowerCase();


                const isSeller =
                    role === "vendeur" ||
                    role === "vande" ||
                    profile.est_vendeur === true;


                const isBuyer =
                    role === "acheteur" ||
                    role === "achte" ||
                    profile.est_acheteur === true;


                console.log(
                    "MACHEYA ROLE:",
                    role
                );


                console.log(
                    "MACHEYA SELLER:",
                    isSeller
                );


                console.log(
                    "MACHEYA BUYER:",
                    isBuyer
                );


                // ====================================================
                // VALID ROLE
                // ====================================================

                if (!isSeller && !isBuyer) {

                    throw new Error(
                        "Macheya pa jwenn kalite kont ou. Verifye role la nan profiles."
                    );
                }


                // ====================================================
                // LOGIN SUCCESS
                // ====================================================

                console.log(
                    "MACHEYA: Koneksyon reyisi."
                );


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "MACHEYA LOGIN ERROR:",
                    error
                );


                const errorText =
                    String(
                        error?.message || ""
                    )
                        .toLowerCase();


                let message =
                    "Macheya pa kapab konekte ak sèvis la kounye a.";


                if (
                    errorText.includes(
                        "invalid login credentials"
                    )
                ) {

                    message =
                        "Imèl oswa modpas la pa kòrèk.";

                } else if (
                    errorText.includes(
                        "email not confirmed"
                    )
                ) {

                    message =
                        "Tanpri verifye imèl ou anvan ou konekte.";

                } else if (
                    errorText.includes(
                        "supabase client"
                    )
                ) {

                    message =
                        "Macheya pa kapab konekte ak sèvis Supabase la.";

                } else if (
                    error?.message
                ) {

                    message =
                        error.message;
                }


                alert(
                    message
                );


            } finally {

                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "Konekte";
                }

            }

        }
    );


    // ============================================================
    // FORGOT PASSWORD
    // ============================================================

    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                const email =
                    emailInput
                        ?.value
                        .trim()
                        .toLowerCase();


                if (!email) {

                    alert(
                        "Antre imèl ou an premye pou nou ka voye lyen pou chanje modpas la."
                    );

                    return;
                }


                try {

                    const supabase =
                        getSupabaseClient();


                    if (!supabase) {

                        throw new Error(
                            "Supabase client pa disponib."
                        );
                    }


                    const {
                        error
                    } =
                        await supabase.auth
                            .resetPasswordForEmail(
                                email,
                                {
                                    redirectTo:
                                        window.location.origin +
                                        "/login.html"
                                }
                            );


                    if (error) {

                        throw error;
                    }


                    alert(
                        "Nou voye yon lyen pou chanje modpas la nan imèl ou."
                    );


                } catch (error) {

                    console.error(
                        "MACHEYA PASSWORD RESET ERROR:",
                        error
                    );


                    alert(
                        error?.message ||
                        "Nou pa t kapab voye lyen pou chanje modpas la."
                    );
                }

            }
        );

    }


    console.log(
        "MACHEYA: login.js pare."
    );

})();
