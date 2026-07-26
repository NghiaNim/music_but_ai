import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

export interface CheckoutOutcome {
  /** True when the browser sheet returned via the deep link (paid). */
  returnedViaDeepLink: boolean;
  orderId: string;
}

/**
 * Open a Stripe Checkout URL in an auth browser sheet and wait for the
 * classica://tickets/success deep link that the web success page issues.
 *
 * When the user dismisses the sheet without the redirect (e.g. paid but
 * closed early, or cancelled), the caller should still confirm the order
 * idempotently on the success screen — `ticket.confirmOrder` verifies the
 * real payment state against Stripe.
 */
export async function openStripeCheckout(
  checkoutUrl: string,
  orderId: string,
): Promise<CheckoutOutcome> {
  const returnUrl = Linking.createURL("/tickets/success");
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);

  if (result.type === "success") {
    const parsed = Linking.parse(result.url);
    const returnedOrderId =
      typeof parsed.queryParams?.orderId === "string"
        ? parsed.queryParams.orderId
        : orderId;
    return { returnedViaDeepLink: true, orderId: returnedOrderId };
  }

  return { returnedViaDeepLink: false, orderId };
}
