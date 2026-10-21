import {createClient, SupabaseClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const configured=!!(url&&key&&!url.includes('YOUR-PROJECT'));
export const supabase:SupabaseClient|null=configured?createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
