# Security Reporting

VoidMail exposes `/.well-known/security.txt` only after a monitored security contact is configured.

## Configure

Set a contact address that is actively monitored:

```toml
[vars]
SECURITY_CONTACT = "mailto:security@example.com"
SECURITY_POLICY_URL = "https://voidmail.my.id/security"
```

Deploy afterward:

```bash
npm run deploy
```

Verify:

```bash
curl https://voidmail.my.id/.well-known/security.txt
```

The generated file includes `Contact`, `Preferred-Languages`, `Canonical`, optional `Policy`, and a rolling one-year `Expires` value.

## Logging

Security events use JSON logs under the `SECURITY` level. Logs intentionally exclude request bodies, email content, cookies, authorization values, and API keys. Review logs through Cloudflare Workers Observability and define alert thresholds for repeated rate limiting or unauthorized access.
