// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EHRStorage.sol";

contract EHRmain is EHRStorage {
    // --- Modifiers needed for this contract ---
    modifier onlyProvider() {
        require(
            users[msg.sender].role == Role.DOCTOR ||
            users[msg.sender].role == Role.HOSPITAL ||
            users[msg.sender].role == Role.LAB ||
            users[msg.sender].role == Role.INSURANCE, // <-- ADD THIS LINE
            "Only healthcare providers can call this function"
        );
        _;
    }

    modifier onlyPatient() {
        require(users[msg.sender].role == Role.PATIENT, "Only patients can call this function");
        _;
    }

    modifier recordExists(string memory _ipfsCid) {
        require(healthRecords[_ipfsCid].owner != address(0), "Record does not exist");
        _;
    }
    
    modifier onlySystemOwner() {
        require(msg.sender == systemOwner, "Only system owner can call this function");
        _;
    }

    // --- Core Functions ---

    function registerUser(
        Role _role,
        bytes32 _publicKeyHash,
        string calldata _publicKeyForEncryption
    ) external returns (bool) {
        require(users[msg.sender].userAddress == address(0), "User already registered");
        require(_role != Role.NONE, "Invalid role");
        require(
            _role == Role.PATIENT ||
                _role == Role.DOCTOR ||
                _role == Role.RESEARCHER ||
                _role == Role.HOSPITAL ||
                _role == Role.INSURANCE ||
                _role == Role.AMBULANCE ||
                _role == Role.PHARMACY ||
                _role == Role.LAB,
            "Invalid role type"
        );

        users[msg.sender] = User({
            userAddress: msg.sender,
            role: _role,
            registrationDate: block.timestamp,
            publicKeyHash: _publicKeyHash
        });

        userKeys[msg.sender] = KeyPair({
            publicKeyForEncryption: _publicKeyForEncryption
        });

        totalUsers++;
        emit UserRegistered(msg.sender, _role);
        return true;
    }

    function addEHRData(
        address _patientAddress,
        string memory _ipfsCid,
        DataType _dataType,
        string memory _encryptedSymmetricKey
    ) external onlyProvider returns (bool) {
        require(_patientAddress != address(0), "Invalid patient address");
        require(bytes(healthRecords[_ipfsCid].ipfsCid).length == 0, "Record already exists");

        Role patientRole = users[_patientAddress].role;
        require(patientRole == Role.PATIENT, "Invalid patient");

        RecordStatus initialStatus = (_dataType == DataType.PRESCRIPTION) ? RecordStatus.PENDING : RecordStatus.VALID;

        healthRecords[_ipfsCid] = HealthRecord({
            owner: _patientAddress,
            ipfsCid: _ipfsCid,
            dataType: _dataType,
            encryptedSymmetricKey: _encryptedSymmetricKey,
            timestamp: block.timestamp,
            status: initialStatus,
            provider: msg.sender
        });

        ownerToHealthRecords[_patientAddress].push(_ipfsCid);
        totalRecords++;
        emit HealthRecordAdded(_ipfsCid, _patientAddress, _dataType);
        return true;
    }

    function addPHRData(
        string memory _ipfsCid,
        DataType _dataType,
        string calldata _encryptedSymmetricKey
    ) external onlyPatient returns (bool) {
        require(bytes(healthRecords[_ipfsCid].ipfsCid).length == 0, "Record already exists");

        RecordStatus initialStatus = (_dataType == DataType.PRESCRIPTION) ? RecordStatus.PENDING : RecordStatus.VALID;

        healthRecords[_ipfsCid] = HealthRecord({
            owner: msg.sender,
            ipfsCid: _ipfsCid,
            dataType: _dataType,
            encryptedSymmetricKey: _encryptedSymmetricKey,
            timestamp: block.timestamp,
            status: initialStatus,
            provider: msg.sender
        });

        ownerToHealthRecords[msg.sender].push(_ipfsCid);
        totalRecords++;
        emit HealthRecordAdded(_ipfsCid, msg.sender, _dataType);
        return true;
    }

    function requestNonIncentiveBasedPermission(
        address _owner,
        string memory _ipfsCid,
        PermissionType _permissionType
    ) external recordExists(_ipfsCid) returns (bytes32) {
        require(_owner != address(0), "Invalid owner address");
        require(
            keccak256(abi.encodePacked(healthRecords[_ipfsCid].owner)) ==
                keccak256(abi.encodePacked(_owner)),
            "Invalid record owner"
        );

        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, _owner, _ipfsCid, block.timestamp)
        );

        permissionRequests[requestId] = PermissionRequest({
            requester: msg.sender,
            owner: _owner,
            requestId: requestId,
            ipfsCid: _ipfsCid,
            permissionType: _permissionType,
            status: RequestStatus.PENDING,
            requestDate: block.timestamp,
            expiryDate: block.timestamp + 30 days,
            incentiveAmount: 0,
            isIncentiveBased: false
        });

        totalRequests++;
        emit PermissionRequested(requestId, msg.sender, _owner);
        permissionRequestIds.push(requestId);
        return requestId;
    }

    function requestIncentiveBasedPermission(
        address _owner,
        string memory _ipfsCid,
        PermissionType _permissionType
    ) external payable recordExists(_ipfsCid) returns (bytes32) {
        require(_owner != address(0), "Invalid owner address");
        require(msg.value > 0, "Incentive amount required");
        require(
            keccak256(abi.encodePacked(healthRecords[_ipfsCid].owner)) ==
                keccak256(abi.encodePacked(_owner)),
            "Invalid record owner"
        );

        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, _owner, _ipfsCid, block.timestamp)
        );

        permissionRequests[requestId] = PermissionRequest({
            requester: msg.sender,
            owner: _owner,
            requestId: requestId,
            ipfsCid: _ipfsCid,
            permissionType: _permissionType,
            status: RequestStatus.PENDING,
            requestDate: block.timestamp,
            expiryDate: block.timestamp + 30 days,
            incentiveAmount: msg.value,
            isIncentiveBased: true
        });

        totalRequests++;
        emit PermissionRequested(requestId, msg.sender, _owner);
        permissionRequestIds.push(requestId);
        return requestId;
    }

    function approvePermission(bytes32 _requestId) external returns (bool) {
        PermissionRequest storage request = permissionRequests[_requestId];
        require(request.owner == msg.sender, "Only owner can approve");
        require(request.status == RequestStatus.PENDING, "Invalid request status");
        require(block.timestamp <= request.expiryDate, "Request expired");

        request.status = RequestStatus.APPROVED;
        permissions[request.owner][request.ipfsCid][request.requester] = true;

        if (request.isIncentiveBased) {
            payable(request.owner).transfer(request.incentiveAmount);
        }

        emit PermissionGranted(_requestId, request.requester, request.owner);
        return true;
    }

    function revokePermission(string memory _ipfsCid, address _user)
        external
        recordExists(_ipfsCid)
        returns (bool)
    {
        require(
            msg.sender == healthRecords[_ipfsCid].owner || msg.sender == _user || msg.sender == systemOwner,
            "Not authorized to revoke this permission"
        );
        
        permissions[healthRecords[_ipfsCid].owner][_ipfsCid][_user] = false;

        for (uint i = 0; i < approvedRecords[_user].length; i++) {
            if (keccak256(abi.encodePacked(approvedRecords[_user][i].ipfsCid)) == keccak256(abi.encodePacked(_ipfsCid))) {
                approvedRecords[_user][i].status = false;
                break;
            }
        }
        
        emit PermissionRevoked(_ipfsCid, _user);
        return true;
    }


    // --- Core Getter Functions ---

    function getKeyPair(address userAddress) external view returns (string memory) {
        require(users[userAddress].userAddress != address(0), "User not registered");
        KeyPair memory keys = userKeys[userAddress];
        return (keys.publicKeyForEncryption);
    }

    function checkUser(address _userAddress) public view returns (Role) {
        return users[_userAddress].role;
    }

    function getHealthRecordsByOwner(address userAddress) public view returns (HealthRecord[] memory) {
        uint256 totalRecordsForOwner = ownerToHealthRecords[userAddress].length;
        HealthRecord[] memory records = new HealthRecord[](totalRecordsForOwner);
        for (uint256 i = 0; i < totalRecordsForOwner; i++) {
            string memory ipfsCid = ownerToHealthRecords[userAddress][i];
            records[i] = healthRecords[ipfsCid];
        }
        return records;
    }

    function getHealthRecordByIpfs(string memory recordId)
        public
        view
        returns (
            address owner,
            string memory ipfsCid,
            DataType dataType,
            string memory encryptedSymmetricKey,
            uint256 timestamp,
            RecordStatus status,
            address provider
        )
    {
        HealthRecord memory record = healthRecords[recordId];
        return (
            record.owner,
            record.ipfsCid,
            record.dataType,
            record.encryptedSymmetricKey,
            record.timestamp,
            record.status,
            record.provider
        );
    }

    function getPendingRequestsForPatient(address patient) external view returns (PermissionRequest[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < permissionRequestIds.length; i++) {
            bytes32 requestId = permissionRequestIds[i];
            PermissionRequest storage request = permissionRequests[requestId];
            if (request.owner == patient) {
                count++;
            }
        }

        PermissionRequest[] memory pendingRequests = new PermissionRequest[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < permissionRequestIds.length; i++) {
            bytes32 requestId = permissionRequestIds[i];
            PermissionRequest storage request = permissionRequests[requestId];
            if (request.owner == patient) {
                pendingRequests[index] = request;
                index++;
            }
        }
        return pendingRequests;
    }
}