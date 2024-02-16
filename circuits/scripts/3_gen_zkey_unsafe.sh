#!/bin/bash
# Tries to generate a chunked and non-chunked zkey
# You need to set entropy.env for this to work

source circuit.env

echo "$PTAU_DIR"
R1CS_FILE="$BUILD_DIR/$CIRCUIT_NAME.r1cs"
PHASE1="$PTAU_DIR/powersOfTau28_hez_final_$PTAU.ptau"

source entropy.env

echo "****GENERATING ZKEY NONCHUNKED FINAL****"
echo "$ENTROPY1"
start=$(date +%s)
set -x

NODE_OPTIONS='--max-old-space-size=112000' npx snarkjs zkey new  "$BUILD_DIR"/"$CIRCUIT_NAME".r1cs "$PHASE1"  "$BUILD_DIR"/"$CIRCUIT_NAME".zkey -v
{ set +x; } 2>/dev/null
end=$(date +%s)
echo "DONE ($((end - start))s)"
echo

# # Export the verification key to JSON
echo "Exporting verification key to JSON..."
npx snarkjs zkey export verificationkey "$BUILD_DIR"/"$CIRCUIT_NAME".zkey  "$BUILD_DIR"/"$CIRCUIT_NAME"_vkey.json
