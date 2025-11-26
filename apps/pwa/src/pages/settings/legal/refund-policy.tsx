export default function RefundPolicyPage() {
  return (
    <div className="py-8">
      {/* Last updated */}
      <p className="mb-6 text-sm text-fg-subtle">Last updated: May 19th, 2025</p>

      {/* Policy content */}
      <div className="prose prose-invert max-w-none text-fg-default">
        <p className="mb-6 text-fg-muted">
          We, harpy chat inc., retain the right, at our sole discretion, to
          provide some Services, which will be available only for paid
          subscribers. The subscription will begin after the initial payment and
          the payment should be performed pursuant to the fee terms as presented
          on our website at the time of the purchase. You are responsible for
          payment of all fees, charges and taxes (if required by law) related to
          the transaction.
        </p>

        <p className="mb-6 text-fg-muted">
          We may provide a free trial period on our subscription to let you
          fully evaluate our services. All of our key offerings are visible &
          functional in this period.
        </p>

        <p className="mb-6 text-fg-muted">
          Please note that if you subscribed to the Services from a distribution
          platform from a third party which is not indicated or recognized by
          us, we are not responsible for any costs or liability arising from
          your action.
        </p>

        <h3 className="mb-4 mt-8 font-semibold text-fg-default">
          Subscription Refund
        </h3>
        <hr className="mb-6 border-border-default" />

        <p className="mb-6 text-fg-muted">
          You have 24 hours after your payment to request a refund. No refunds
          will be issued if your request is made more than 24 hours after you
          have paid for our services.
        </p>

        <p className="mb-6 text-fg-muted">
          If you have been charged by mistake or there has been an error in
          billing, please send a support request to{" "}
          <a
            href="mailto:cyoo@astrsk.ai"
            className="text-brand-400 hover:text-brand-500"
          >
            cyoo@astrsk.ai
          </a>{" "}
          detailing the issue. The development team will review your case and
          assist you with your refund request. If you do not hear back from us
          within 48 working hours, please check your email's spam folder—many
          email providers block unrecognized email addresses.
        </p>
      </div>
    </div>
  );
}
