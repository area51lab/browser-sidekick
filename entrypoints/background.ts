import { browser } from 'wxt/browser';
import { registerTabCleanup } from '../lib/storage';
import { startEmbeddingSync } from '../lib/embedding/sync';
import { registerToolbarAction } from '../lib/toolbar';

export default defineBackground(() => {
  registerToolbarAction(browser as unknown as Parameters<typeof registerToolbarAction>[0]);
  registerTabCleanup(browser.tabs.onRemoved);
  void startEmbeddingSync();
});
