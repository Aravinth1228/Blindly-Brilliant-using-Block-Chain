// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMinter is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    event NFTMinted(address indexed recipient, uint256 tokenId, string tokenURI);

    // Pass msg.sender explicitly to the Ownable constructor to initialize the owner
    constructor() ERC721("PinataNFT", "PNFT") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    function mintNFT(address recipient, string memory tokenURI) public returns (uint256) {
        uint256 newTokenId = tokenCounter;
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        tokenCounter++;

        emit NFTMinted(recipient, newTokenId, tokenURI);
        return newTokenId;
    }
}
