## Problem

The README lacked a welcoming tone, making onboarding feel impersonal and potentially discouraging new contributors.

## Context

The project is a pilot initiative with a small team. Existing documentation is minimal, and the team wants to foster a friendly, inclusive environment. No prior guidelines for README content.

## Decision

We decided to add a static greeting "HELLO PILOT" at the top of the README. This choice was made to provide an immediate, low-effort signal of openness, without introducing dynamic or complex content that would require maintenance.

## Alternatives Considered

- Leaving the README unchanged: would maintain minimalism but risk a cold first impression.
- Adding a more elaborate welcome section with contributor guidelines: would be more informative but increase maintenance and risk of clutter.
- Using a dynamic banner fetched from a service: would keep content fresh but add external dependencies and potential downtime.

## Consequences

Positive: New contributors see a friendly greeting, improving perceived welcoming culture. Negative: The greeting may become stale if team culture evolves; it adds a small maintenance point. Future implications: The README will need periodic review to ensure tone remains appropriate.

## Status

Accepted