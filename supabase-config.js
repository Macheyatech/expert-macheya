const SUPABASE_URL =
    "https://iscktsymqntjgqaxcitv.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_fvlSCK0gmNtIMQApA3Y-gw_e9ja75GW";

const { createClient } = supabase;

window.supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
