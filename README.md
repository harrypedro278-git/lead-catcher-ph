# Lead Catcher PH V2 - Vercel + Supabase (Option B - TUNAY na Automatic)

## Ano to?
Next.js + Supabase version. Lead mag-fill up sa phone niya -> 2 seconds later, nasa dashboard mo na. Real-time.

## Step 1: Supabase (5 mins, LIBRE)
1. Pumunta sa supabase.com > Sign up (libre) > New Project
2. Hintayin matapos mag-setup (2 mins)
3. Sa left menu: SQL Editor > New Query
4. I-copy lahat ng laman ng `supabase.sql` sa repo na to, i-paste, click Run
5. Sa left menu: Settings > API
6. Copy mo: Project URL + anon public key

## Step 2: Vercel (3 mins)
1. I-upload tong folder sa GitHub (New Repo)
   OR sa vercel.com/new > Upload
2. Sa Vercel > New Project > Import mo yung repo
3. Bago ka mag-Deploy, punta ka sa Environment Variables:
   - Key: NEXT_PUBLIC_SUPABASE_URL | Value: https://YOUR-PROJECT.supabase.co
   - Key: NEXT_PUBLIC_SUPABASE_ANON_KEY | Value: YOUR-ANON-KEY
4. Click Deploy

## Step 3: Test mo
1. Dashboard: https://YOUR-APP.vercel.app/ -> PIN: 1234
2. Customer Form: https://YOUR-APP.vercel.app/?view=inquire
3. Buksan mo pareho sa 2 tabs. Sa Form tab, mag-fill up ka ng test lead.
4. Sa Dashboard tab, dapat biglang lilitaw yung bagong lead WITHOUT refresh (realtime). May badge "Galing sa Form".

## Step 4: Gamitin mo na
- Ilagay yung ?view=inquire link sa FB Bio, TikTok Bio, Messenger auto-reply
- Palitan PIN: Sa dashboard footer > Palitan PIN

## Kung may error na "Failed to fetch" / blank page
99% kulang yung 2 Environment Variables sa Vercel. Check mo:
Vercel > Project > Settings > Environment Variables > dapat may 2 keys. Tapos Redeploy: Deployments > ... > Redeploy.

## Gastos
Vercel Hobby: Libre
Supabase Free: Libre - hanggang 500k leads, sobra-sobra na for 50/day.
Total: P0 / month.
