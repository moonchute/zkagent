#!/bin/bash
source circuit.env

echo "Generating solidity verifier..."
npx snarkjs zkey export solidityverifier "$BUILD_DIR"/"$CIRCUIT_NAME".zkey ../contracts/"$CIRCUIT_NAME"_verifier.sol