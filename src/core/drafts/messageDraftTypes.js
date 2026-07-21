const MESSAGE_DRAFT_TYPES = Object.freeze({
  WHATSAPP_FOLLOW_UP: 'whatsapp_follow_up_draft',
  EMAIL_FOLLOW_UP: 'email_follow_up_draft',
  QUOTE_FOLLOW_UP: 'quote_follow_up_draft',
  PAYMENT_REVIEW: 'payment_review_draft',
  B2B_LEAD_INTRO: 'b2b_lead_intro_draft',
});

const MESSAGE_DRAFT_SEND_STATUS = Object.freeze({
  NOT_SENDABLE: 'DRAFT_NOT_SENT',
});

module.exports = {
  MESSAGE_DRAFT_SEND_STATUS,
  MESSAGE_DRAFT_TYPES,
};
