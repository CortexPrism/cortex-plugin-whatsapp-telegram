// deno-lint-ignore-file require-await, no-unused-vars
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { tools } from '../../mod.ts';
import type { PluginContext } from 'cortex/plugins';

const mockContext: PluginContext = {
  pluginId: 'cortex-plugin-whatsapp-telegram',
  pluginDir: '/tmp/plugins/cortex-plugin-whatsapp-telegram',
  state: {
    get: async () => null,
    set: async () => {},
  },
  config: {},
};

function findTool(name: string) {
  return tools.find((t) => t.definition.name === name);
}

Deno.test('whatsapp_send - rejects missing required params', async () => {
  const tool = findTool('whatsapp_send');
  if (!tool) throw new Error('whatsapp_send tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'required');
});

Deno.test('whatsapp_send - rejects missing API config', async () => {
  const tool = findTool('whatsapp_send');
  if (!tool) throw new Error('whatsapp_send tool not found');

  const result = await tool.execute({
    to: '+1234567890',
    message: 'Hello',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('telegram_send - rejects missing required params', async () => {
  const tool = findTool('telegram_send');
  if (!tool) throw new Error('telegram_send tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'required');
});

Deno.test('telegram_send - rejects missing API config', async () => {
  const tool = findTool('telegram_send');
  if (!tool) throw new Error('telegram_send tool not found');

  const result = await tool.execute({
    chat_id: '12345',
    message: 'Hello',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('telegram_send - accepts parse_mode param', async () => {
  const tool = findTool('telegram_send');
  if (!tool) throw new Error('telegram_send tool not found');

  const result = await tool.execute({
    chat_id: '12345',
    message: 'Hello',
    parse_mode: 'Markdown',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('telegram_read - rejects missing chat_id', async () => {
  const tool = findTool('telegram_read');
  if (!tool) throw new Error('telegram_read tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'chat_id');
});

Deno.test('telegram_read - rejects missing API config', async () => {
  const tool = findTool('telegram_read');
  if (!tool) throw new Error('telegram_read tool not found');

  const result = await tool.execute({ chat_id: '12345' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('bridge_send_alert - rejects missing required params', async () => {
  const tool = findTool('bridge_send_alert');
  if (!tool) throw new Error('bridge_send_alert tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'required');
});

Deno.test('bridge_send_alert - rejects invalid priority', async () => {
  const tool = findTool('bridge_send_alert');
  if (!tool) throw new Error('bridge_send_alert tool not found');

  const result = await tool.execute({
    message: 'Alert!',
    priority: 'invalid',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'must be one of');
});

Deno.test('bridge_send_alert - sends alert with unconfigured platforms', async () => {
  const tool = findTool('bridge_send_alert');
  if (!tool) throw new Error('bridge_send_alert tool not found');

  const result = await tool.execute({
    message: 'System alert',
    priority: 'critical',
  }, mockContext);
  assertEquals(result.success, true);
  assertStringIncludes(result.output, 'not configured');
});

Deno.test('bridge_status - returns bridge configuration status', async () => {
  const tool = findTool('bridge_status');
  if (!tool) throw new Error('bridge_status tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, true);
  const output = JSON.parse(result.output);
  assertEquals(typeof output.whatsapp, 'object');
  assertEquals(typeof output.telegram, 'object');
  assertEquals(output.whatsapp.configured, false);
  assertEquals(output.telegram.configured, false);
});

Deno.test('bridge_status - reports platforms as not configured', async () => {
  const tool = findTool('bridge_status');
  if (!tool) throw new Error('bridge_status tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, true);
  const output = JSON.parse(result.output);
  assertEquals(output.whatsapp.apiKey, 'not set');
  assertEquals(output.telegram.botToken, 'not set');
});

Deno.test('bridge_set_webhook - rejects missing url', async () => {
  const tool = findTool('bridge_set_webhook');
  if (!tool) throw new Error('bridge_set_webhook tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'url');
});

Deno.test('bridge_set_webhook - rejects missing API config', async () => {
  const tool = findTool('bridge_set_webhook');
  if (!tool) throw new Error('bridge_set_webhook tool not found');

  const result = await tool.execute({ url: 'https://example.com/webhook' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('tools array exported', () => {
  assertEquals(tools.length, 6);
  assertEquals(tools[0].definition.name, 'whatsapp_send');
  assertEquals(tools[1].definition.name, 'telegram_send');
  assertEquals(tools[2].definition.name, 'telegram_read');
  assertEquals(tools[3].definition.name, 'bridge_send_alert');
  assertEquals(tools[4].definition.name, 'bridge_status');
  assertEquals(tools[5].definition.name, 'bridge_set_webhook');
});
