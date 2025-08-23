// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EHRStorage.sol";

contract EHRProxy is EHRStorage {
    // Mapping from the 4-byte function signature to the logic contract's address
    mapping(bytes4 => address) public logicContracts;

    constructor() {
        // The deployer of the Proxy becomes the system owner and initializes state
        systemOwner = msg.sender;
        totalUsers = 0;
        totalRecords = 0;
        totalRequests = 0;
    }

    // Owner function to link function signatures to their logic contracts
    function setLogicContracts(bytes4[] calldata _signatures, address _contractAddress) external {
        require(msg.sender == systemOwner, "Only owner can set logic contracts.");
        for (uint i = 0; i < _signatures.length; i++) {
            logicContracts[_signatures[i]] = _contractAddress;
        }
    }

    // Fallback function delegates calls to the appropriate logic contract
    fallback() external payable {
        address logicContract = logicContracts[msg.sig];
        require(logicContract != address(0), "EHRProxy: Function does not exist.");

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), logicContract, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    // Function to receive Ether
    receive() external payable {}
}