# Sales CRM import mapping v1

Status: mapping and validation only. **No prospect has been imported and nothing imports automatically.** An actual import is a separate Founder decision.

The Founder's prospecting spreadsheet was deliberately not read during this sprint (it holds real contact data). The source column names below are the headers the CSV preview recognises; confirm them against the real sheet by running a preview, which lists every column it could not map.

## Shape

One spreadsheet row describes up to three records:

```text
row ──► sales_accounts      (one per distinct company name)
    ├─► sales_contacts      (if any contact column is filled)
    └─► sales_opportunities (if any opportunity column is filled)
```

Past touches (emails sent, calls made) become `sales_activities` rows. They are records of what happened, entered by a person; `external_ref` may hold a Gmail thread id or similar and never triggers a send.

## Column mapping

| Spreadsheet column (case-insensitive) | Table | Field | Rule |
|---|---|---|---|
| Company, Company Name, Account | sales_accounts | `name` | required, ≤ 200 chars; rows with the same name share one account |
| Website | sales_accounts | `website` | ≤ 300 |
| Segment, Industry | sales_accounts | `segment` | ≤ 80 |
| Source | sales_accounts | `source` | ≤ 80 |
| Priority | sales_accounts | `priority` | `high`, `medium`, `low` |
| Fit Score | sales_accounts | `fit_score` | whole number 0–100 |
| Status | sales_accounts | `status` | `prospect` (default), `active`, `customer`, `disqualified`, `archived` |
| Problem Hypothesis, Pain | sales_accounts | `problem_hypothesis` | ≤ 2000 |
| Contact Name, Contact | sales_contacts | `name` | required when any contact column is present |
| Title, Role | sales_contacts | `title` | ≤ 160 |
| Email | sales_contacts | `email` | must look like an address |
| Phone | sales_contacts | `phone` | ≤ 40 |
| LinkedIn, LinkedIn URL | sales_contacts | `linkedin_url` | ≤ 300 |
| Contact Confidence | sales_contacts | `contact_confidence` | `verified`, `likely`, `unverified` |
| Stage | sales_opportunities | `stage` | `new`, `contacted`, `engaged`, `discovery`, `qualified`, `proposal`, `won`, `lost`, `nurture` |
| Next Step | sales_opportunities | `next_step` | ≤ 500 |
| Next Step Date | sales_opportunities | `next_step_at` | ISO date |
| Estimated Value | sales_opportunities | `estimated_value` | optional; never defaulted or estimated |
| Currency | sales_opportunities | `currency` | 3-letter code, required only with a value |
| Qualification Score | sales_opportunities | `qualification_score` | 0–100 |
| Solution Hypothesis | sales_opportunities | `solution_hypothesis` | ≤ 2000 |

Server-owned and never imported: `id`, `workspace_id`, `owner_user_id`, `created_by`, `updated_by`, timestamps.

Columns with no home in v1 (reported as unmapped, not silently dropped): free-form notes, last-contacted date, outreach sequence/step, tags. Notes and last touch belong in `sales_activities`; the rest is out of scope until needed.

Stage vocabulary differences need a decision before import, for example a sheet value such as "Replied" → `engaged`, "Meeting booked" → `discovery`, "Not interested" → `lost`. The preview rejects unknown stage values rather than guessing.

## Preview validator

`POST /api/app/sales/import/preview` with `{ "csv": "<file contents>" }` (operator role, ≤ 32 KB, first 500 rows).

It returns counts of what would be created, the unmapped columns and, per rejected row, the row number and failing field names. It writes nothing and never echoes cell values. There is no import endpoint.

## Open decisions for the Founder

1. Confirm the real header names and the stage translation.
2. Whether contact details should be imported at all, or only accounts with contacts added by hand.
3. Who owns imported records (`owner_user_id`).
