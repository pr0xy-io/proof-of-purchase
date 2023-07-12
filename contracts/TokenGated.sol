// SPDX-License-Identifier: MIT
// POP Contracts v0.0.4
// Written by pr0xy

pragma solidity ^0.8.18;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

/** @dev initializes the primary collection and allows access to `ownerOf` */
interface Primary {
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

contract TokenGated is ERC721AQueryable, ERC2981, Ownable, ReentrancyGuard, PaymentSplitter {
    using Strings for uint256;

    // fund recipients
    address[] public payees;

    // defines the price of the receipts
    uint256 public price;

    // references the metadata location
    string public baseURI;

    // indicates whether receipts can be purchased or not
    bool public active;

    // references the primary collection to generate receipts for
    address public primaryCollection;

    // maps the receipt to the primary collections `tokenId`
    mapping(uint256 => uint256) public receiptFor;

    constructor(address _primaryCollection, uint256 _price, address[] memory _payees, uint256[] memory _shares) ERC721A("TokenGated", "POP") PaymentSplitter(_payees, _shares) {
        primaryCollection = _primaryCollection;
        payees= _payees;

        setPrice(_price);
    }

    /** @dev sets the price to the desired price per receipt */
    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
    }

    /** @dev `active` determines if the claim is permitted */
    function setActive(bool _active) external onlyOwner {
        active = _active;
    }

    /** @dev override to set the starting token id */
    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    /** @dev override to return the local version of `baseURI` */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /** @dev sets the `baseURI` variable which references the storage of the images and metadata */
    function setBaseURI(string calldata baseURI_) public onlyOwner {
        baseURI = baseURI_;
    }

    /** @dev purchase a receipt and validate the desired `tokenId`(s) owner */
    function purchase(uint256[] memory primaryIds) public payable {
        require(active, "purchasing receipts is not active");
        require(tx.origin == msg.sender, "contracts are not permitted");
        require(msg.value >= price * primaryIds.length, "insufficient ether provided");

        for(uint256 i; i < primaryIds.length; i++) {
            require(Primary(primaryCollection).ownerOf(primaryIds[i]) == msg.sender, "invalid owner of primary token");
            _mint(msg.sender, 1);
            receiptFor[_totalMinted()] = primaryIds[i];
        }
    }

    /** @dev allows the owner to mint for a user */
    function generate(address to, uint256[] memory primaryIds) external onlyOwner {
        require(active, "purchasing receipts is not active");
        require(tx.origin == msg.sender, "contracts are not permitted");

        for(uint256 i; i < primaryIds.length; i++) {
            require(Primary(primaryCollection).ownerOf(primaryIds[i]) == to, "invalid owner of primary token");
            _mint(to, 1);
            receiptFor[_totalMinted()] = primaryIds[i];
        }
    }

    /** @dev the token is considered soulbound, and therefore restricted from transfers */
    function _beforeTokenTransfers(address from, address to, uint256 startTokenId, uint256 quantity) internal virtual override {
        require(to == address(0) || from == address(0), "token is soulbound");
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721A, ERC2981, IERC721A) returns (bool) {
        return ERC721A.supportsInterface(interfaceId) || ERC2981.supportsInterface(interfaceId);
    }

    /** @dev releases ether from the contract */
    function releaseTotal() external nonReentrant {
        for(uint256 i; i < payees.length; ++i) {
            release(payable(payees[i]));
        }
    }
}