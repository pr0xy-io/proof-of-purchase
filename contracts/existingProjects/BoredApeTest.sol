// SPDX-License-Identifier: MIT
// Originally written by Yuga Labs
// With minimal updates by pr0xy
// Disclaimer: This contract is purely for educational purposes and is not
//  meant to be used in a live environment. pr0xy takes no responsibility
//  for the use of this contract for commercial or otherwise malicious purposes.

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BoredApeTest contract
 * @dev Extends ERC721 Non-Fungible Token Standard basic implementation
 */
contract BoredApeTest is ERC721Enumerable, Ownable {
    using SafeMath for uint256;

    uint public constant maxApePurchase = 5;

    string public staticURI;

    constructor(string memory name, string memory symbol, string memory _staticURI) ERC721(name, symbol) {
        setStaticURI(_staticURI);
    }

    function setStaticURI(string memory _staticURI) public onlyOwner {
        staticURI = _staticURI;
    }

    function mintApe(uint numberOfTokens) public {
        require(numberOfTokens <= maxApePurchase, "Can only mint 5 tokens at a time");
        
        for(uint i = 0; i < numberOfTokens; i++) {
            uint mintIndex = totalSupply();
                _safeMint(msg.sender, mintIndex);
        }
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return staticURI;
    }
}