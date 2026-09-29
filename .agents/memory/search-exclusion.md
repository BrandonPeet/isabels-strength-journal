---
name: Search exclusion without access control
description: Why this link-shared journal allows crawling while requesting no indexing.
---
Use noindex/nofollow HTML metadata, but do not block page crawling in robots.txt.

**Why:** Crawlers must fetch the page to see noindex. Blocking crawling can leave URL-only listings. The user explicitly wants direct-link access without authentication, not guaranteed privacy.

**How to apply:** Preserve this distinction in future search-visibility changes; do not add promotional metadata, authentication, or a privacy server.