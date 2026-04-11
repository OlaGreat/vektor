// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IConnectOracle {
    struct Price {
        uint256 price;
        uint256 timestamp;
        uint64 blockHeight;
        uint64 nonce;
        uint8 decimals;
        uint64 id;
    }

    function get_price(string memory pair_id) external view returns (Price memory);
    function get_prices(string[] memory pair_ids) external view returns (Price[] memory);
}
