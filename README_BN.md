# Smart Business BD — Frontend Starter

React + Vite + Supabase Auth ভিত্তিক frontend।

## GitHub আপলোড
ZIP extract করে `SmartBusinessBD` ফোল্ডারের ভেতরের সব ফাইল ও `src` ফোল্ডার repository root-এ আপলোড করুন। ZIP-টি repository-তে দেবেন না।

## Vercel
Framework: Vite | Build command: `npm run build` | Output: `dist`

Environment Variables:
- `VITE_SUPABASE_URL` = Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` = Supabase publishable/anon key

কখনো `service_role` key বা database password frontend-এ দেবেন না।

## গুরুত্বপূর্ণ
এই সংস্করণে লগইন/রেজিস্ট্রেশন ও dashboard UI আছে। ডিপোজিট, উইথড্র, বিনিয়োগ, package purchase, admin approval এখন live নয়। বিদ্যমান Supabase schema, RLS policies এবং RPC signature যাচাই না করে কোনো SQL চালাবেন না বা অর্থ লেনদেন চালু করবেন না।