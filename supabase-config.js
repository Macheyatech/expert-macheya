// ============================================================
// MACHEYA — SUPABASE CONFIGURATION
// VÈSYON FINAL
// ============================================================

const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";

if (!window.supabase) {
    console.error("Supabase JS pa chaje.");
} else {

    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

    console.log(
        "Macheya: Supabase konekte avèk siksè."
    );
}
