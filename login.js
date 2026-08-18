// ============================================================
// MACHEYA — LOGIN.JS
// ============================================================

(function () {

    "use strict";

    console.log("MACHEYA: login.js ap demare...");

    const supabase = window.supabaseClient;

    if (!supabase) {
        alert("Macheya pa kapab konekte ak sèvis la kounye a.");
        console.error("MACHEYA: supabaseClient pa disponib.");
        return;
    }

    const form = document.getElementById("loginForm");

    if (!form) {
        console.error("MACHEYA: loginForm pa jwenn.");
        return;
    }

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("loginButton");


    // ========================================================
    // JE — MONTRE / KACHE MODPAS
    // ========================================================

    document.querySelectorAll(".show-password").forEach(function (button) {

        button.addEventListener("click", function () {

            const target = document.getElementById(
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

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Tanpri antre imèl ou ak modpas ou.");
            return;
        }

        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = "Koneksyon...";
        }

        try {

            // ==================================================
            // 1. KONEKTE AK SUPABASE AUTH
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
                throw new Error("Macheya pa jwenn itilizatè a.");
            }

            console.log(
                "MACHEYA: Auth reyisi:",
                user.id
            );


            // ==================================================
            // 2. CHÈCHE PROFILE
            // ==================================================

            let { data: profile, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .maybeSingle();


            // ==================================================
            // 3. SI PROFILE PA EGZISTE
            // ==================================================

            if (!profile && !profileError) {

                console.log(
                    "MACHEYA: Profile pa egziste. N ap kreye li..."
                );

                const metadata = user.user_metadata || {};

                const name =
                    metadata.name ||
                    metadata.nom_complet ||
                    "";

                const phone =
                    metadata.phone ||
                    metadata.telephone ||
                    "";

                const role =
                    String(
                        metadata.role || "acheteur"
                    )
                    .trim()
                    .toLowerCase();


                const { data: newProfile, error: createError } =
                    await supabase
                        .from("profiles")
                        .insert({

                            id: user.id,

                            nom_complet: name,

                            telephone: phone,

                            role: role,

                            est_acheteur:
                                role === "acheteur",

                            est_vendeur:
                                role === "vendeur"

                        })
                        .select()
                        .single();


                if (createError) {

                    console.error(
                        "MACHEYA: Erè kreyasyon profile:",
                        createError
                    );

                    throw new Error(
                        "Kont lan konekte, men pwofil Macheya a pa kapab kreye."
                    );
                }

                profile = newProfile;

                console.log(
                    "MACHEYA: Profile kreye.",
                    profile
                );
            }


            // ==================================================
            // 4. SI GEN YON ERÈ LÈ N AP LI PROFILE
            // ==================================================

            if (profileError) {

                console.error(
                    "MACHEYA PROFILE ERROR:",
                    profileError
                );

                throw new Error(
                    "Macheya pa kapab li pwofil kont lan."
                );
            }


            if (!profile) {

                throw new Error(
                    "Macheya pa jwenn pwofil kont lan."
                );
            }


            // ==================================================
            // 5. DETÈMINE ROLE
            // ==================================================

            const role =
                String(profile.role || "")
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


            // Si pa gen role, nou konsidere l kòm achtè
            if (!isBuyer && !isSeller) {

                console.warn(
                    "MACHEYA: Role pa defini. Achtè ap itilize kòm default."
                );

                window.location.href = "dashboard.html";
                return;
            }


            // ==================================================
            // 6. KONEKSYON REYISI
            // ==================================================

            console.log(
                "MACHEYA: Koneksyon reyisi.",
                role
            );


            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                "MACHEYA LOGIN ERROR:",
                error
            );


            const errorText =
                String(error?.message || "")
                    .toLowerCase();


            let message =
                "Yon erè rive pandan koneksyon an.";


            if (
                errorText.includes("invalid login credentials")
            ) {

                message =
                    "Imèl oswa modpas la pa kòrèk.";

            } else if (
                errorText.includes("email not confirmed")
            ) {

                message =
                    "Tanpri verifye imèl ou anvan ou konekte.";

            } else {

                message =
                    error?.message ||
                    message;
            }


            alert(message);


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
                        await supabase.auth.resetPasswordForEmail(
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
