[![codecov][coverage-shield]][coverage-url]

# 🧾 Proof of Purchase

![pr0xy Banner](https://cdn.pr0xy.io/branding/pr0xy-github-banner.png)

Proof of Purchase is an ERC721 derivative which seeks to prove the purchase of off-chain goods and services or redeemables. In the case of redeemables, the receipt may allow a user to downloaded digital items or redeem physical items at a later date.

Receipts are considered "soulbound" to the purchaser's address and are non-transferrable. In the event that the receipt is no longer needed the user may burn the receipt to remove it from their wallet, implying the only valid `transferTo` address is the zero address.

## Souldbound EIP Standard

Proof of Purchase traditionally implements the ERC721 standard and employs the `_beforeTokenTransfer` function to restrict transfers (except to the zero address). It should be mentioned that their exist a number of "soulbound" EIP standards which may be more appropriate for the use case. However, since these are rarely implemented and potentially unsupported, we have opted to use the ERC721 standard.

## Alternative Gas Efficient Contracts

Sol-DAO offers an alternative gas efficient [ERC721](https://github.com/Sol-DAO/solbase) contract.

### <sub>_**Disclaimer**_</sub>

<sub>_pr0xy is not liable for the performance of any project. Utilizing the code in this repository does not impose any liability on pr0xy. Always be sure to have your code audited prior to launching your project. For any questions please reach out to [team@pr0xy.io](mailto:team@pr0xy.io)._</sub>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[coverage-shield]: https://codecov.io/gh/pr0xy-io/proof-of-purchase/branch/main/graph/badge.svg?token=H6VIWMBLOZ
[coverage-url]: https://codecov.io/gh/pr0xy-io/proof-of-purchase
