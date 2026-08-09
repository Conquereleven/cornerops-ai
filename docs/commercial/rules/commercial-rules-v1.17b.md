# Commercial rules candidate v1.17B

`commercial-rules-v1.17b.json` is inactive and cannot activate Commercial Operations. It preserves
the verified v1.17A model: CornerMex is commercial owner, Intermex UAE is warehouse custodian and
fulfillment center in `manual_evidence_only` mode, and the carrier remains a separate party.

No shipping amount is configured for Dubai, Abu Dhabi, Sharjah or Ajman. Free shipping, COD
destination eligibility, operational ownership, MOQ semantics and service levels remain pending
Founder verification. Bank transfer requires human-verified settlement evidence; COD collection
is not settlement. The 24-hour inventory threshold is only the current implementation default and
still requires commercial confirmation.

All external messaging, payment capture, fulfillment execution, supplier/customer contact and
CornerMex writes remain false. Missing evidence blocks review; it never becomes an active default.
