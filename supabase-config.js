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
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY2t0c3ltcW50amdxYXhjaXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNDU5NDAsImV4cCI6MjEwMTgyMTk0MH0.cIu9QxDD2Y7OWwCadf8_6PkIBvxU3KmzA2pYECtu51I";


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


    // ========================================================
    // VERIFY CONNECTION (optional safety check)
    // ========================================================

    client.auth.getSession().then(function (result) {
        if (result.error) {
            console.error(
                "MACHEYA: Erè koneksyon Supabase:",
                result.error
            );
        } else {
            console.log(
                "MACHEYA: Supabase client pare."
            );
        }
    });

})();
