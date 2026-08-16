// ============================================================
// MACHEYA — LOGIN.JS
// ============================================================

(function () {

    "use strict";

    console.log("MACHEYA: login.js ap demare...");


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
        document.getElementById("loginForm");


    if (!form) {

        console.error(
            "MACHEYA: loginForm pa jwenn."
        );

        return;
    }


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


    // ========================================================
    // LOGIN
    // ========================================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById("password")
                    .value;


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


                // ==================================================
                // AUTH LOGIN
                // ==================================================

                console.log(
                    "MACHEYA: N ap verifye kont lan..."
                );


                const {
                    data: authData,
                    error: authError
                } =
                    await supabase.auth
                        .signInWithPassword({

                            email:
                                email,

                            password:
                                password

                        });


                if (authError) {
                    throw authError;
                }


                const user =
                    authData?.user;


                if (!user) {

                    throw new Error(
                        "Macheya pa kapab jwenn kont ou."
                    );

                }


                console.log(
                    "MACHEYA: User konekte:",
                    user.id
                );


                // ==================================================
                // GET PROFILE
                // ==================================================

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
                        "Kont lan konekte, men nou pa kapab jwenn pwofil li."
                    );
                }


                // ==================================================
                // PROFILE NOT FOUND
                // ==================================================

                if (!profile) {

                    throw new Error(
                        "Kont lan konekte, men pwofil Macheya a pa egziste."
                    );
                }


                console.log(
                    "MACHEYA PROFILE:",
                    profile
                );


                // ==================================================
                // VERIFY ROLE
                // ==================================================

                const role =
                    String(
                        profile.role || ""
                    )
                        .trim()
                        .toLowerCase();


                const isBuyer =
                    role === "acheteur" &&
                    profile.est_acheteur === true;


                const isSeller =
                    role === "vendeur" &&
                    profile.est_vendeur === true;


                if (
                    !isBuyer &&
                    !isSeller
                ) {

                    throw new Error(
                        "Pwofil ou pa gen yon kalite kont Macheya valab."
                    );
                }


                // ==================================================
                // SUCCESS
                // ==================================================

                console.log(
                    "MACHEYA ROLE:",
                    role
                );


                alert(
                    "Koneksyon reyisi!"
                );


                // ==================================================
                // DASHBOARD
                // ==================================================

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


                alert(
                    message
                );


            } finally {


                // ==================================================
                // RESET BUTTON
                // ==================================================

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
                    document
                        .getElementById("email")
                        .value
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
