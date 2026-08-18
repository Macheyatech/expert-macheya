// ============================================================
// MACHEYA — SIGNUP.JS
// ============================================================

(function () {

    "use strict";

    console.log("MACHEYA: signup.js ap demare...");


    // ========================================================
    // SUPABASE
    // ========================================================

    const supabase = window.supabaseClient;


    if (!supabase) {

        console.error(
            "MACHEYA: supabaseClient pa disponib."
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
            "MACHEYA: signupForm pa jwenn."
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

                        button.setAttribute(
                            "aria-label",
                            "Kache modpas la"
                        );

                    } else {

                        input.type = "password";

                        button.textContent = "👁️";

                        button.setAttribute(
                            "aria-label",
                            "Montre modpas la"
                        );

                    }

                }
            );

        });


    // ========================================================
    // SUBMIT BUTTON
    // ========================================================

    const button =
        form.querySelector(
            "button[type='submit']"
        );


    // ========================================================
    // PREVENT DOUBLE SUBMIT
    // ========================================================

    let isSubmitting = false;


    // ========================================================
    // COOLDOWN
    // ========================================================

    let cooldownTimer = null;


    function startCooldown(seconds) {

        if (!button) {
            return;
        }


        clearInterval(cooldownTimer);


        let remaining = seconds;


        button.disabled = true;

        button.textContent =
            "Tann " + remaining + "s...";


        cooldownTimer =
            setInterval(function () {

                remaining--;


                if (remaining <= 0) {

                    clearInterval(cooldownTimer);

                    button.disabled = false;

                    button.textContent =
                        "Kreye Kont";

                    return;
                }


                button.textContent =
                    "Tann " + remaining + "s...";

            }, 1000);

    }


    // ========================================================
    // SUBMIT
    // ========================================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ------------------------------------------------
            // Pa kite itilizatè a voye menm demann lan 2 fwa
            // ------------------------------------------------

            if (isSubmitting) {

                console.log(
                    "MACHEYA: Demann lan deja ap trete."
                );

                return;
            }


            // ==================================================
            // ELEMENTS
            // ==================================================

            const nameInput =
                document.getElementById("name");

            const emailInput =
                document.getElementById("email");

            const confirmEmailInput =
                document.getElementById("confirmEmail");

            const phoneInput =
                document.getElementById("phone");

            const passwordInput =
                document.getElementById("password");

            const confirmPasswordInput =
                document.getElementById("confirmPassword");

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
                    "MACHEYA: Input signup manke."
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

            if (email !== confirmEmail) {

                alert(
                    "De imèl yo pa menm."
                );

                return;
            }


            // ==================================================
            // PASSWORD
            // ==================================================

            if (password.length < 6) {

                alert(
                    "Modpas la dwe gen omwen 6 karaktè."
                );

                return;
            }


            if (password !== confirmPassword) {

                alert(
                    "De modpas yo pa menm."
                );

                return;
            }


            // ==================================================
            // START SUBMIT
            // ==================================================

            isSubmitting = true;


            if (button) {

                button.disabled = true;

                button.textContent =
                    "Kreyasyon kont...";

            }


            try {

                console.log(
                    "MACHEYA: N ap kreye kont lan..."
                );


                // ==================================================
                // CREATE AUTH USER
                // ==================================================

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


                // ==================================================
                // SUPABASE ERROR
                // ==================================================

                if (error) {

                    throw error;

                }


                // ==================================================
                // CHECK USER
                // ==================================================

                if (!data || !data.user) {

                    throw new Error(
                        "Kont lan pa t ka kreye."
                    );

                }


                console.log(
                    "MACHEYA: Kont Auth kreye:",
                    data.user.id
                );


                // ==================================================
                // SUCCESS
                // ==================================================

                if (data.session) {

                    alert(
                        "Kont ou kreye avèk siksè!"
                    );

                } else {

                    alert(
                        "Kont ou kreye avèk siksè.\n\n" +
                        "Verifye imèl ou pou aktive kont lan."
                    );

                }


                // ==================================================
                // GO LOGIN
                // ==================================================

                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "MACHEYA SIGNUP ERROR:",
                    error
                );


                const errorText =
                    String(
                        error?.message || ""
                    ).toLowerCase();


                let message =
                    "Nou pa t kapab kreye kont ou kounye a.";


                // ==================================================
                // RATE LIMIT — 30 SECONDS
                // ==================================================

                if (
                    errorText.includes(
                        "after 30 seconds"
                    ) ||
                    errorText.includes(
                        "security purposes"
                    ) ||
                    errorText.includes(
                        "rate limit"
                    ) ||
                    errorText.includes(
                        "too many requests"
                    )
                ) {

                    message =
                        "Pou sekirite Macheya, tanpri tann kèk segonn " +
                        "anvan ou eseye kreye kont lan ankò.";

                    alert(message);

                    isSubmitting = false;

                    startCooldown(30);

                    return;
                }


                // ==================================================
                // EMAIL ALREADY REGISTERED
                // ==================================================

                if (
                    errorText.includes(
                        "already registered"
                    ) ||
                    errorText.includes(
                        "user already exists"
                    )
                ) {

                    message =
                        "Imèl sa a deja gen yon kont sou Macheya.";

                }


                // ==================================================
                // INVALID EMAIL
                // ==================================================

                else if (
                    errorText.includes(
                        "invalid email"
                    )
                ) {

                    message =
                        "Adrès imèl la pa valid.";

                }


                // ==================================================
                // WEAK PASSWORD
                // ==================================================

                else if (
                    errorText.includes(
                        "password"
                    ) &&
                    errorText.includes(
                        "weak"
                    )
                ) {

                    message =
                        "Modpas la pa ase fò.";

                }


                // ==================================================
                // EMAIL PROVIDER
                // ==================================================

                else if (
                    errorText.includes(
                        "email provider"
                    )
                ) {

                    message =
                        "Nou pa kapab voye imèl verifikasyon an kounye a. " +
                        "Tanpri eseye ankò pita.";

                }


                // ==================================================
                // OTHER SUPABASE AUTH ERRORS
                // ==================================================

                else if (
                    errorText.includes(
                        "invalid"
                    ) &&
                    errorText.includes(
                        "credentials"
                    )
                ) {

                    message =
                        "Enfòmasyon kont lan pa valid.";

                }


                // ==================================================
                // SHOW ERROR
                // ==================================================

                alert(message);


                // ==================================================
                // RESET
                // ==================================================

                isSubmitting = false;


                if (button) {

                    button.disabled = false;

                    button.textContent =
                        "Kreye Kont";

                }


            }

        }
    );


})();
