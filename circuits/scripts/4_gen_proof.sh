#!/bin/bash

source circuit.env

echo "****GENERATING PROOF FOR SAMPLE INPUT****"
start=$(date +%s)
set -x
NODE_OPTIONS='--max-old-space-size=644000' npx snarkjs groth16 prove "$BUILD_DIR"/"$CIRCUIT_NAME".zkey "$BUILD_DIR"/"$CIRCUIT_NAME"_witness.wtns "$BUILD_DIR"/"$CIRCUIT_NAME"_proof.json "$BUILD_DIR"/"$CIRCUIT_NAME"_public.json
{ set +x; } 2>/dev/null
end=$(date +%s)
echo "DONE ($((end - start))s)"
echo

echo "****VERIFYING PROOF FOR SAMPLE INPUT****"
start=$(date +%s)
set -x
NODE_OPTIONS='--max-old-space-size=644000' npx snarkjs groth16 verify "$BUILD_DIR"/"$CIRCUIT_NAME"_vkey.json "$BUILD_DIR"/"$CIRCUIT_NAME"_public.json "$BUILD_DIR"/"$CIRCUIT_NAME"_proof.json
end=$(date +%s)
{ set +x; } 2>/dev/null
echo "DONE ($((end - start))s)"
echo
