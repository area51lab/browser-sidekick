import { browser } from 'wxt/browser';
import { startEmbeddingSync } from '../lib/embedding/sync';
import { registerToolbarAction } from '../lib/toolbar';

export default defineBackground(() => {
  registerToolbarAction(browser as unknown as Parameters<typeof registerToolbarAction>[0]);
  void startEmbeddingSync();
});
