const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";

if (window.supabase) {

    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

    console.log("MACHEYA: Supabase client OK");

} else {

    console.error(
        "MACHEYA: Supabase library pa chaje."
    );
}
