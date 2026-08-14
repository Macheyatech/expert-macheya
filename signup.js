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
        document.getElementById("signupForm");


    if (!form) {
        console.error("signupForm introuvable.");
        return;
    }


    document.querySelectorAll(".show-password").forEach(button => {

        button.addEventListener("click", () => {

            const input =
                document.getElementById(
                    button.dataset.target
                );

            if (input.type === "password") {

                input.type = "text";
                button.textContent = "🙈";

            } else {

                input.type = "password";
                button.textContent = "👁️";
            }

        });

    });


    form.addEventListener("submit", async (event) => {

        event.preventDefault();


        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const confirmEmail =
            document.getElementById("confirmEmail").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const role =
            document.getElementById("role").value;


        if (
            !name ||
            !email ||
            !confirmEmail ||
            !password ||
            !confirmPassword ||
            !role
        ) {

            alert("Tanpri ranpli tout chan obligatwa yo.");
            return;
        }


        if (email !== confirmEmail) {

            alert("De imèl yo pa menm.");
            return;
        }


        if (password.length < 6) {

            alert(
                "Modpas la dwe gen omwen 6 karaktè."
            );

            return;
        }


        if (password !== confirmPassword) {

            alert("De modpas yo pa menm.");
            return;
        }


        const button =
            form.querySelector(
                "button[type='submit']"
            );


        if (button) {

            button.disabled = true;
            button.textContent =
                "Kreyasyon kont...";
        }


        try {

            const { data, error } =
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


            if (!data.user) {

                throw new Error(
                    "Kont lan pa t ka kreye."
                );

            }


            if (data.session) {

                const { error: profileError } =
                    await supabase
                        .from("profiles")
                        .insert({

                            id: data.user.id,

                            name: name,

                            role: role

                        });


                if (profileError) {

                    throw profileError;
                }


                alert(
                    "Kont ou kreye avèk siksè!"
                );

                window.location.href =
                    "login.html";

            } else {

                alert(
                    "Kont lan kreye. Verifye imèl ou pou aktive kont lan."
                );

                window.location.href =
                    "login.html";
            }


        } catch (error) {

            console.error(
                "Signup error:",
                error
            );

            alert(
                error.message ||
                "Yon erè rive pandan kreyasyon kont lan."
            );


        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "Kreye Kont";
            }

        }

    });

};


script.onerror = () => {

    alert(
        "Macheya pa kapab konekte ak sèvis la kounye a."
    );

};


document.head.appendChild(script);
