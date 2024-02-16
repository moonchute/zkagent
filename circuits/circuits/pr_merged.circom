pragma circom 2.1.8;

include "./utils/ceil.circom";
include "./regex/from_regex.circom";
include "./regex/repo_regex.circom";
include "./regex/pr_author_regex.circom";
include "./regex/pr_num_regex.circom";

include "@zk-email/circuits/email-verifier.circom";
include "@zk-email/circuits/helpers/utils.circom";
include "@zk-email/circuits/helpers/extract.circom";

template PRMerged(max_header_bytes, max_body_bytes, n, k, pack_size) {
    assert(n * k > 1024); // constraints for 1024 bit RSA
  
    var max_email_from_len = ceil(28, pack_size); // RFC 2821: requires length to be 254, but we can limit to 28 (notifications@github.com)
    var max_repo_len = ceil(56, pack_size); 
    var max_pr_number_len = 8;

    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input pubkey[k]; // rsa pubkey, verified with smart contract + DNSSEC proof. split up into k parts of n bits each.
    signal input signature[k]; // rsa signature. split up into k parts of n bits each.
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    // Base 64 body hash variables
    signal input body_hash_idx;
    // The precomputed_sha value is the Merkle-Damgard state of our SHA hash uptil our first regex match which allows us to save SHA constraints by only hashing the relevant part of the body
    signal input precomputed_sha[32];
    // Suffix of the body after precomputed SHA
    signal input in_body_padded[max_body_bytes];
    // Length of the body after precomputed SHA
    signal input in_body_len_padded_bytes;

    signal output pubkey_hash;

    // DKIM VERIFICATION
    // component EV = EmailVerifier(max_header_bytes, max_body_bytes, n, k, 0);
    // EV.in_padded <== in_padded;
    // EV.pubkey <== pubkey;
    // EV.signature <== signature;
    // EV.in_len_padded_bytes <== in_len_padded_bytes;
    // EV.body_hash_idx <== body_hash_idx;
    // EV.precomputed_sha <== precomputed_sha;
    // EV.in_body_padded <== in_body_padded;
    // EV.in_body_len_padded_bytes <== in_body_len_padded_bytes;
    // signal header_hash[256] <== EV.sha;

    // pubkey_hash <== EV.pubkey_hash;

    // FROM HEADER REGEX
    var max_email_from_packed_bytes = count_packed(max_email_from_len, pack_size);
    assert(max_email_from_packed_bytes < max_header_bytes);

    signal input email_from_idx;
    signal output reveal_email_from_packed[max_email_from_packed_bytes];

    signal (from_regex_out, from_regex_reveal[max_header_bytes]) <== FromRegex(max_header_bytes)(in_padded);
    from_regex_out === 1;
    reveal_email_from_packed <== ShiftAndPackMaskedStr(max_header_bytes, max_email_from_len, pack_size)(from_regex_reveal, email_from_idx);

    // REPO REGEX
    var max_repo_packed_bytes = count_packed(max_repo_len, pack_size);
    assert(max_repo_packed_bytes < max_header_bytes);

    signal input repo_idx;
    signal output reveal_repo_packed[max_repo_packed_bytes];
    
    signal (repo_regex_out, repo_regex_reveal[max_header_bytes]) <== RepoRegex(max_header_bytes)(in_padded);
    repo_regex_out === 1;
    reveal_repo_packed <== ShiftAndPackMaskedStr(max_header_bytes, max_repo_len, pack_size)(repo_regex_reveal, repo_idx);

    // AUTHOR REGEX
    signal author_regex_out <== PRAuthorRegex(max_header_bytes)(in_padded);
    author_regex_out === 1;

    // PR NUMBER REGEX
    var max_pr_number_packed_bytes = count_packed(max_pr_number_len, pack_size);
    assert(max_pr_number_packed_bytes < max_body_bytes);

    signal input pr_number_idx;
    signal output reveal_pr_number_packed[max_pr_number_packed_bytes];
    
    signal (pr_number_regex_out, pr_number_regex_reveal[max_body_bytes]) <== PRNumRegex(max_body_bytes)(in_body_padded);
    pr_number_regex_out === 1;
    reveal_pr_number_packed <== ShiftAndPackMaskedStr(max_body_bytes, max_pr_number_len, pack_size)(pr_number_regex_reveal, pr_number_idx);

    // The following signals do not take part in any computation, but tie the proof to a specific to_address to prevent frontrunning.
    // https://geometry.xyz/notebook/groth16-malleability
    signal input to_address;
    signal to_address_squared;
    to_address_squared <== to_address * to_address;
}

component main { public [ to_address ] } = PRMerged(1536, 3584, 121, 17, 7);