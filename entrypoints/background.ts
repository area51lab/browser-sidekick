import { browser } from 'wxt/browser';
import { registerTabCleanup } from '../lib/storage';

export default defineBackground(() => {
  browser.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true });
  registerTabCleanup(browser.tabs.onRemoved);
});
