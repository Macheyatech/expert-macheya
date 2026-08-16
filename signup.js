// ============================================================
// MACHEYA — SIGNUP.JS
// ============================================================

(function () {

    "use strict";

    const SUPABASE_URL =
        "https://iscktsymqntjgqaxcitv.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


    // ========================================================
    // SUPABASE
    // ========================================================

    const script =
        document.createElement("script");

    script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


    script.onload = function () {

        const supabase =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );


        window.supabaseClient =
            supabase;


        // ====================================================
        // FORM
        // ====================================================

        const form =
            document.getElementById("signupForm");


        if (!form) {

            console.error(
                "MACHEYA: signupForm introuvable."
            );

            return;
        }


        // ====================================================
        // SHOW / HIDE PASSWORD
        // ====================================================

        document
            .querySelectorAll(".show-password")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const input =
                            document.getElementById(
                                button.dataset.target
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


        // ====================================================
        // SIGNUP
        // ====================================================

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


                if (email !== confirmEmail) {

                    alert(
                        "De imèl yo pa menm."
                    );

                    return;
                }


                if (password.length < 6) {

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
                        "Tanpri chwazi si kont lan se pou Achtè oswa Vandè."
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


                    const user =
                        data?.user;


                    if (!user) {

                        throw new Error(
                            "Kont lan pa t ka kreye."
                        );

                    }


                    console.log(
                        "MACHEYA SIGNUP USER:",
                        user.id
                    );


                    // ==================================================
                    // SAVE LOCALLY
                    // ==================================================

                    localStorage.setItem(
                        "macheyaUserId",
                        user.id
                    );


                    localStorage.setItem(
                        "macheyaUserName",
                        name
                    );


                    localStorage.setItem(
                        "macheyaUserRole",
                        role
                    );


                    // ==================================================
                    // TRY CREATE PROFILE
                    //
                    // Si RLS pèmèt li, profile la kreye touswit.
                    // Si email confirmation aktive epi pa gen session,
                    // dashboard/login ap toujou itilize metadata a.
                    // ==================================================

                    const {
                        error: profileError
                    } =
                        await supabase
                            .from("profiles")
                            .upsert(
                                {
                                    id: user.id,

                                    name: name,

                                    role: role

                                },
                                {
                                    onConflict: "id"
                                }
                            );


                    if (profileError) {

                        console.warn(
                            "MACHEYA: Profile pa t kreye touswit:",
                            profileError.message
                        );

                    } else {

                        console.log(
                            "MACHEYA: Profile kreye."
                        );

                    }


                    // ==================================================
                    // SESSION EXISTS
                    // ==================================================

                    if (data.session) {

                        alert(
                            "Kont ou kreye avèk siksè!"
                        );

                        window.location.href =
                            "dashboard.html";

                        return;
                    }


                    // ==================================================
                    // EMAIL CONFIRMATION
                    // ==================================================

                    alert(
                        "Kont ou kreye avèk siksè! Verifye imèl ou pou aktive kont lan."
                    );


                    window.location.href =
                        "login.html";


                } catch (error) {

                    console.error(
                        "MACHEYA SIGNUP ERROR:",
                        error
                    );


                    let message =
                        "Yon erè rive pandan kreyasyon kont lan.";


                    if (
                        error.message
                    ) {

                        message =
                            error.message;
                    }


                    alert(message);


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

    };


    // ========================================================
    // SCRIPT ERROR
    // ========================================================

    script.onerror =
        function () {

            alert(
                "Macheya pa kapab konekte ak sèvis la kounye a."
            );

        };


    document.head.appendChild(
        script
    );

})();
