#!/bin/bash

source circuit.env

echo "****GENERATING INPUT****"
start=$(date +%s)
set -x
npx tsx ../../helper/src/generateInput.ts --email=../emls/"$CIRCUIT_NAME".eml --output=../inputs --type="$CIRCUIT_NAME" --to="$TO_ADDRESS"
{ set +x; } 2>/dev/null
end=$(date +%s)
echo "DONE ($((end - start))s)"
echo
