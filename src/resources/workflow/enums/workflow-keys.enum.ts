export const WorkflowKeys = {
  UPDATE_PAYMENT_INFO: {
    FORM_KEY: 'UpdatePaymentInformation',
    STEPS: {
      REVIEW_INFO_ADMIN: 'ReviewInfoAdmin',
      UPDATE_PAYMENT_INFO_APPROVED: 'UpdatePaymentInformationApproved',
      UPDATE_PAYMENT_INFO_REJECTED: 'UpdatePaymentInformationRejected',
    },
  },
  REQUEST_PAYMENT: {
    FORM_KEY: 'RequestPayment',
    STEPS: {
      REVIEW_PAYMENT_REQUEST: 'ReviewPaymentRequest',
      PAYMENT_SENT: 'PaymentSent',
      PAYMENT_PROCESSED: 'PaymentProcessed',
    },
  },
};
