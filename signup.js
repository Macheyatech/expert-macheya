const SUPABASE_URL = "https://iscktsymqntjgqaxcitv.supabase.co";
const SUPABASE_KEY = "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";

const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

script.onload = () => {
    const supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    const form = document.getElementById("signupForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        if (!name || !email || !password || !role) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        if (password.length < 6) {
            alert("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) throw error;

            const user = data.user;

            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: user.id,
                    name: name,
                    role: role
                });

            if (profileError) throw profileError;

            alert("Compte créé avec succès !");

            window.location.href = "login.html";

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });
};

document.head.appendChild(script);
