# Transport and Browser Hardening

VoidMail menerapkan transport, browser, CORS, dan cache hardening melalui `src/security/http.ts`.

## Worker behavior

- Request HTTP diarahkan permanen (`301`) ke URL HTTPS yang sama.
- `localhost`, `127.0.0.1`, dan `[::1]` tidak diarahkan agar development lokal tetap bekerja.
- Response menerima HSTS, MIME sniffing protection, referrer policy, permissions policy, opener policy, dan clickjacking protection.
- CSP berjalan dalam mode `Content-Security-Policy-Report-Only` selama resource eksternal dan inline script masih digunakan.
- Seluruh `/api/*` memakai `Cache-Control: no-store, private`, `Pragma: no-cache`, dan `Expires: 0`.
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

## CSP rollout

CSP saat ini masih report-only karena halaman menggunakan:

- inline script/style;
- Lucide dari `unpkg.com`;
- Google Fonts;
- Cloudflare Turnstile.

Sebelum enforcement:

1. Bundle Lucide dan dependency frontend lainnya.
2. Pindahkan inline script/style ke asset same-origin atau gunakan nonce.
3. Pantau CSP violation pada browser/endpoint reporting.
4. Perbaiki violation yang valid.
5. Ganti `Content-Security-Policy-Report-Only` menjadi `Content-Security-Policy`.

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
```

Expected results:

- HTTP → `301` dengan lokasi HTTPS.
- HTTPS → security headers tersedia.
- Preflight origin resmi → `204`.
- `PUT` → `405` dan header `Allow`.
- POST non-JSON → `415`.
