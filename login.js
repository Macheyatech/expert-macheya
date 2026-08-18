// ============================================================
// MACHEYA — LOGIN.JS
// ============================================================

(function () {

    "use strict";

    console.log("MACHEYA: login.js ap demare...");

    // ========================================================
    // SUPABASE
    // ========================================================

    const supabase = window.supabaseClient;

    if (!supabase) {
        console.error("MACHEYA: supabaseClient pa disponib.");
        alert("Macheya pa kapab konekte ak sèvis la kounye a.");
        return;
    }


    // ========================================================
    // FORM
    // ========================================================

    const form = document.getElementById("loginForm");

    if (!form) {
        console.error("MACHEYA: loginForm pa jwenn.");
        return;
    }


    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const loginButton =
        document.getElementById("loginButton");


    // ========================================================
    // MONTRE / KACHE MODPAS
    // ========================================================

    document
        .querySelectorAll(".show-password")
        .forEach(function (button) {

            button.addEventListener("click", function () {

                const target =
                    document.getElementById(
                        button.dataset.target
                    );

                if (!target) return;

                if (target.type === "password") {

                    target.type = "text";
                    button.textContent = "🙈";

                } else {

                    target.type = "password";
                    button.textContent = "👁️";

                }

            });

        });


    // ========================================================
    // LOGIN
    // ========================================================

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            emailInput.value.trim().toLowerCase();

        const password =
            passwordInput.value;


        if (!email || !password) {

            alert(
                "Tanpri antre imèl ou ak modpas ou."
            );

            return;
        }


        if (loginButton) {

            loginButton.disabled = true;
            loginButton.textContent = "Koneksyon...";

        }


        try {

            console.log("MACHEYA: N ap konekte...");


            // ==================================================
            // KONEKTE
            // ==================================================

            const { data, error } =
                await supabase.auth.signInWithPassword({

                    email: email,
                    password: password

                });


            if (error) {
                throw error;
            }


            const user = data?.user;


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
            // ROLE KI SOTI NAN AUTH METADATA
            // ==================================================

            const metadata =
                user.user_metadata || {};


            const role =
                String(
                    metadata.role || "acheteur"
                )
                .trim()
                .toLowerCase();


            console.log(
                "MACHEYA: Role:",
                role
            );


            // ==================================================
            // SONJE MWEN
            // ==================================================

            const remember =
                document.getElementById("remember");


            if (
                remember &&
                remember.checked
            ) {

                localStorage.setItem(
                    "macheya_remember",
                    "true"
                );

            } else {

                localStorage.removeItem(
                    "macheya_remember"
                );

            }


            // ==================================================
            // KONTEKS ITILIZATÈ
            // ==================================================

            localStorage.setItem(
                "macheya_user_id",
                user.id
            );

            localStorage.setItem(
                "macheya_role",
                role
            );


            // ==================================================
            // ALE DASHBOARD
            // ==================================================

            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                "MACHEYA LOGIN ERROR:",
                error
            );


            const text =
                String(
                    error?.message || ""
                ).toLowerCase();


            if (
                text.includes(
                    "invalid login credentials"
                )
            ) {

                alert(
                    "Imèl oswa modpas la pa kòrèk."
                );

            } else if (
                text.includes(
                    "email not confirmed"
                )
            ) {

                alert(
                    "Tanpri verifye imèl ou anvan ou konekte."
                );

            } else {

                alert(
                    error?.message ||
                    "Yon erè rive pandan koneksyon an."
                );

            }


        } finally {

            if (loginButton) {

                loginButton.disabled = false;
                loginButton.textContent = "Konekte";

            }

        }

    });


    // ========================================================
    // MODPAS BLIYE
    // ========================================================

    const forgotPassword =
        document.getElementById("forgotPassword");


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
                        "Antre imèl ou an premye."
                    );

                    return;
                }


                try {

                    const { error } =
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
                        "Nou pa t kapab voye lyen an."
                    );

                }

            }
        );

    }


})();
