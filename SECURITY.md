# Security policy

This is a static website with no server, no accounts and no data collection. Learner progress stays in the browser's local storage.

## Reporting a vulnerability

Please don't open a public issue for a security problem. Report it privately through GitHub's "Report a vulnerability" button on the repository's Security tab. If that isn't available, contact the maintainer through their GitHub profile.

**Include:**

- what you found;
- how to reproduce it;
- the possible impact.

You'll get an acknowledgement within 7 days.

## In scope

- cross-site scripting through content rendering, search or imported progress files;
- the service worker serving unexpected content;
- secrets or personal data accidentally committed to the repository.

## Not in scope

- vulnerabilities in Power BI, Fabric or other Microsoft products (report those to Microsoft);
- issues that need a compromised browser or device.

## Data in this repository

All company data is synthetic and generated from fixed seeds. The API responses under `data/tracks/automation` are mock files and contain no real tenant information. Example scripts read credentials from environment variables. Never commit secrets: CI and reviewers will reject them.
