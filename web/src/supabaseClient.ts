import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yqystwfszetkbhwggzrv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Z_w1EUQzWNsBV-KQpXMKYg_yRq-anmn";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);