## Architecture Decision Record

### Problem

We experienced latency issues in Postgres.

### Context

We chose Redis as an alternative.

### Decision

Use Redis to address latency issues in Postgres.

### Consequences

Legacy auth flow may be broken.

### Status

Accepted.