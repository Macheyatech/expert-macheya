// ============================================================
// MACHEYA — SUPABASE CONFIG
// ============================================================

const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


// Verify Supabase library
if (!window.supabase) {

    console.error(
        "Macheya: Supabase library pa chaje."
    );

} else {

    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

    console.log(
        "Macheya: Supabase client pare."
    );
}
