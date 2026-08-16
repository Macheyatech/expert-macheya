// ============================================================
// MACHEYA — SIGNUP.JS
// ============================================================

(function () {

    "use strict";

    console.log("MACHEYA: signup.js ap demare...");


    // ========================================================
    // SUPABASE
    // ========================================================

    const supabase =
        window.supabaseClient;


    if (!supabase) {

        console.error(
            "MACHEYA: Supabase client pa disponib."
        );

        alert(
            "Macheya pa kapab konekte ak sèvis la kounye a."
        );

        return;
    }


    // ========================================================
    // FORM
    // ========================================================

    const form =
        document.getElementById("signupForm");


    const button =
        document.getElementById("signupButton");


    if (!form) {

        console.error(
            "MACHEYA: signupForm pa jwenn."
        );

        return;
    }


    // ========================================================
    // PASSWORD SHOW / HIDE
    // ========================================================

    document
        .querySelectorAll(".show-password")
        .forEach(function (toggleButton) {

            toggleButton.addEventListener(
                "click",
                function () {

                    const targetId =
                        toggleButton.dataset.target;

                    const input =
                        document.getElementById(
                            targetId
                        );


                    if (!input) {
                        return;
                    }


                    if (
                        input.type ===
                        "password"
                    ) {

                        input.type =
                            "text";

                        toggleButton.textContent =
                            "🙈";

                    } else {

                        input.type =
                            "password";

                        toggleButton.textContent =
                            "👁️";
                    }

                }
            );

        });


    // ========================================================
    // SIGNUP
    // ========================================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ==================================================
            // VALUES
            // ==================================================

            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();


            const confirmEmail =
                document
                    .getElementById("confirmEmail")
                    .value
                    .trim()
                    .toLowerCase();


            const phone =
                document
                    .getElementById("phone")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            const role =
                document
                    .getElementById("role")
                    .value;


            // ==================================================
            // VALIDATION
            // ==================================================

            if (
                !name ||
                !email ||
                !confirmEmail ||
                !password ||
                !confirmPassword ||
                !role
            ) {

                alert(
                    "Tanpri ranpli tout chan obligatwa yo."
                );

                return;
            }


            if (
                email !==
                confirmEmail
            ) {

                alert(
                    "De imèl yo pa menm."
                );

                return;
            }


            if (
                password.length < 6
            ) {

                alert(
                    "Modpas la dwe gen omwen 6 karaktè."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "De modpas yo pa menm."
                );

                return;
            }


            if (
                role !== "acheteur" &&
                role !== "vendeur"
            ) {

                alert(
                    "Tanpri chwazi si kont lan se Achtè oswa Vandè."
                );

                return;
            }


            // ==================================================
            // ROLE FLAGS
            // ==================================================

            const isBuyer =
                role === "acheteur";


            const isSeller =
                role === "vendeur";


            // ==================================================
            // BUTTON
            // ==================================================

            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Kreyasyon kont...";
            }


            try {


                // ==================================================
                // CREATE AUTH USER
                // ==================================================

                console.log(
                    "MACHEYA: N ap kreye kont Auth..."
                );


                const {
                    data: authData,
                    error: authError
                } =
                    await supabase.auth.signUp({

                        email:
                            email,

                        password:
                            password,

                        options: {

                            data: {

                                nom_complet:
                                    name,

                                telephone:
                                    phone,

                                role:
                                    role,

                                est_acheteur:
                                    isBuyer,

                                est_vendeur:
                                    isSeller
                            }

                        }

                    });


                if (authError) {
                    throw authError;
                }


                const user =
                    authData?.user;


                if (!user) {

                    throw new Error(
                        "Macheya pa t kapab kreye kont lan."
                    );

                }


                console.log(
                    "MACHEYA: Auth user kreye:",
                    user.id
                );


                // ==================================================
                // CREATE PROFILE
                // ==================================================

                console.log(
                    "MACHEYA: N ap kreye pwofil..."
                );


                const {
                    error: profileError
                } =
                    await supabase
                        .from("profiles")
                        .insert({

                            id:
                                user.id,

                            nom_complet:
                                name,

                            telephone:
                                phone || null,

                            est_acheteur:
                                isBuyer,

                            est_vendeur:
                                isSeller,

                            role:
                                role

                        });


                if (profileError) {

                    console.error(
                        "MACHEYA PROFILE ERROR:",
                        profileError
                    );

                    throw profileError;
                }


                console.log(
                    "MACHEYA: Profile kreye avèk siksè."
                );


                // ==================================================
                // SESSION EXISTS
                // ==================================================

                if (authData.session) {

                    alert(
                        "Kont ou kreye avèk siksè!"
                    );


                    window.location.href =
                        "dashboard.html";


                    return;
                }


                // ==================================================
                // EMAIL CONFIRMATION REQUIRED
                // ==================================================

                alert(
                    "Kont ou kreye avèk siksè! Verifye imèl ou pou aktive kont ou."
                );


                window.location.href =
                    "login.html";


            } catch (error) {


                // ==================================================
                // ERROR
                // ==================================================

                console.error(
                    "MACHEYA SIGNUP ERROR:",
                    error
                );


                let message =
                    "Yon erè rive pandan kreyasyon kont lan.";


                const errorText =
                    String(
                        error?.message || ""
                    ).toLowerCase();


                if (
                    errorText.includes(
                        "already registered"
                    )
                ) {

                    message =
                        "Imèl sa a deja gen yon kont sou Macheya.";

                } else if (
                    errorText.includes(
                        "user already registered"
                    )
                ) {

                    message =
                        "Imèl sa a deja gen yon kont sou Macheya.";

                } else if (
                    errorText.includes(
                        "duplicate"
                    )
                ) {

                    message =
                        "Pwofil sa a deja egziste.";

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


                // ==================================================
                // RESET BUTTON
                // ==================================================

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "Kreye Kont";
                }

            }

        }
    );


})();
