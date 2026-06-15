# WhatsApp/Telegram Bridge

Lightweight messaging bridge for quick queries and notifications across WhatsApp and Telegram.

## Installation

```bash
cortex plugin install github:CortexPrism/cortex-plugin-whatsapp-telegram
```

## Tools

### whatsapp_send
Send a WhatsApp message.
- `to` (string, required) — Recipient phone number
- `message` (string, required) — Message content

### telegram_send
Send a Telegram message.
- `chat_id` (string, required) — Telegram chat ID
- `message` (string, required) — Message content
- `parse_mode` (enum: HTML, Markdown, text, default: text) — Parse mode

### telegram_read
Read recent Telegram messages.
- `chat_id` (string, required) — Telegram chat ID
- `limit` (number, default: 20) — Maximum messages

### bridge_send_alert
Send alert to all configured platforms.
- `message` (string, required) — Alert message
- `priority` (enum: info, warning, critical, required) — Alert priority
- `platforms` (string, optional) — Comma-separated: whatsapp,telegram

### bridge_status
Check bridge configuration status. No parameters.

### bridge_set_webhook
Configure webhook for Telegram.
- `url` (string, required) — Webhook URL

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| whatsappApiKey | secret | No | WhatsApp Business API key |
| whatsappPhoneId | text | No | WhatsApp phone number ID |
| telegramBotToken | secret | No | Telegram bot token |
| telegramDefaultChatId | text | No | Default Telegram chat ID |

## License

MIT
