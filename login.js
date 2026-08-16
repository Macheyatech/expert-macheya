const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


const script = document.createElement("script");

script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


script.onload = () => {

    const supabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    const form =
        document.getElementById("loginForm");


    if (!form) {
        console.error("loginForm introuvable.");
        return;
    }


    /* =========================
       AFFICHER / CACHER MODPAS
    ========================= */

    document
        .querySelectorAll(".show-password")
        .forEach(button => {

            button.addEventListener("click", () => {

                const input =
                    document.getElementById(
                        button.dataset.target
                    );

                if (!input) return;

                if (input.type === "password") {

                    input.type = "text";
                    button.textContent = "🙈";

                } else {

                    input.type = "password";
                    button.textContent = "👁️";

                }

            });

        });


    /* =========================
       CONNEXION
    ========================= */

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;


            if (!email || !password) {

                alert(
                    "Veuillez remplir votre e-mail et votre mot de passe."
                );

                return;
            }


            const button =
                document.getElementById(
                    "loginButton"
                );


            if (button) {

                button.disabled = true;

                button.textContent =
                    "Connexion...";

            }


            try {

                /* =========================
                   SUPABASE AUTH
                ========================= */

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


                if (!data.user) {

                    throw new Error(
                        "Impossible de récupérer votre compte."
                    );

                }


                const userId =
                    data.user.id;


                /* =========================
                   RÉCUPÉRER LE PROFIL
                ========================= */

                const {
                    data: profile,
                    error: profileError
                } =
                    await supabase
                        .from("profiles")
                        .select(
                            "name, role"
                        )
                        .eq(
                            "id",
                            userId
                        )
                        .single();


                if (profileError) {

                    console.error(
                        "Erreur profil:",
                        profileError
                    );

                    throw new Error(
                        "Nou pa kapab jwenn kalite kont ou."
                    );

                }


                if (!profile) {

                    throw new Error(
                        "Pwofil kont ou pa egziste."
                    );

                }


                /* =========================
                   RÉCUPÉRER ROLE
                ========================= */

                const role =
                    String(
                        profile.role || ""
                    )
                    .trim()
                    .toLowerCase();


                console.log(
                    "Macheya — Role:",
                    role
                );


                /* =========================
                   STOCKER INFOS
                ========================= */

                localStorage.setItem(
                    "macheyaUserName",
                    profile.name || ""
                );


                localStorage.setItem(
                    "macheyaUserRole",
                    role
                );


                localStorage.setItem(
                    "macheyaUserId",
                    userId
                );


                /* =========================
                   REDIRECTION SELON ROLE
                ========================= */

                alert(
                    "Connexion réussie !"
                );


                /* ACHETÈ */

                if (
                    role === "acheteur" ||
                    role === "achete" ||
                    role === "buyer"
                ) {

                    window.location.href =
                        "buyer.html";

                    return;
                }


                /* VANDÈ */

                if (
                    role === "vendeur" ||
                    role === "vendeur" ||
                    role === "seller"
                ) {

                    window.location.href =
                        "dashboard.html";

                    return;
                }


                /* ROLE PA REKONÈT */

                throw new Error(
                    "Kalite kont sa a pa rekonèt: " +
                    role
                );


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                let message =
                    "Une erreur est survenue lors de la connexion.";


                if (
                    error.message &&
                    error.message
                        .toLowerCase()
                        .includes(
                            "invalid login"
                        )
                ) {

                    message =
                        "E-mail ou mot de passe incorrect.";

                }

                else if (
                    error.message &&
                    error.message
                        .toLowerCase()
                        .includes(
                            "email not confirmed"
                        )
                ) {

                    message =
                        "Veuillez d'abord confirmer votre adresse e-mail.";

                }

                else if (
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
                        "Konekte";

                }

            }

        }
    );


    /* =========================
       MODPAS BLIYE
    ========================= */

    const forgotPassword =
        document.getElementById(
            "forgotPassword"
        );


    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();


                const email =
                    document
                        .getElementById("email")
                        .value
                        .trim();


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
                                        "https://macheya-ayti.vercel.app/login.html"
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
                        error
                    );


                    alert(
                        error.message ||
                        "Nou pa t kapab voye lyen an."
                    );

                }

            }
        );

    }

};


script.onerror = () => {

    alert(
        "Macheya pa kapab konekte ak sèvis la kounye a."
    );

};


document.head.appendChild(script);
