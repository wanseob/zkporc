//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.0;

import {IVerifier} from "./interfaces/IVerifier.sol";

contract ZKPoRC {
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    struct ZKRedeemCode {
        uint256 message;
        uint256[2] signer;
        address claimer;
        Proof proof; // Claimer should generate a zkp using the redeem code.
    }

    address public immutable verifier;

    constructor(address verifier_) {
        verifier = verifier_;
    }

    function verify(ZKRedeemCode memory zkRedeemCode)
        public
        view
        returns (bool)
    {
        uint256[4] memory inputs;
        inputs[0] = zkRedeemCode.message;
        inputs[1] = uint256(uint160(zkRedeemCode.claimer));
        inputs[2] = zkRedeemCode.signer[0];
        inputs[3] = zkRedeemCode.signer[1];
        bool result = IVerifier(verifier).verifyProof(
            zkRedeemCode.proof.a,
            zkRedeemCode.proof.b,
            zkRedeemCode.proof.c,
            inputs
        );
        return result;
    }
}
