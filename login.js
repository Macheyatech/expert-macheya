// ============================================================
// MACHEYA — LOGIN.JS
// ============================================================

(function () {

    "use strict";

    console.log("MACHEYA: login.js ap demare...");


    // ========================================================
    // SUPABASE CLIENT
    // ========================================================

    const supabase =
        window.supabaseClient;


    if (!supabase) {

        console.error(
            "MACHEYA: supabaseClient pa disponib."
        );

        alert(
            "Macheya pa kapab konekte ak sèvis la kounye a."
        );

        return;
    }


    console.log(
        "MACHEYA: Supabase client jwenn."
    );


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
    // SHOW / HIDE PASSWORD
    // ========================================================

    document
        .querySelectorAll(".show-password")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const targetId =
                        button.dataset.target;

                    const target =
                        document.getElementById(
                            targetId
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

                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "Koneksyon...";
            }


            try {

                console.log(
                    "MACHEYA: N ap konekte..."
                );


                // ==================================================
                // AUTH
                // ==================================================

                const {
                    data,
                    error
                } =
                    await supabase.auth
                        .signInWithPassword({

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
                    "MACHEYA: Koneksyon reyisi.",
                    user.id
                );


                // ==================================================
                // VERIFY PROFILE
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


                console.log(
                    "MACHEYA ROLE:",
                    role
                );


                // ==================================================
                // VERIFY ACCOUNT TYPE
                // ==================================================

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

                alert(
                    isSeller
                        ? "Koneksyon reyisi! Byenveni Vandè."
                        : "Koneksyon reyisi! Byenveni Achtè."
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
                    "Yon erè rive pandan koneksyon an.";


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
                    error?.message
                ) {

                    message =
                        error.message;
                }


                alert(message);


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


})();
