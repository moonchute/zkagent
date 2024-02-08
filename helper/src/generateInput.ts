import fs from "fs";
import { dkimVerify } from "@zk-email/helpers/dist/dkim";
import { CIRCOM_FIELD_MODULUS } from "@zk-email/helpers/dist/constants";
import { shaHash, partialSha, sha256Pad } from "@zk-email/helpers/dist/shaHash";
import {
  bytesToBigInt,
  stringToBytes,
  fromHex,
  toCircomBigIntBytes,
  packBytesIntoNBytes,
  bufferToUint8Array,
  bufferToString,
  bufferToHex,
  Uint8ArrayToString,
  Uint8ArrayToCharArray,
  assert,
  mergeUInt8Arrays,
  int8toBytes,
  int64toBytes,
} from "@zk-email/helpers/dist/binaryFormat";
import { pki } from "node-forge";

interface ICircuitInputs {
  // Email verifiers
  in_padded?: string[];
  pubkey?: string[];
  signature?: string[];
  in_len_padded_bytes?: string;
  body_hash_idx?: string;
  precomputed_sha?: string[];
  in_body_padded?: string[];
  in_body_len_padded_bytes?: string;

  // base_message?: string[];
  // in_padded_n_bytes?: string[];
  // expected_sha?: string[];
  // venmo_payer_id_idx?: string;
  // email_from_idx?: string | number;
  // email_to_idx?: string | number;
  // email_timestamp_idx?: string;
  // venmo_payee_id_idx?: string;
  // venmo_amount_idx?: string;
  // venmo_actor_id_idx?: string;
  // hdfc_payee_id_idx?: string;
  // hdfc_amount_idx?: string;
  // hdfc_payment_id_idx?: string;
  // hdfc_acc_num_idx?: string;
  // paylah_amount_idx?: string;
  // paylah_payer_mobile_num_idx?: string;
  // paylah_payee_name_idx?: string;
  // paylah_payee_mobile_num_idx?: string;
  // paylah_payment_id_idx?: string;
  // garanti_payer_mobile_num_idx?: string;
  // garanti_payee_acc_num_idx?: string;
  // garanti_amount_idx?: string;
  // email_date_idx?: string;
  // intermediate_hash?: string[];
  // in_body_suffix_padded?: string[];
  // in_body_suffix_len_padded_bytes?: string;
  // intent_hash?: string;
  // // subject commands only
  // command_idx?: string;
  // message_id_idx?: string;
  // amount_idx?: string;
  // currency_idx?: string;
  // recipient_idx?: string;
  // custom_message_id_from?: string[];
  // custom_message_id_recipient?: string[];
  // nullifier?: string;
  // relayer?: string;
}

function padWithZero(arr: Uint8Array, length: number) {
  while (arr.length < length) {
    arr = mergeUInt8Arrays(arr, int8toBytes(0));
  }
  return arr;
}

async function findSelector(a: Uint8Array, selector: number[]): Promise<number> {
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (a[i] === selector[j]) {
      j++;
      if (j === selector.length) {
        return i - j + 1;
      }
    } else {
      j = 0;
    }
    i++;
  }
  return -1;
}

// Returns the part of str that appears after substr
function trimStrByStr(str: string, substr: string) {
  const index = str.indexOf(substr);
  if (index === -1) return str;
  return str.slice(index + substr.length, str.length);
}

async function getArgs() {
  const args = process.argv.slice(2);
  const emailFileArg = args.find((arg) => arg.startsWith("--email="));
  const outputDirArg = args.find((arg) => arg.startsWith("--output="));
  
  if (!emailFileArg) {
    console.log("Usage npx ts-node generateInput.ts --email=<email_file> --output=<output_dir>");
    process.exit(1);
  }
  const emailFile = emailFileArg.split("=")[1];
  const outputDir = outputDirArg ? outputDirArg.split("=")[1] : "./output";
  return { emailFile, outputDir };
}

export async function getCircuitInputs(
  rsaSignature: BigInt,
  rsaPublicKey: BigInt,
  message: Buffer,
  body: Buffer,
  bodyHash: string
): Promise<ICircuitInputs> {
  console.log("Starting processing of inputs");
  let MAX_HEADER_PADDED_BYTES_FOR_EMAIL_TYPE = 1536;
  let MAX_BODY_PADDED_BYTES_FOR_EMAIL_TYPE = 6272;
  let MAX_INTERMEDIATE_PADDING_LENGTH = MAX_BODY_PADDED_BYTES_FOR_EMAIL_TYPE;
  let STRING_PRESELECTOR_FOR_EMAIL_TYPE = "----==_mimepart_";
  let STRING_PRESELECTOR_FOR_EMAIL_TYPE_INTERMEDIATE = "----==_mimepart_";

  // Unpadding
  const prehashBytesUnpadded = Uint8Array.from(message);
  const postShaBigintUnpadded = bytesToBigInt(stringToBytes((shaHash(prehashBytesUnpadded)).toString())) % CIRCOM_FIELD_MODULUS;

  // Add padding
  const calc_length = Math.floor((body.length + 63 + 65) / 64) * 64;
  const [messagePadded, messagePaddedLen] = sha256Pad(prehashBytesUnpadded, MAX_HEADER_PADDED_BYTES_FOR_EMAIL_TYPE);
  const [bodyPadded, bodyPaddedLen] = sha256Pad(body, Math.max(MAX_BODY_PADDED_BYTES_FOR_EMAIL_TYPE, calc_length));

  // Ensure SHA manual unpadded is running the correct function
  const shaOut = partialSha(messagePadded, messagePaddedLen);

  assert((await Uint8ArrayToString(shaOut)) === (await Uint8ArrayToString(Uint8Array.from(shaHash(prehashBytesUnpadded)))), "SHA256 calculation did not match!");

  // Precompute SHA prefix
  const selector = STRING_PRESELECTOR_FOR_EMAIL_TYPE.split("").map((char) => char.charCodeAt(0));
  const selector_loc = await findSelector(bodyPadded, selector);
  console.log("Body selector found at: ", selector_loc);
  let shaCutoffIndex = Math.floor((await findSelector(bodyPadded, selector)) / 64) * 64;
  const precomputeText = bodyPadded.slice(0, shaCutoffIndex);
  let bodyRemaining = bodyPadded.slice(shaCutoffIndex);
  const bodyRemainingLen = bodyPaddedLen - precomputeText.length;
  console.log(bodyRemainingLen, " bytes remaining in body");
  
  assert(bodyRemainingLen < MAX_BODY_PADDED_BYTES_FOR_EMAIL_TYPE, "Invalid slice");
  assert(bodyRemaining.length % 64 === 0, "Not going to be padded correctly with int64s");

  bodyRemaining = padWithZero(bodyRemaining, MAX_BODY_PADDED_BYTES_FOR_EMAIL_TYPE);
  assert(bodyRemaining.length === MAX_BODY_PADDED_BYTES_FOR_EMAIL_TYPE, "Invalid slice");
  const bodyShaPrecompute = partialSha(precomputeText, shaCutoffIndex);

  // Compute identity revealer
  let circuitInputs: ICircuitInputs;
  const pubkey = toCircomBigIntBytes(rsaPublicKey);
  const signature = toCircomBigIntBytes(rsaSignature);

  const in_len_padded_bytes = messagePaddedLen.toString();
  const in_padded = Uint8ArrayToCharArray(messagePadded); // Packed into 1 byte signals
  const body_hash_idx = bufferToString(message).indexOf(bodyHash).toString();
  const precomputed_sha = Uint8ArrayToCharArray(bodyShaPrecompute);
  const in_body_len_padded_bytes = bodyRemainingLen.toString();
  const in_body_padded = Uint8ArrayToCharArray(bodyRemaining);
  const base_message = toCircomBigIntBytes(postShaBigintUnpadded);

  let raw_header = Buffer.from(message).toString();
  const email_from_idx = raw_header.length - trimStrByStr(trimStrByStr(raw_header, "from:"), "<").length;
  let email_subject = trimStrByStr(raw_header, "\r\nsubject:");

  const issueSelector = "Closed #";
  const issueIdx = (Buffer.from(bodyRemaining).indexOf(issueSelector) + issueSelector.length).toString();
  const issuePRSelector = "as completed via #";
  const issuePRIdx = (Buffer.from(bodyRemaining).indexOf(issuePRSelector) + issuePRSelector.length).toString();
  const issueRepoIdx = raw_header.length - trimStrByStr(raw_header, "to:").length;

  console.log("email from:", raw_header.slice(email_from_idx, email_from_idx + 20));
  console.log("issue:", new TextDecoder().decode(bodyRemaining.slice(Number(issueIdx), Number(issueIdx) + 2)));
  console.log("issue pr:", new TextDecoder().decode(bodyRemaining.slice(Number(issuePRIdx), Number(issuePRIdx) + 2)));
  console.log("email from:", raw_header.slice(issueRepoIdx, issueRepoIdx + 24));

  circuitInputs = {
    in_padded,
    pubkey,
    signature,
    in_len_padded_bytes,
    body_hash_idx,
    precomputed_sha,
    in_body_padded,
    in_body_len_padded_bytes
  }
  return circuitInputs;
}

export async function generateInputs(raw_email: Buffer): Promise<ICircuitInputs> {
  const result = await dkimVerify(raw_email);
  console.log("Results:", result.results[0]);
  if (!result.results[0]) {
    throw new Error(`No result found on dkim output ${result}`);
  } else {
    if (!result.results[0].publicKey) {
      if (result.results[0].status.message) { // Has error
        throw new Error(result.results[0].status.message);
      }
      throw new Error(`No public key found on DKIM verification result ${JSON.stringify(result)}`);
    }
  }
  const sig = BigInt("0x" + Buffer.from(result.results[0].signature, "base64").toString("hex"));
  const message = result.results[0].status.signature_header;
  const body = result.results[0].body;
  const bodyHash = result.results[0].bodyHash;
  const pubKeyPem = result.results[0].publicKey;
  const pubKeyData = pki.publicKeyFromPem(pubKeyPem);
  const pubKey = BigInt(pubKeyData.n.toString());
  const finalCircuits = await getCircuitInputs(sig, pubKey, message, body, bodyHash); 
  
  return finalCircuits;
}

async function generateFromCmd(writeToFile: boolean = true) {
  const args = await getArgs();
  const email = fs.readFileSync(args.emailFile.trim());
  await generateInputs(email);
}

if (typeof require !== "undefined" && require.main === module) {
  generateFromCmd(true);
}