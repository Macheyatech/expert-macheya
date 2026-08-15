// ============================================================
// MACHEYA — SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "METE_MENM_PUBLISHABLE_KEY_OU_TE_GENYEN_AN_ISIT";

// ============================================================
// VERIFY SUPABASE LIBRARY
// ============================================================

if (!window.supabase) {

    console.error(
        "Macheya: Supabase JS pa chaje."
    );

} else {

    // Kreye kliyan Supabase
    const supabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );


    // Kenbe l disponib globalman tou
    window.supabaseClient =
        supabase;


    // Export pou fichye JS ki itilize import
    console.log(
        "Macheya: Supabase konekte avèk siksè."
    );


    // Export la fèt anba a
    window.macheyaSupabase =
        supabase;
}


// ============================================================
// EXPORT
// ============================================================

export const supabase =
    window.macheyaSupabase;
