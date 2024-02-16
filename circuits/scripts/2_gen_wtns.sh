#!/bin/zsh
source circuit.env

echo "****GENERATING WITNESS FOR SAMPLE INPUT****"
start=$(date +%s)

echo "Build Dir: $BUILD_DIR"

set -x
node "$BUILD_DIR"/"$CIRCUIT_NAME"_js/generate_witness.js "$BUILD_DIR"/"$CIRCUIT_NAME"_js/"$CIRCUIT_NAME".wasm ../inputs/$CIRCUIT_NAME.json "$BUILD_DIR"/"$CIRCUIT_NAME"_witness.wtns
{ set +x; } 2>/dev/null
end=$(date +%s)
echo "DONE ($((end - start))s)"
echo
