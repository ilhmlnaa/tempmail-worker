# Cloudflare Turnstile

VoidMail memakai Turnstile secara adaptif pada pembuatan inbox publik. Pengguna normal tidak melihat challenge. Challenge baru diminta ketika session yang sama mencoba membuat inbox keempat dan seterusnya.

API key tidak memakai Turnstile karena sudah memiliki autentikasi dan quota sendiri.

## 1. Buat widget Turnstile

1. Buka Cloudflare Dashboard.
2. Pilih **Turnstile** → **Add widget**.
3. Tambahkan hostname production VoidMail.
4. Pilih mode **Managed**.
5. Simpan `Site Key` dan `Secret Key`.

Untuk local development, tambahkan `localhost` sebagai hostname widget atau gunakan test keys resmi Cloudflare.

## 2. Pasang site key

`TURNSTILE_SITE_KEY` boleh berada di `wrangler.toml` karena nilai ini memang dikirim ke browser:

```toml
[vars]
TURNSTILE_SITE_KEY = "0x4AAAA..."
```

Jangan menaruh secret key pada `[vars]`.

## 3. Pasang secret key

Simpan secret sebagai encrypted Worker secret:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Masukkan Secret Key ketika Wrangler meminta nilainya. Untuk environment terpisah:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --env production
```

## 4. Deploy

```bash
npm run deploy
```

Turnstile hanya aktif jika **kedua** variable tersedia. Jika salah satu belum dipasang, VoidMail tetap berjalan tanpa menampilkan challenge.

## 5. Alur request

1. Pengguna membuat sampai tiga inbox tanpa challenge.
2. Saat membuat inbox keempat, API merespons `403` dengan `requireCaptcha: true`.
3. Frontend menampilkan widget Turnstile inline.
4. Token dikirim melalui `turnstileToken` pada `POST /api/inboxes`.
5. Worker memverifikasi token melalui endpoint Siteverify Cloudflare.
6. Jika valid, pembuatan inbox dilanjutkan.

Rate limit tetap berlaku setelah challenge lolos. Turnstile bukan pengganti limit IP, session, domain, dan global.

## 6. Verifikasi

- Buat tiga inbox dari browser yang sama.
- Coba buat inbox keempat.
- Pastikan panel **Quick security check** muncul.
- Selesaikan challenge dan pastikan inbox berhasil dibuat.
- Coba kirim token kosong/langsung ke API; API harus merespons `403` ketika threshold tercapai.

## Security notes

- `TURNSTILE_SECRET_KEY` hanya dibaca server dan tidak pernah dikirim ke HTML.
- Token selalu diverifikasi server-side.
- IP dikirim ke Siteverify sebagai `remoteip` bila tersedia.
- Jika Siteverify gagal atau timeout, verifikasi ditolak.
