Type: task
Status: open

## Question

Provisioning, not a decision: create a Telegram bot via @BotFather, get its bot token, and get your personal chat ID (e.g. by messaging the bot once and reading the `getUpdates` response). This needs doing before the alert-pipeline design can be tested end-to-end. Resolution should record: where the token/chat ID get stored (GitHub Actions secrets), not the values themselves.
