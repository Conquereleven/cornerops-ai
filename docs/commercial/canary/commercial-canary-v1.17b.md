# Commercial canary manifest v1.17B

The canary is `COMMERCIAL_CANARY_MANIFEST_NOT_AUTHORIZED`. It selects two candidate accounts and
three candidate SKUs by stable ID and pins the production-candidate checksum. It does not import,
reserve inventory, contact any party, send a message, take payment or execute fulfillment.

A future canary must proceed in this order under new authorizations: migrate with the feature
disabled; verify schema, grants and readiness; obtain Founder authorization; enable only the
necessary internal feature; import the canary; verify reads and Daily Close; optionally create at
most one synthetic internal opportunity and quote under separate authorization; then stop for
review before expansion.
