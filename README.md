# MARK FASHION — Apparel Portfolio & Inquiry Website

A responsive Next.js + Supabase project based on the supplied MARK FASHION company profile.

## Features

- Product catalogue for T-shirts, polos, jerseys and printing styles.
- Fabric selection: Plain Polyester (PP), Box Knit, Jacquard, Marc, Selina and Dot Knit.
- GSM options: 160, 180, 200, 210 and 220.
- Per-item colour, size, quantity, printing and notes.
- Persistent browser inquiry cart. No payments or checkout.
- Customer email/password registration and login required for inquiry submission.
- Inquiry storage, private artwork uploads, status tracking.
- Role-restricted admin dashboard: product create/edit/delete, prices, images, visibility and inquiry status.
- Row-level security (RLS) enforced by Supabase, not by hidden UI controls.

## Run locally

1. Install Node.js 20+.
2. Run `npm install`.
3. Create a Supabase project. In its SQL Editor, run `supabase/schema.sql` **once** on a fresh project. Running it again will duplicate seeded products and may produce policy-already-exists errors.
4. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase publishable/anon key, **not** service role).
5. Enable email authentication in Supabase Authentication settings. Configure the Site URL and redirect URLs for your local and deployed domains. Configure SMTP/email confirmation for production.
6. Run `npm run dev` and open http://localhost:3000.
7. Register the manufacturer account through the website, then promote that account **manually in the Supabase SQL Editor** using the commented query at the bottom of `supabase/schema.sql`. Log out and log in again. Only that role can access the admin dashboard.
8. Deploy to Vercel (or another Next.js host) and set the same environment variables. Add the production URL to Supabase Auth settings.

## Preview without Supabase

The catalogue and cart work without database configuration, using the sample items and local browser storage. **Login, sending inquiries and admin changes are intentionally unavailable until Supabase is connected.** No insecure demo admin credentials are provided.

## Operational notes

- Indicative prices are blank because the company profile did not provide pricing. The admin can set them; all prices remain subject to quotation.
- The PDF's product pictures are used as cropped catalogue images. These are catalogue examples, not claims of current inventory.
- Fabric swatches in the interface are decorative CSS approximations; confirm fabric against actual samples.
- The PDF did not provide verified manufacturer contact details, so inquiries are stored in the admin dashboard rather than emailed to an invented address. To add email notifications, integrate a transactional email provider through a secure server-side function.
- Artwork is stored in a private Supabase bucket and viewed via short-lived signed URLs.
- Customer email is not duplicated in the inquiry record; admin sees the contact name and phone and a user ID. Add a secure server-side admin lookup if email is required.
- Before production, add legal pages, privacy/retention policies, anti-spam/rate limiting, notification delivery, monitoring, backups and testing.

## Authentication upgrade — Email + Google + Phone OTP

The login modal supports email/password authentication and Google OAuth; mobile SMS OTP has been removed. All use Supabase Auth, so existing `profiles` and RLS continue to work. The inquiry form still requires a customer contact phone number. After successful submission, a confirmation dialog displays MARK FASHION contact number +91 97905 90980 and a WhatsApp link.

### Google

1. In Google Cloud Console, create an OAuth consent screen and a **Web application** OAuth client.
2. In Google Cloud, add the Supabase callback URI shown in **Supabase Dashboard → Authentication → Providers → Google** as an authorized redirect URI (typically `https://PROJECT_REF.supabase.co/auth/v1/callback`). Do not confuse this with the website URL.
3. Copy Google Client ID and Client Secret into the Supabase Google provider configuration; enable it.
4. In Supabase **Authentication → URL Configuration**, set the site URL and add `http://localhost:3000/**` and your deployed `https://yourdomain.example/**` to allowed redirect URLs.
5. The app calls `signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}})`; Google OAuth credentials must **never** be added to public Next.js environment variables.

### Phone SMS OTP

1. In Supabase **Authentication → Providers → Phone**, enable phone sign-in and configure a supported SMS provider (such as Twilio). SMS messages incur provider charges. Configure SMS sender/templates and region restrictions in your provider/Supabase dashboard.
2. Use E.164 numbers (e.g. `+919876543210`). The app calls `signInWithOtp({phone})` and `verifyOtp({phone,token,type:'sms'})`.
3. Set OTP expiry, rate limits and CAPTCHA/abuse protections in Supabase. Use real devices for testing; do not rely on test OTPs in production.
4. **Account linking:** A user signing in with Google, phone and email may end up with separate accounts unless identities are explicitly linked. Plan and test secure identity linking before relying on a unified inquiry history. Never merge accounts solely by matching a user-entered phone/email.

### Manufacturer-branded authentication emails (not Supabase sender)

Supabase Auth still sends authentication emails, but **your own SMTP service and domain** can send them with MARK FASHION branding. Purchase/verify a domain (example only: `markfashion.example`), create `accounts@your-real-domain`, and configure **Supabase → Authentication → SMTP Settings** with your SMTP host, port, username, password, sender email and sender name `MARK FASHION`. Set up SPF, DKIM and DMARC DNS records per your email provider. In **Authentication → Email Templates**, customize Confirm signup, Magic Link, Reset Password, Change Email and Invite templates using the provider-supported confirmation URL variables (for example `{{ .ConfirmationURL }}`). Do not replace the actual verification link with an ordinary website link. Keep SMTP passwords server-side in Supabase only. Test delivery to Gmail and other inboxes.

Example confirmation email subject: `Confirm your MARK FASHION account`.
Example HTML body:

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#173f35">
  <h1>MARK FASHION</h1>
  <p>Welcome! Confirm your email to manage your custom apparel inquiries.</p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 20px;background:#173f35;color:#fff;text-decoration:none;border-radius:6px">Confirm email</a>
  <p>If you did not create an account, ignore this email.</p>
</div>
```

This customizes the **sender and content**, not the underlying Supabase Auth system. If you require fully independent email authentication delivery, that needs a custom auth backend and additional security work.

### Create manufacturer admin account

1. Register normally with the manufacturer's verified email address; confirm it and sign in. Prefer email/password or Google for admin, and enable MFA in Supabase when available. **Do not publish or hardcode admin passwords.**
2. Open **Supabase → SQL Editor** and execute the following, replacing the placeholder with the actual registered admin email:

```sql
select id,email from auth.users where email='owner@your-real-domain';
update public.profiles set role='admin'
where id=(select id from auth.users where email='owner@your-real-domain');
select p.id,p.role,u.email from public.profiles p
join auth.users u on u.id=p.id where u.email='owner@your-real-domain';
```

3. Log out and back in. The settings icon opens the admin dashboard. The database's RLS checks the admin role independently of the UI. Never allow a customer-facing form to set `profiles.role='admin'`.
4. To revoke access: `update public.profiles set role='customer' where id=(select id from auth.users where email='owner@your-real-domain');` and revoke active sessions if needed.

**Security note:** The existing schema protects admin operations via RLS. In production, review policies, authentication rate limits, SMS fraud controls, admin MFA, and audit logs. For extra hardening, require a server-verified admin session/MFA assurance level before sensitive mutations.

### Optional features to choose from

- **A. Email notifications** to manufacturer on new inquiry, using a server-side transactional email service and a database webhook/Edge Function; avoid sending email from the browser.
- **B. Customer inquiry history** with status tracking, quotes and reorders.
- **C. Admin quotation builder** to attach per-line price, tax, shipping and estimated lead time, without online payments.
- **D. WhatsApp notifications** through the official WhatsApp Business API with opt-in and approved templates.
- **E. Size breakdown table** for quantities by XS/S/M/L/XL/XXL instead of free text.
- **F. Artwork proof approval** where customers review and approve final designs.
- **G. Minimum order quantities and tiered bulk pricing**, configurable by admin.
- **H. Inventory/fabric availability** and per-product manufacturing lead times.
- **I. Multilingual storefront** (English/Tamil) and accessibility improvements.
- **J. Admin MFA, audit trail, CAPTCHA and abuse controls** (recommended before launch).


## Recent updates
- Site footer displays +91 97905 90980 with call and WhatsApp links.
- Signed-in customers can use **My Orders** to see their own previous inquiries, item specifications, dates and statuses. This uses the existing `inquiries` table and its customer-owned row-level security policy. No schema migration is required for this feature.
- Fabric library now uses six actual fabric sample photographs cropped from page 3 of `MARK_FASHION_final.pdf` (supplied by the project owner), replacing generated textures.
- Product image framing uses `object-fit: contain` so shirts sit comfortably above the card text instead of being enlarged/cropped.
- These are quotation inquiries, not paid orders.
