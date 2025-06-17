// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Brilline is ERC721URIStorage, Ownable {
    uint256 private _tokenCounter;
    uint256 public constant MAX_SUPPLY = 10000;

    event BrillineMinted(address indexed recipient, uint256 tokenId, string tokenURI);

    // Pass initialOwner (msg.sender) to Ownable explicitly
    constructor() ERC721("PinataNFT", "PNFT") Ownable(msg.sender) {
        _tokenCounter = 0;
    }

    function mintBrilline(address recipient, string memory tokenURI) public onlyOwner returns (uint256) {
        require(recipient != address(0), "Recipient cannot be the zero address");
        require(bytes(tokenURI).length > 0, "tokenURI cannot be empty");
        require(_tokenCounter < MAX_SUPPLY, "Max supply reached");

        uint256 newTokenId = _tokenCounter;
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _tokenCounter++;

        emit BrillineMinted(recipient, newTokenId, tokenURI);
        return newTokenId;
    }

    function getCurrentTokenId() external view returns (uint256) {
        return _tokenCounter;
    }
}
