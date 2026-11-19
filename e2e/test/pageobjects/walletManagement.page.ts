import { $, browser } from '@wdio/globals';
import Page from './page.js';
import { WALLET_ROW_SELECTOR, getWalletAddress } from './components/walletRow.js';

/** "My wallets" panel: lists the wallets grouped by recovery phrase. */
class WalletManagementPage extends Page {
  get recoveryPhraseSection() {
    return $('[data-testid="section-Recovery phrase"]');
  }

  /** All wallets listed under the RECOVERY PHRASE label. */
  get recoveryPhraseWallets() {
    return this.recoveryPhraseSection.$$(WALLET_ROW_SELECTOR);
  }

  /** Name of the first wallet in the recovery phrase list (the Main Wallet). */
  get mainWalletName() {
    return this.recoveryPhraseSection.$('[data-testid="text-wallet-name"]');
  }

  /** "Three dots" button next to the RECOVERY PHRASE label. */
  get recoveryPhraseOptionsButton() {
    return this.recoveryPhraseSection.$('[data-testid="icon-btn-wallet-section-options"]');
  }

  get showOrHideWalletsOption() {
    return $('[data-testid="li-recovery-phrase-show-or-hide"]');
  }

  async openRecoveryPhraseOptions(): Promise<void> {
    await this.click(this.recoveryPhraseOptionsButton, '"Three dots" next to RECOVERY PHRASE');
  }

  async openShowOrHideWallets(): Promise<void> {
    await this.click(this.showOrHideWalletsOption, '"Show or hide wallets" option');
  }

  /** Returns the full address of every wallet in the recovery phrase list, in display order. */
  async getRecoveryPhraseWalletAddresses(): Promise<string[]> {
    return this.recoveryPhraseWallets.map((row) => getWalletAddress(row));
  }

  /** Waits until the recovery phrase list shows the expected number of wallets. */
  async waitForRecoveryPhraseWalletCount(expectedCount: number): Promise<void> {
    await browser.waitUntil(async () => (await this.recoveryPhraseWallets.length) === expectedCount, {
      timeoutMsg: `Recovery phrase list did not show ${expectedCount} wallets`,
    });
  }
}

export default new WalletManagementPage();
