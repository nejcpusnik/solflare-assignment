import { $, browser } from '@wdio/globals';
import Page from './page.js';

/** Onboarding flow: https://solflare.com/onboard */
class OnboardingPage extends Page {
  get getStartedButton() {
    return $('[data-testid="btn-get-started"]');
  }

  get createNewWalletButton() {
    return $('[data-testid="btn-manual-create"]');
  }

  get newPasswordInput() {
    return $('[data-testid="input-new-password"]');
  }

  get repeatPasswordInput() {
    return $('[data-testid="input-repeat-password"]');
  }

  /** The real checkbox input. It is covered by a styled box, so it is only used to read the state. */
  get termsCheckbox() {
    return $('input[name="termsAccepted"]');
  }

  /**
   * The styled box the user actually sees and clicks. It is a <label> around the input,
   * so clicking it ticks the checkbox. The text next to it is not used, because it contains links.
   */
  get termsCheckboxBox() {
    return $('[data-key="onboard-term-and-conditions-check"] [data-id="checkbox"]');
  }

  get continueButton() {
    return $('[data-testid="btn-continue"]');
  }

  async open(): Promise<void> {
    await this.openPath('/onboard');

    // solflare.com answers some automated browsers (headless Chrome at the time of writing)
    // with a bare "Too many requests." page. Fail with a clear reason instead of a selector timeout.
    const pageText = await $('body').getText();
    if (pageText.includes('Too many requests')) {
      throw new Error(
        'solflare.com refused this browser with "Too many requests." ' +
          'The site rejects headless Chrome; run headed Chrome or Firefox (headed or headless) instead.',
      );
    }
  }

  /**
   * Clicks "Get started" and continues to the password form.
   *
   * The live site currently shows an extra screen after "Get started"
   * ("Create new wallet" / "Continue with Google") that is not in the assignment steps.
   * The method handles both variants, so the test keeps working if that screen is removed again.
   */
  async startWalletCreation(): Promise<void> {
    await this.click(this.getStartedButton, '"Get started" button');

    await browser.waitUntil(
      async () => (await this.newPasswordInput.isDisplayed()) || (await this.createNewWalletButton.isDisplayed()),
      { timeoutMsg: 'Neither the password form nor the "Create new wallet" button appeared' },
    );
    if (await this.createNewWalletButton.isDisplayed()) {
      await this.click(this.createNewWalletButton, '"Create new wallet" button');
    }
  }

  async enterPassword(password: string): Promise<void> {
    await this.type(this.newPasswordInput, password, 'new password field');
  }

  async reEnterPassword(password: string): Promise<void> {
    await this.type(this.repeatPasswordInput, password, 'repeat password field');
  }

  /** Ticks "I agree to the Terms of Service and Privacy Policy". */
  async acceptTerms(): Promise<void> {
    await this.click(this.termsCheckboxBox, 'Terms of Service checkbox');
  }

  async continue(): Promise<void> {
    await this.continueButton.waitForEnabled();
    await this.click(this.continueButton, '"Continue" button');
  }
}

export default new OnboardingPage();
