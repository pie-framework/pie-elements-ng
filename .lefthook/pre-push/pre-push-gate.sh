#!/bin/sh
# The pre-push job in lefthook.yml, run as a script so lefthook hands it the pushed refs and
# applies no push-file check of its own; scripts/pre-push-gate.mjs decides whether the push is gated.
exec node ./scripts/pre-push-gate.mjs "$@"
