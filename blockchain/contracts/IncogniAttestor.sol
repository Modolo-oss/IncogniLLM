// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract IncogniAttestor {
    // Event emitted when an attestation is recorded
    event AttestationRecorded(bytes32 indexed paymentId, bytes32 indexed responseHash, uint256 timestamp);

    // Mapping to store attestations: paymentId => responseHash
    mapping(bytes32 => bytes32) public attestations;

    // Function to record an attestation
    function attest(bytes32 paymentId, bytes32 responseHash) external {
        require(attestations[paymentId] == bytes32(0), "Attestation already exists for this payment ID");
        
        attestations[paymentId] = responseHash;
        
        emit AttestationRecorded(paymentId, responseHash, block.timestamp);
    }

    // Function to verify an attestation
    function verify(bytes32 paymentId, bytes32 responseHash) external view returns (bool) {
        return attestations[paymentId] == responseHash;
    }
}
