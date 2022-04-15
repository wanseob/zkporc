pragma circom 2.0.0;
include "../../node_modules/circomlib/circuits/eddsaposeidon.circom";

template ZKPoRC() {
    // public
    signal input message;
    signal input account;
    signal input Ax;
    signal input Ay;
    // private
    signal input sigS;
    signal input sigR8x;
    signal input sigR8y;

    component verifier = EdDSAPoseidonVerifier();

    verifier.enabled <== 1;
    verifier.Ax <== Ax;
    verifier.Ay <== Ay;
    verifier.S <== sigS;
    verifier.R8x <== sigR8x;
    verifier.R8y <== sigR8y;
    verifier.M <== message;
}

component main { public [message, account, Ax, Ay] } = ZKPoRC();
