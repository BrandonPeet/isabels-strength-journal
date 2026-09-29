---
name: Calendar correction compatibility
description: Preserve records from the original tracking period after the Monday-based calendar correction.
---
Keep any September 29, 2027 records from the original tracking period as read-only historical entries, including during backup round-trips.

**Why:** The user moved the tracking period one day earlier but explicitly prohibited deleting or moving existing records and requested compatibility with old backups. The old final day must survive outside the new reporting period.

**How to apply:** Do not reject or discard this legacy date when refining validation, archive navigation, or backup formats. Do not extend the new writable period to accommodate it.