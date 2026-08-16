// ============================================================
// MACHEYA — SUPABASE CONFIG
// ============================================================

(function () {

    "use strict";

    // ========================================================
    // SUPABASE CONNECTION
    // ========================================================

    const SUPABASE_URL =
        "https://iscktsymqntjgqaxcitv.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";


    // ========================================================
    // CHECK SUPABASE LIBRARY
    // ========================================================

    if (!window.supabase) {

        console.error(
            "MACHEYA: Bibliyotèk Supabase la pa chaje."
        );

        return;
    }


    // ========================================================
    // CREATE SUPABASE CLIENT
    // ========================================================

    const client =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    // ========================================================
    // MAKE CLIENT AVAILABLE TO ALL MACHEYA FILES
    // ========================================================

    window.supabaseClient =
        client;


    console.log(
        "MACHEYA: Supabase client pare."
    );

})();
