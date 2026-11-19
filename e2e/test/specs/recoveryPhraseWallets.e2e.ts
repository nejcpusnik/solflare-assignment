import { expect } from '@wdio/globals';
import OnboardingPage from '../pageobjects/onboarding.page.js';
import PortfolioPage from '../pageobjects/portfolio.page.js';
import WalletManagementPage from '../pageobjects/walletManagement.page.js';
import ShowOrHideWalletsPage from '../pageobjects/showOrHideWallets.page.js';
import { testData } from '../data/testData.js';

describe('Wallet management: recovery phrase wallets', () => {
  it('should add the 3rd and 4th wallets to the recovery phrase list', async () => {
    // Step 1: go to https://solflare.com/onboard
    await OnboardingPage.open();

    // Step 2: click "Get started"
    await OnboardingPage.startWalletCreation();

    // Step 3: enter the password
    await OnboardingPage.enterPassword(testData.walletPassword);

    // Step 4: repeat the password
    await OnboardingPage.reEnterPassword(testData.walletPassword);

    // Step 5: agree to the Terms of Service and Privacy Policy
    await OnboardingPage.acceptTerms();
    await expect(OnboardingPage.termsCheckbox).toBeSelected();

    // Step 6: click "Continue"
    await OnboardingPage.continue();

    // Step 7: click the wallet management avatar in the header
    await PortfolioPage.openWalletManagement();

    // Step 8: verify that the Main wallet is displayed
    await expect(WalletManagementPage.mainWalletName).toBeDisplayed();
    await expect(WalletManagementPage.mainWalletName).toHaveText(testData.mainWalletName);

    // Step 9: click "Three dots" next to the RECOVERY PHRASE label
    await WalletManagementPage.openRecoveryPhraseOptions();

    // Step 10: click "Show or hide wallets"
    await WalletManagementPage.openShowOrHideWallets();
    await ShowOrHideWalletsPage.waitForWallets(4);

    // Steps 11-12: the first toggle (the main wallet) is disabled and on
    const firstToggle = ShowOrHideWalletsPage.toggleAt(1);
    await expect(firstToggle).toBeDisabled();
    await expect(firstToggle).toHaveAttribute('aria-checked', 'true');

    // Remember which wallets we are about to add, so the final check compares
    // real addresses instead of only counting rows.
    const expectedAddresses = [
      await ShowOrHideWalletsPage.getAddressAt(1),
      await ShowOrHideWalletsPage.getAddressAt(3),
      await ShowOrHideWalletsPage.getAddressAt(4),
    ];

    // Step 13: select the 3rd and 4th list items
    await ShowOrHideWalletsPage.selectWalletAt(3);
    await ShowOrHideWalletsPage.selectWalletAt(4);
    await expect(ShowOrHideWalletsPage.toggleAt(3)).toHaveAttribute('aria-checked', 'true');
    await expect(ShowOrHideWalletsPage.toggleAt(4)).toHaveAttribute('aria-checked', 'true');

    // Step 14: click "Save"
    await ShowOrHideWalletsPage.save();

    // Expected result: the recovery phrase list contains the original wallet
    // and the two newly added wallets
    await WalletManagementPage.waitForRecoveryPhraseWalletCount(expectedAddresses.length);
    const displayedAddresses = await WalletManagementPage.getRecoveryPhraseWalletAddresses();
    expect(displayedAddresses).toEqual(expectedAddresses);
  });
});
