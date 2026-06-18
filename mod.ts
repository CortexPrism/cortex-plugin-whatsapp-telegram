import type { PluginContext, Tool, ToolCallResult, ToolContext } from './types.ts';

let pluginConfig: Record<string, unknown> = {};

export async function onLoad(ctx: PluginContext): Promise<void> {
  ctx.logger.info(`[cortex-plugin-whatsapp-telegram] Loaded`);
  pluginConfig = await ctx.config.get() as Record<string, unknown>;
}

export async function onUnload(_ctx: PluginContext): Promise<void> {}

const whatsappSendTool: Tool = {
  definition: {
    name: 'whatsapp_send',
    description: 'Send a WhatsApp message',
    params: [
      { name: 'to', type: 'string', description: 'Recipient phone number', required: true },
      { name: 'message', type: 'string', description: 'Message content', required: true },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const to = args.to as string;
      const message = args.message as string;

      if (!to || !message) {
        return {
          toolName: 'whatsapp_send',
          success: false,
          output: '',
          error: 'to and message are required',
          durationMs: Date.now() - start,
        };
      }

      const apiKey = pluginConfig.whatsappApiKey as string;
      const phoneId = pluginConfig.whatsappPhoneId as string;

      if (!apiKey || !phoneId) {
        return {
          toolName: 'whatsapp_send',
          success: false,
          output: '',
          error: 'WhatsApp not configured. Set whatsappApiKey and whatsappPhoneId.',
          durationMs: Date.now() - start,
        };
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message },
          }),
        },
      );

      if (!response.ok) {
        return {
          toolName: 'whatsapp_send',
          success: false,
          output: '',
          error: `WhatsApp API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      const data = await response.json();
      return {
        toolName: 'whatsapp_send',
        success: true,
        output: JSON.stringify(data),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'whatsapp_send',
        success: false,
        output: '',
        error: `Failed to send WhatsApp message: ${
          error instanceof Error ? error.message : String(error)
        }`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const telegramSendTool: Tool = {
  definition: {
    name: 'telegram_send',
    description: 'Send a Telegram message',
    params: [
      { name: 'chat_id', type: 'string', description: 'Telegram chat ID', required: true },
      { name: 'message', type: 'string', description: 'Message content', required: true },
      {
        name: 'parse_mode',
        type: 'string',
        description: 'Message parse mode',
        required: false,
        enum: ['HTML', 'Markdown', 'text'],
        default: 'text',
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const chatId = args.chat_id as string;
      const message = args.message as string;

      if (!chatId || !message) {
        return {
          toolName: 'telegram_send',
          success: false,
          output: '',
          error: 'chat_id and message are required',
          durationMs: Date.now() - start,
        };
      }

      const botToken = pluginConfig.telegramBotToken as string;
      if (!botToken) {
        return {
          toolName: 'telegram_send',
          success: false,
          output: '',
          error: 'Telegram not configured. Set telegramBotToken.',
          durationMs: Date.now() - start,
        };
      }

      const parseMode = (args.parse_mode as string) ?? 'text';

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: parseMode === 'text' ? undefined : parseMode,
          }),
        },
      );

      if (!response.ok) {
        return {
          toolName: 'telegram_send',
          success: false,
          output: '',
          error: `Telegram API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      const data = await response.json();
      return {
        toolName: 'telegram_send',
        success: true,
        output: JSON.stringify(data),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'telegram_send',
        success: false,
        output: '',
        error: `Failed to send Telegram message: ${
          error instanceof Error ? error.message : String(error)
        }`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const telegramReadTool: Tool = {
  definition: {
    name: 'telegram_read',
    description: 'Read recent Telegram messages',
    params: [
      { name: 'chat_id', type: 'string', description: 'Telegram chat ID', required: true },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum number of messages',
        required: false,
        default: 20,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const chatId = args.chat_id as string;
      if (!chatId) {
        return {
          toolName: 'telegram_read',
          success: false,
          output: '',
          error: 'chat_id is required',
          durationMs: Date.now() - start,
        };
      }

      const botToken = pluginConfig.telegramBotToken as string;
      if (!botToken) {
        return {
          toolName: 'telegram_read',
          success: false,
          output: '',
          error: 'Telegram not configured',
          durationMs: Date.now() - start,
        };
      }

      const limit = (args.limit as number) ?? 20;

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getUpdates?limit=${limit}`,
      );

      if (!response.ok) {
        return {
          toolName: 'telegram_read',
          success: false,
          output: '',
          error: `Telegram API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      const data = await response.json();
      const messages = (data.result || []).map((update: Record<string, unknown>) => {
        const msg = update.message as Record<string, unknown> ||
          update.edited_message as Record<string, unknown>;
        if (!msg) return null;
        return {
          message_id: msg.message_id,
          chat_id: (msg.chat as Record<string, unknown>)?.id,
          from: (msg.from as Record<string, unknown>)?.username ||
            (msg.from as Record<string, unknown>)?.first_name,
          text: msg.text,
          date: msg.date,
        };
      }).filter(Boolean);

      return {
        toolName: 'telegram_read',
        success: true,
        output: JSON.stringify(messages),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'telegram_read',
        success: false,
        output: '',
        error: `Failed to read messages: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const bridgeSendAlertTool: Tool = {
  definition: {
    name: 'bridge_send_alert',
    description: 'Send alert to all configured platforms',
    params: [
      { name: 'message', type: 'string', description: 'Alert message', required: true },
      {
        name: 'priority',
        type: 'string',
        description: 'Alert priority level',
        required: true,
        enum: ['info', 'warning', 'critical'],
      },
      {
        name: 'platforms',
        type: 'string',
        description: 'Comma-separated platforms: whatsapp,telegram',
        required: false,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const message = args.message as string;
      const priority = args.priority as string;

      if (!message || !priority) {
        return {
          toolName: 'bridge_send_alert',
          success: false,
          output: '',
          error: 'message and priority are required',
          durationMs: Date.now() - start,
        };
      }

      if (!['info', 'warning', 'critical'].includes(priority)) {
        return {
          toolName: 'bridge_send_alert',
          success: false,
          output: '',
          error: 'priority must be one of: info, warning, critical',
          durationMs: Date.now() - start,
        };
      }

      const platformsStr = args.platforms as string | undefined;
      const targets = platformsStr
        ? platformsStr.split(',').map((p) => p.trim().toLowerCase())
        : ['whatsapp', 'telegram'];

      const prefix = { info: '[INFO]', warning: '[WARNING]', critical: '[CRITICAL]' }[priority];
      const formattedMessage = `${prefix} ${message}`;

      const results: string[] = [];

      if (targets.includes('telegram')) {
        const botToken = pluginConfig.telegramBotToken as string;
        const defaultChatId = pluginConfig.telegramDefaultChatId as string;

        if (botToken && defaultChatId) {
          try {
            const resp = await fetch(
              `https://api.telegram.org/bot${botToken}/sendMessage`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: defaultChatId, text: formattedMessage }),
              },
            );
            results.push(resp.ok ? 'telegram: sent' : `telegram: failed (${resp.status})`);
          } catch {
            results.push('telegram: error');
          }
        } else {
          results.push('telegram: not configured');
        }
      }

      if (targets.includes('whatsapp')) {
        const apiKey = pluginConfig.whatsappApiKey as string;
        const phoneId = pluginConfig.whatsappPhoneId as string;

        if (apiKey && phoneId) {
          results.push('whatsapp: requires recipient phone number (use whatsapp_send directly)');
        } else {
          results.push('whatsapp: not configured');
        }
      }

      return {
        toolName: 'bridge_send_alert',
        success: true,
        output: results.join('\n'),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'bridge_send_alert',
        success: false,
        output: '',
        error: `Failed to send alert: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const bridgeStatusTool: Tool = {
  definition: {
    name: 'bridge_status',
    description: 'Check bridge configuration status',
    params: [],
    capabilities: [],
  },
  execute: async (_args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const status: Record<string, unknown> = {
        whatsapp: {
          configured: !!(pluginConfig.whatsappApiKey && pluginConfig.whatsappPhoneId),
          phoneId: pluginConfig.whatsappPhoneId ? 'set' : 'not set',
          apiKey: pluginConfig.whatsappApiKey ? 'set' : 'not set',
        },
        telegram: {
          configured: !!(pluginConfig.telegramBotToken && pluginConfig.telegramDefaultChatId),
          botToken: pluginConfig.telegramBotToken ? 'set' : 'not set',
          defaultChatId: pluginConfig.telegramDefaultChatId ? 'set' : 'not set',
        },
      };

      return {
        toolName: 'bridge_status',
        success: true,
        output: JSON.stringify(status, null, 2),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'bridge_status',
        success: false,
        output: '',
        error: `Failed to check status: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const bridgeSetWebhookTool: Tool = {
  definition: {
    name: 'bridge_set_webhook',
    description: 'Configure webhook for Telegram',
    params: [
      { name: 'url', type: 'string', description: 'Webhook URL', required: true },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const url = args.url as string;
      if (!url) {
        return {
          toolName: 'bridge_set_webhook',
          success: false,
          output: '',
          error: 'url is required',
          durationMs: Date.now() - start,
        };
      }

      const botToken = pluginConfig.telegramBotToken as string;
      if (!botToken) {
        return {
          toolName: 'bridge_set_webhook',
          success: false,
          output: '',
          error: 'Telegram not configured. Set telegramBotToken.',
          durationMs: Date.now() - start,
        };
      }

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        },
      );

      if (!response.ok) {
        return {
          toolName: 'bridge_set_webhook',
          success: false,
          output: '',
          error: `Telegram API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      const data = await response.json();
      return {
        toolName: 'bridge_set_webhook',
        success: true,
        output: JSON.stringify(data),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'bridge_set_webhook',
        success: false,
        output: '',
        error: `Failed to set webhook: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

export const tools: Tool[] = [
  whatsappSendTool,
  telegramSendTool,
  telegramReadTool,
  bridgeSendAlertTool,
  bridgeStatusTool,
  bridgeSetWebhookTool,
];
