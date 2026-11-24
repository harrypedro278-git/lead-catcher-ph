import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(url, anon);
export type Lead = { id: string; name: string; phone: string; service: string; source: string; budget: number | null; notes: string; status: string; created_at: string; };
