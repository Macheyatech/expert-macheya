// ============================================================
// MACHEYA — LOGIN.JS
// ============================================================

(function () {

    "use strict";


    // ========================================================
    // SHOW / HIDE PASSWORD
    // ========================================================

    const passwordButtons =
        document.querySelectorAll(".show-password");


    passwordButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                const targetId =
                    button.dataset.target;

                const input =
                    document.getElementById(targetId);


                if (!input) {
                    return;
                }


                if (input.type === "password") {

                    input.type = "text";

                    button.textContent = "🙈";

                } else {

                    input.type = "password";

                    button.textContent = "👁️";

                }

            }
        );

    });


    // ========================================================
    // FORM
    // ========================================================

    const form =
        document.getElementById("loginForm");


    if (!form) {

        console.error(
            "MACHEYA: loginForm pa jwenn."
        );

        return;
    }


    const emailInput =
        document.getElementById("email");


    const passwordInput =
        document.getElementById("password");


    const loginButton =
        document.getElementById("loginButton");


    // ========================================================
    // SUPABASE
    // ========================================================

    function getSupabaseClient() {

        // Client config la deja kreye
        if (window.supabaseClient) {

            return window.supabaseClient;

        }


        // Si config la pa t kreye client la,
        // itilize bibliyotèk Supabase ki deja chaje a.

        if (window.supabase) {

            const SUPABASE_URL =
                "https://iscktsymqntjgqaxcitv.supabase.co";

            const SUPABASE_KEY =
                "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


            try {

                window.supabaseClient =
                    window.supabase.createClient(
                        SUPABASE_URL,
                        SUPABASE_KEY
                    );


                console.log(
                    "MACHEYA: Supabase client kreye."
                );


                return window.supabaseClient;


            } catch (error) {

                console.error(
                    "MACHEYA: Erè pandan kreyasyon Supabase client:",
                    error
                );

                return null;

            }

        }


        return null;

    }


    // ========================================================
    // LOGIN
    // ========================================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            const password =
                passwordInput.value;


            // ==================================================
            // VALIDATION
            // ==================================================

            if (!email || !password) {

                alert(
                    "Tanpri antre imèl ou ak modpas ou."
                );

                return;
            }


            // ==================================================
            // BUTTON
            // ==================================================

            if (loginButton) {

                loginButton.disabled = true;

                loginButton.textContent =
                    "Koneksyon...";

            }


            try {

                // ==================================================
                // GET CLIENT
                // ==================================================

                const supabase =
                    getSupabaseClient();


                if (!supabase) {

                    throw new Error(
                        "Supabase pa disponib."
                    );

                }


                console.log(
                    "MACHEYA: N ap konekte..."
                );


                // ==================================================
                // AUTHENTICATION
                // ==================================================

                const {
                    data,
                    error
                } =
                    await supabase.auth.signInWithPassword({

                        email: email,

                        password: password

                    });


                if (error) {

                    console.error(
                        "MACHEYA AUTH ERROR:",
                        error
                    );

                    throw error;

                }


                const user =
                    data?.user;


                if (!user) {

                    throw new Error(
                        "Macheya pa jwenn itilizatè a."
                    );

                }


                console.log(
                    "MACHEYA: Koneksyon reyisi:",
                    user.id
                );


                // ==================================================
                // PROFILE
                // ==================================================

                const {
                    data: profile,
                    error: profileError
                } =
                    await supabase
                        .from("profiles")
                        .select("*")
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


                if (!profile) {

                    throw new Error(
                        "Kont lan konekte, men pwofil Macheya a pa jwenn."
                    );

                }


                console.log(
                    "MACHEYA PROFILE:",
                    profile
                );


                // ==================================================
                // ROLE
                // ==================================================

                const role =
                    String(
                        profile.role || ""
                    )
                        .trim()
                        .toLowerCase();


                const isBuyer =
                    role === "acheteur" ||
                    role === "achte" ||
                    role === "buyer";


                const isSeller =
                    role === "vendeur" ||
                    role === "vande" ||
                    role === "seller";


                if (!isBuyer && !isSeller) {

                    throw new Error(
                        "Macheya pa rekonèt kalite kont sa a."
                    );

                }


                // ==================================================
                // SUCCESS
                // ==================================================

                console.log(
                    "MACHEYA: Login fini avèk siksè."
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
                    ).toLowerCase();


                let message =
                    "Nou pa kapab konekte ou kounye a.";


                // ==================================================
                // SUPABASE CLIENT
                // ==================================================

                if (
                    errorText.includes(
                        "supabase pa disponib"
                    )
                ) {

                    message =
                        "Macheya pa rive konekte ak sèvis la. Tanpri rechaje paj la epi eseye ankò.";

                }


                // ==================================================
                // INVALID LOGIN
                // ==================================================

                else if (
                    errorText.includes(
                        "invalid login credentials"
                    )
                ) {

                    message =
                        "Imèl oswa modpas la pa kòrèk.";

                }


                // ==================================================
                // EMAIL NOT CONFIRMED
                // ==================================================

                else if (
                    errorText.includes(
                        "email not confirmed"
                    )
                ) {

                    message =
                        "Tanpri verifye imèl ou anvan ou konekte.";

                }


                // ==================================================
                // PROFILE
                // ==================================================

                else if (
                    errorText.includes(
                        "pwofil"
                    )
                ) {

                    message =
                        error.message;

                }


                // ==================================================
                // OTHER ERROR
                // ==================================================

                else if (error?.message) {

                    message =
                        error.message;

                }


                alert(message);


            } finally {

                if (loginButton) {

                    loginButton.disabled = false;

                    loginButton.textContent =
                        "Konekte";

                }

            }

        }
    );


    // ========================================================
    // FORGOT PASSWORD
    // ========================================================

    const forgotPassword =
        document.getElementById(
            "forgotPassword"
        );


    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                const email =
                    emailInput.value
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
                            "Supabase pa disponib."
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
