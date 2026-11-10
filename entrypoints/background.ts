import { browser } from 'wxt/browser';
import { startEmbeddingSync } from '../lib/embedding/sync';

export default defineBackground(() => {
  browser.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true });
  void startEmbeddingSync();
});
