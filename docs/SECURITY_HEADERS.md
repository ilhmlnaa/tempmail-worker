# Transport and Browser Hardening

VoidMail menerapkan transport, browser, CORS, dan cache hardening melalui `src/security/http.ts`.

## Worker behavior

- Request HTTP diarahkan permanen (`301`) ke URL HTTPS yang sama.
- `localhost`, `127.0.0.1`, dan `[::1]` tidak diarahkan agar development lokal tetap bekerja.
- Response menerima HSTS, MIME sniffing protection, referrer policy, permissions policy, opener policy, dan clickjacking protection.
- CSP berjalan dalam mode enforce (`Content-Security-Policy`), dengan policy berbeda per jenis response.
- Seluruh `/api/*` dan `/dashboard/*` memakai `Cache-Control: no-store, private`, `Pragma: no-cache`, dan `Expires: 0`.
- POST API harus menggunakan `Content-Type: application/json`.
- Method di luar `GET`, `POST`, `DELETE`, dan `OPTIONS` ditolak dengan `405`.

## Official browser origins

Atur origin frontend yang boleh melakukan credentialed cross-origin request:

```toml
[vars]
ALLOWED_ORIGINS = "https://voidmail.my.id"
```

Beberapa origin dapat dipisahkan dengan koma:

```toml
ALLOWED_ORIGINS = "https://voidmail.my.id,https://staging.voidmail.my.id"
```

Origin yang tidak terdaftar tidak menerima `Access-Control-Allow-Origin`. Preflight dari origin tersebut ditolak dengan `403`.

Jangan memasukkan `*` karena session publik menggunakan cookie.

## Cloudflare Dashboard requirements

Worker redirect adalah lapisan aplikasi. Aktifkan juga pengaturan edge berikut:

1. **SSL/TLS mode** → `Full (strict)`.
2. **Edge Certificates** → aktifkan `Always Use HTTPS`.
3. Verifikasi semua hostname/subdomain hanya tersedia melalui HTTPS.
4. Jangan mengaktifkan HSTS preload sebelum seluruh subdomain permanen HTTPS.
5. Buat Cache Rule untuk bypass cache pada `URI Path starts with /api/`.

## CSP

CSP sudah enforce. Ada tiga policy terpisah karena response berasal dari dua lapisan berbeda:

| Response | Sumber | script-src |
| --- | --- | --- |
| SPA root, `/assets/*`, `/vendor/*` | `src/frontend/public/_headers` | `'self'` |
| Halaman `/legacy/*`, `/auth/*`, 404 | `src/security/http.ts` | `'self' 'unsafe-inline' https://challenges.cloudflare.com` |
| `/api/*`, `/dashboard/*`, `/.well-known/*` | `src/security/http.ts` | `'none'` |

`/dashboard/*` adalah API admin JSON (dimount di `src/api/routes.ts`), bukan halaman web.
Karena itu ia mendapat CSP data, `Cache-Control: no-store, private`, dan proteksi
method/content-type yang sama seperti `/api/*` — lihat `isApiPath()` di `src/security/http.ts`.

**Penting:** header dari `_headers` tidak berlaku untuk response yang dihasilkan worker, dan
sebaliknya. Root (`/`) dan `/assets/*` tidak melewati worker karena `run_worker_first` di
`wrangler.toml` hanya mencakup `/api/*`, `/auth/*`, `/dashboard/*`, dan `/legacy/*`. Karena itu
kedua file harus diubah bersamaan bila policy berubah.

Halaman legacy masih memerlukan `'unsafe-inline'` pada `script-src` karena memakai inline event
handler (`onclick`, `onchange`) dan blok `<script>` inline. Nonce tidak menyelesaikan ini karena
nonce tidak berlaku untuk atribut event handler. Untuk menghapusnya:

1. Pindahkan seluruh inline handler ke `addEventListener` pada asset same-origin.
2. Pindahkan blok `<script>` inline ke file same-origin.
3. Hapus `'unsafe-inline'` dari `script-src` di `PAGE_CSP`.

`style-src` tetap memakai `'unsafe-inline'` di semua policy karena React dan komponen UI
menyuntikkan style inline saat runtime.

Cloudflare Browser Insights tidak aktif dan beacon-nya tidak ada di HTML. Bila nanti diaktifkan,
tambahkan `https://static.cloudflareinsights.com` ke `script-src` **dan**
`https://cloudflareinsights.com` ke `connect-src`, karena beacon mengirim POST ke
`/cdn-cgi/rum`. Menambah `script-src` saja tidak cukup.

## Verification

```bash
curl -I http://voidmail.my.id/
curl -I https://voidmail.my.id/
curl -i -X OPTIONS https://voidmail.my.id/api/session \
  -H "Origin: https://voidmail.my.id" \
  -H "Access-Control-Request-Method: GET"
curl -i -X PUT https://voidmail.my.id/api/session
curl -i -X POST https://voidmail.my.id/api/inboxes \
  -H "Content-Type: text/plain" \
  --data '{}'
curl -sI https://voidmail.my.id/ | grep -i content-security-policy
curl -sI https://voidmail.my.id/legacy | grep -i content-security-policy
curl -sI https://voidmail.my.id/dashboard/inboxes | grep -i cache-control
```

Expected results:

- HTTP → `301` dengan lokasi HTTPS.
- HTTPS → security headers tersedia.
- Preflight origin resmi → `204`.
- `PUT` → `405` dan header `Allow`.
- POST non-JSON → `415`.
- Root dan `/legacy` sama-sama mengembalikan `Content-Security-Policy` (bukan report-only).
- `/dashboard/*` mengembalikan `Cache-Control: no-store, private`.
