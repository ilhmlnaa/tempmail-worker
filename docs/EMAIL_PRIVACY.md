# Email Rendering Privacy and ImgCDN

VoidMail sanitizes email HTML on the Worker before it is returned to a browser. Raw email HTML remains stored in D1, but it is never sent directly through the public messages endpoint.

## Default behavior

- Scripts, forms, nested frames, objects, embeds, metadata, base tags, stylesheets, and active media are removed.
- Inline event handlers and CSS `url(...)` values are removed.
- Unsafe URL schemes (`javascript:`, `vbscript:`, and `data:text/html`) are blocked.
- Links open in a new tab with `rel="noopener noreferrer"`.
- External images are blocked by default.
- Email HTML is rendered in an iframe with a restrictive CSP, `sandbox="allow-same-origin allow-popups"`, and `referrerpolicy="no-referrer"`.

The reader displays **Load images via ImgCDN** only when images were blocked. It requests the same message with `?images=proxy`; image URLs are rewritten server-side to ImgCDN. The source image URL is never placed in the browser DOM.

## Configuration

Set the ImgCDN base URL in `wrangler.toml`:

```toml
[vars]
IMGCDN_BASE_URL = "https://imgcdn.arm.hamdiv.me"
```

The default is `https://imgcdn.arm.hamdiv.me` for compatibility with the URL format specified in the security audit:

```text
/insecure/size:1920:0/resizing_type:fit/quality:85/sharpen:0.5/<base64url-source>.webp
```

`IMGCDN_BASE_URL` is public configuration; do not place a signing secret in it. The current endpoint format is `insecure`, so it does not prevent third parties from constructing their own proxy URLs.

## Required ImgCDN-side controls

VoidMail validates source URLs before creating an ImgCDN URL: HTTPS only, no localhost, no private/loopback IPv4 ranges, and no cloud metadata IP. ImgCDN must still independently enforce all of the following because it is the service that fetches the remote resource:

- validate DNS resolution and every redirect against private/internal networks;
- maximum 2 redirects, 10-second total timeout, and 5 MB source limit;
- allow only JPEG, PNG, GIF, WebP, and AVIF after magic-byte inspection;
- reject original SVG;
- strip EXIF/metadata and do not forward cookies, authorization, or user referrer;
- cache successful images and rate limit proxy requests;
- migrate from `/insecure/` to server-generated signed URLs before allowing broad production use.

## Verification

1. Send an HTML email containing an external `<img src="https://example.com/tracker.png">`.
2. Open it normally: no direct request should go to `example.com`.
3. Confirm the privacy banner is visible.
4. Click **Load images via ImgCDN**.
5. Confirm the image request goes only to `IMGCDN_BASE_URL`, not directly to the sender.
6. Confirm an image URL targeting `https://127.0.0.1/...` remains blocked.
