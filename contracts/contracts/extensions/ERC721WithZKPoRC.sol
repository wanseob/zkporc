//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "../ZKPoRC.sol";

contract ERC721WithZKPoRC is ERC721, ZKPoRC, EIP712 {
    uint256[2] public signer;

    bytes32 private immutable _MINT_TYPEHASH =
        keccak256("MintWithZKPoRC(uint256 tokenId)");

    uint256 private constant _SNARK_FIELD =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory version_,
        address verifier_,
        uint256[2] memory signer_
    ) ERC721(name_, symbol_) ZKPoRC(verifier_) EIP712(name_, version_) {
        signer = signer_;
    }

    modifier validProof(
        address to,
        uint256 tokenId,
        Proof memory proof
    ) {
        require(
            verifyRedeemCode(to, tokenId, proof),
            "ERC721WithZKPoRC: Failed to verify ZKPoRC"
        );
        _;
    }

    function verifyRedeemCode(
        address to,
        uint256 tokenId,
        Proof memory proof
    ) public view returns (bool) {
        bytes32 structHash = keccak256(abi.encode(_MINT_TYPEHASH, tokenId));
        bytes32 digest = _hashTypedDataV4(structHash);
        uint256 message = uint256(digest) % _SNARK_FIELD;
        ZKRedeemCode memory zkRedeemCode;
        zkRedeemCode.message = message;
        zkRedeemCode.claimer = to;
        zkRedeemCode.signer = signer;
        zkRedeemCode.proof = proof;
        return verify(zkRedeemCode);
    }

    function _mintWithZKPoRC(
        address to,
        uint256 tokenId,
        Proof memory proof
    ) internal validProof(to, tokenId, proof) {
        _mint(to, tokenId);
    }

    function _safeMintWithZKPoRC(
        address to,
        uint256 tokenId,
        Proof memory proof
    ) internal {
        _safeMintWithZKPoRC(to, tokenId, proof, "");
    }

    function _safeMintWithZKPoRC(
        address to,
        uint256 tokenId,
        Proof memory proof,
        bytes memory _data
    ) internal validProof(to, tokenId, proof) {
        _safeMint(to, tokenId, _data);
    }
}
