## Problem

The existing README was minimal and did not reflect recent API changes, leading to confusion for new contributors and users.

## Context

The project recently introduced new features and refactored the API. The old README lacked installation instructions, usage examples, and contribution guidelines, causing onboarding friction and support tickets.

## Decision

We chose to overhaul the README by adding a structured layout with clear sections for Overview, Installation, Usage, Contributing, FAQ, and License. We removed outdated examples and replaced them with current API usage. We added a FAQ to preempt common questions and a contribution guide to streamline collaboration.

## Alternatives Considered

We considered keeping the README minimal and adding a separate docs site, but this would increase maintenance overhead and fragment information. We also considered using a wiki, but the team preferred a single source of truth in the repository.

## Consequences

Positive: Improved onboarding, reduced support queries, clearer guidance for contributors. Negative: Requires ongoing maintenance to keep documentation up to date. Future: Documentation owner will be responsible for updates; CI will validate README structure.

## Status

Accepted