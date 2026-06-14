# Trae Preflight

This folder is prepared for `wangxt-1006-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18306
- API_PORT: 19306
- WEB_PORT: 20306
- DB_PORT: 21306
- REDIS_PORT: 22306

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
