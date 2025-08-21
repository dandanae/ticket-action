## `Setting` → `Secrets and variables` → `Actions`

- `COOKIE`
- `DISCORD_ID`
- `DISCORD_LOG_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`

## github action

snippets → `ta`

```yml
name: example
on:
  schedule:
    - cron: "*/5 * * * *"
  workflow_dispatch: {}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: check
        uses: dandanae/ticket-action@main
        with:
          product-id: 000000
          schedule-id: 100001 # 100001, 100002, 100003…
          discord-id: ${{ secrets.DISCORD_ID }}
          discord-webhook-url: ${{ secrets.DISCORD_WEBHOOK_URL }}
          discord-log-webhook-url: ${{ secrets.DISCORD_LOG_WEBHOOK_URL }}
          cookie: ${{ secrets.COOKIE }}
```

## 참고

[melon-ticket-actions](https://github.com/mooyoul/melon-ticket-actions)

[melon-ticket-alert](https://github.com/ldy9037/melon-ticket-alert)
