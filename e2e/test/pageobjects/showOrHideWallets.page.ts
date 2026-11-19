import { $, browser } from '@wdio/globals';
import Page from './page.js';
import { WALLET_ROW_SELECTOR, getWalletAddress } from './components/walletRow.js';

/** "Show or hide wallets" panel: one row with a toggle for every wallet of the recovery phrase. */
class ShowOrHideWalletsPage extends Page {
  get walletList() {
    return $('[data-testid="section-manage-recovery-phrase"]');
  }

  get walletRows() {
    return this.walletList.$$(WALLET_ROW_SELECTOR);
  }

  get saveButton() {
    return $('[data-testid="btn-save"]');
  }

  /** Waits until the list has loaded at least the given number of wallets. */
  async waitForWallets(minimumCount: number): Promise<void> {
    await browser.waitUntil(async () => (await this.walletRows.length) >= minimumCount, {
      timeoutMsg: `"Show or hide wallets" list did not load ${minimumCount} wallets`,
    });
  }

  /** Toggle of the wallet at the given position (1 = first list item). */
  toggleAt(position: number) {
    return this.walletRows[position - 1].$('[role="switch"]');
  }

  /** Full address of the wallet at the given position (1 = first list item). */
  async getAddressAt(position: number): Promise<string> {
    return getWalletAddress(await this.walletRows[position - 1].getElement());
  }

  /** Switches on the wallet at the given position (1 = first list item). */
  async selectWalletAt(position: number): Promise<void> {
    await this.click(this.toggleAt(position), `toggle of list item ${position}`);
  }

  async save(): Promise<void> {
    await this.saveButton.waitForEnabled();
    await this.click(this.saveButton, '"Save" button');
  }
}

export default new ShowOrHideWalletsPage();
