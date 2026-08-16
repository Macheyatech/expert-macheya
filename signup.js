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
            "MACHEYA: supabaseClient pa jwenn."
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


    if (!form) {

        console.error(
            "MACHEYA: signupForm introuvable."
        );

        return;
    }


    // ========================================================
    // PASSWORD TOGGLE
    // ========================================================

    document
        .querySelectorAll(".show-password")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const targetId =
                        button.dataset.target;

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

                        button.textContent =
                            "🙈";

                    } else {

                        input.type =
                            "password";

                        button.textContent =
                            "👁️";
                    }

                }
            );

        });


    // ========================================================
    // SUBMIT
    // ========================================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ==================================================
            // ELEMENTS
            // ==================================================

            const nameInput =
                document.getElementById("name");

            const emailInput =
                document.getElementById("email");

            const confirmEmailInput =
                document.getElementById(
                    "confirmEmail"
                );

            const phoneInput =
                document.getElementById("phone");

            const passwordInput =
                document.getElementById(
                    "password"
                );

            const confirmPasswordInput =
                document.getElementById(
                    "confirmPassword"
                );

            const roleInput =
                document.getElementById("role");


            if (
                !nameInput ||
                !emailInput ||
                !confirmEmailInput ||
                !phoneInput ||
                !passwordInput ||
                !confirmPasswordInput ||
                !roleInput
            ) {

                alert(
                    "Gen yon eleman ki manke nan fòm kreyasyon kont lan."
                );

                console.error(
                    "MACHEYA: Youn oswa plizyè input signup manke."
                );

                return;
            }


            // ==================================================
            // VALUES
            // ==================================================

            const name =
                nameInput.value.trim();

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const confirmEmail =
                confirmEmailInput.value
                    .trim()
                    .toLowerCase();

            const phone =
                phoneInput.value.trim();

            const password =
                passwordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;

            const role =
                roleInput.value
                    .trim()
                    .toLowerCase();


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


            // ==================================================
            // ROLE
            // ==================================================

            if (
                role !== "acheteur" &&
                role !== "vendeur"
            ) {

                alert(
                    "Tanpri chwazi si ou se Achtè oswa Vandè."
                );

                return;
            }


            // ==================================================
            // EMAIL
            // ==================================================

            if (
                email !==
                confirmEmail
            ) {

                alert(
                    "De imèl yo pa menm."
                );

                return;
            }


            // ==================================================
            // PASSWORD
            // ==================================================

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


            // ==================================================
            // BUTTON
            // ==================================================

            const button =
                form.querySelector(
                    "button[type='submit']"
                );


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
                    "MACHEYA: Kreyasyon kont..."
                );


                const {
                    data,
                    error
                } =
                    await supabase.auth.signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {

                                name: name,

                                phone: phone,

                                role: role

                            }

                        }

                    });


                if (error) {

                    throw error;

                }


                if (!data || !data.user) {

                    throw new Error(
                        "Kont lan pa t ka kreye."
                    );

                }


                console.log(
                    "MACHEYA: Kont Auth kreye.",
                    data.user.id
                );


                // ==================================================
                // IMPORTANT
                // ==================================================
                //
                // Nou PA fè:
                //
                // supabase.from("profiles").insert(...)
                //
                // Trigger Supabase la ap kreye profiles otomatikman.
                //
                // ==================================================


                if (data.session) {

                    alert(
                        "Kont ou kreye avèk siksè!"
                    );

                } else {

                    alert(
                        "Kont ou kreye avèk siksè. Verifye imèl ou pou aktive kont lan."
                    );

                }


                // ==================================================
                // LOGIN
                // ==================================================

                window.location.href =
                    "login.html";


            } catch (error) {


                console.error(
                    "MACHEYA SIGNUP ERROR:",
                    error
                );


                let message =
                    "Yon erè rive pandan kreyasyon kont lan.";


                if (error?.message) {

                    message =
                        error.message;

                }


                // ==================================================
                // MESSAGES PI KLÈ
                // ==================================================

                if (
                    message
                        .toLowerCase()
                        .includes(
                            "already registered"
                        )
                ) {

                    message =
                        "Imèl sa a deja gen yon kont sou Macheya.";

                }


                if (
                    message
                        .toLowerCase()
                        .includes(
                            "invalid email"
                        )
                ) {

                    message =
                        "Adrès imèl la pa valid.";

                }


                alert(
                    message
                );


            } finally {


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
