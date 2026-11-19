import { $ } from '@wdio/globals';
import Page from './page.js';

/** Portfolio page: the first page shown after a wallet is created. */
class PortfolioPage extends Page {
  /** Avatar in the right corner of the header; opens wallet management. */
  get walletManagementAvatar() {
    return $('[data-testid="wallet-picker-avatar"]');
  }

  async openWalletManagement(): Promise<void> {
    await this.walletManagementAvatar.waitForDisplayed({
      timeoutMsg: 'Portfolio page did not load after creating the wallet',
    });
    await this.click(this.walletManagementAvatar, 'wallet management avatar');
  }
}

export default new PortfolioPage();
