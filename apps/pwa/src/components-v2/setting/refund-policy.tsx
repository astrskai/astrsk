const RefundPolicy = () => {
  return (
    <div className="fixed inset-0 left-0 z-40 overflow-y-auto py-[80px]">
      <div className="max-w-[587px] mx-auto text-text-primary">
        {/* Header with back button */}
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center h-full">
            <h1 className="text-2xl font-semibold">Refund Policy</h1>
          </div>{" "}
        </div>

        {/* Content */}
        <div className="pr-8">
          <div className="text-text-placeholder text-base font-normal mb-6">
            Last updated: May 19th, 2025
          </div>

          {/* Policy content */}
          <div className="text-text-primary prose prose-invert max-w-none">
            <div className="mb-8"></div>
            <p className="text-text-placeholder mb-6">
              We, harpy chat inc., retain the right, at our sole discretion, to
              provide some Services, which will be available only for paid
              subscribers. The subscription will begin after the initial payment
              and the payment should be performed pursuant to the fee terms as
              presented on our website at the time of the purchase. You are
              responsible for payment of all fees, charges and taxes (if
              required by law) related to the transaction.
            </p>

            <p className="text-text-placeholder mb-6">
              We may provide a free trial period on our subscription to let you
              fully evaluate our services. All of our key offerings are visible
              & functional in this period.
            </p>

            <p className="text-text-placeholder mb-6">
              Please note that if you subscribed to the Services from a
              distribution platform from a third party which is not indicated or
              recognized by us, we are not responsible for any costs or
              liability arising from your action.
            </p>

            <h3 className="font-semibold mt-8 mb-4">Subscription Refund</h3>

            <p className="mb-6">
              You have 24 hours after your payment to request a refund. No
              refunds will be issued if your request is made more than 24 hours
              after you have paid for our services.
            </p>

            <p className="mb-6">
              If you have been charged by mistake or there has been an error in
              billing, please send a support request to{" "}
              <a
                href="mailto:cyoo@astrsk.ai"
                className="text-primary-strong hover:text-primary-strong/80"
              >
                cyoo@astrsk.ai
              </a>{" "}
              detailing the issue. The development team will review your case
              and assist you with your refund request. If you do not hear back
              from us within 48 working hours, please check your email’s spam
              folder—many email providers block unrecognized email addresses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
