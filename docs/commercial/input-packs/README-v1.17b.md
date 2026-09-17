# Commercial production candidate v1.17B

This package is classified `COMMERCIAL_PRODUCTION_CANDIDATE_NOT_IMPORTED`. It is not demo data,
but validation is not import authorization. The source-backed draft contains ten founder-attested
Wave 1 prospect/account candidates and twelve Intermex-backed catalog identities. A candidate is
not evidence of a customer relationship, permission to contact, or commercial acceptance. The
package contains no private contact data.

Run `npm run commercial:preview-candidate`. A valid result must report version
`commercial-input-v1.17b`, exactly 10 accounts and 12 SKUs, no errors, the logical checksum in
`checksums-v1.17b.json`, `writesPerformed:false`, and `importAuthorized:false`.

Unknown values are deliberately retained as `unknown`, `not_provided`, or
`pending_verification`. In particular, legal identity, contact status, owner, commercial terms,
supplier SKU, pack basis, costs, B2B prices, MOQ, inventory and registration must not be inferred
from public catalog identity. A future import requires separate Founder authorization and fresh
evidence review.
