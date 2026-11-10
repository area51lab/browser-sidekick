import { browser } from 'wxt/browser';
import { registerTabCleanup } from '../lib/storage';
import { startEmbeddingSync } from '../lib/embedding/sync';

export default defineBackground(() => {
  browser.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true });
  registerTabCleanup(browser.tabs.onRemoved);
  void startEmbeddingSync();
});
