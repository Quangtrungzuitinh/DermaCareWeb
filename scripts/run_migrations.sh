#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Inspect existing database state. Deployment is a separate, explicit step.
# Never delete migration history or embed connection credentials here.
npm run db:inspect
npm run db:status
