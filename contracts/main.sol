// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HealthcareSystem {
    enum Role {
        NONE,
        PATIENT,
        PROVIDER,
        RESEARCHER,
        REGULATOR
    }

    enum DataType {
        EHR,
        PHR,
        LAB_RESULT,
        PRESCRIPTION,
        IMAGING
    }

    enum PermissionType {
        NONE,
        READ,
        WRITE,
        FULL
    }

    enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED,
        EXPIRED
    }

    struct User {
        address userAddress;
        Role role;
        bool isActive;
        uint256 registrationDate;
        bytes32 publicKeyHash;
        bool isVerified;
    }

    struct HealthRecord {
        address owner;
        bytes32 dataHash;
        DataType dataType;
        bytes encryptedSymmetricKey;
        uint256 timestamp;
        bool isValid;
        address provider;
        bytes signature;
    }

    struct PermissionRequest {
        address requester;
        address owner;
        bytes32 dataHash;
        PermissionType permissionType;
        RequestStatus status;
        uint256 requestDate;
        uint256 expiryDate;
        uint256 incentiveAmount;
        bool isIncentiveBased;
    }

    mapping(address => User) public users;
    mapping(bytes32 => HealthRecord) public healthRecords;
    mapping(bytes32 => PermissionRequest) public permissionRequests;
    mapping(address => mapping(bytes32 => mapping(address => bool)))
        public permissions;

    address public systemOwner;
    uint256 public totalUsers;
    uint256 public totalRecords;
    uint256 public totalRequests;

    event UserRegistered(address indexed userAddress, Role role);
    event HealthRecordAdded(
        bytes32 indexed dataHash,
        address indexed owner,
        DataType dataType
    );
    event PermissionRequested(
        bytes32 indexed requestId,
        address indexed requester,
        address indexed owner
    );
    event PermissionGranted(
        bytes32 indexed requestId,
        address indexed requester,
        address indexed owner
    );
    event PermissionRevoked(
        bytes32 indexed dataHash,
        address indexed revokedUser
    );
    event RecordUpdated(bytes32 indexed dataHash, address indexed updater);
    event UserVerified(address indexed userAddress);
    event EmergencyAccess(
        address indexed provider,
        address indexed patient,
        uint256 timestamp
    );

    modifier onlySystemOwner() {
        require(
            msg.sender == systemOwner,
            "Only system owner can call this function"
        );
        _;
    }

    modifier onlyVerifiedUser() {
        require(users[msg.sender].isVerified, "User is not verified");
        _;
    }

    modifier onlyProvider() {
        require(
            users[msg.sender].role == Role.PROVIDER,
            "Only healthcare providers can call this function"
        );
        _;
    }

    modifier onlyPatient() {
        require(
            users[msg.sender].role == Role.PATIENT,
            "Only patients can call this function"
        );
        _;
    }

    modifier recordExists(bytes32 _dataHash) {
        require(healthRecords[_dataHash].isValid, "Record does not exist");
        _;
    }

    constructor() {
        systemOwner = msg.sender;
        totalUsers = 0;
        totalRecords = 0;
        totalRequests = 0;
    }

    function registerUser(
        Role _role,
        bytes32 _publicKeyHash
    ) external returns (bool) {
        require(
            users[msg.sender].userAddress == address(0),
            "User already registered"
        );
        require(_role != Role.NONE, "Invalid role");

        users[msg.sender] = User({
            userAddress: msg.sender,
            role: _role,
            isActive: true,
            registrationDate: block.timestamp,
            publicKeyHash: _publicKeyHash,
            isVerified: false
        });

        totalUsers++;
        emit UserRegistered(msg.sender, _role);
        return true;
    }

    function verifyUser(address _userAddress) external onlySystemOwner {
        require(
            users[_userAddress].userAddress != address(0),
            "User does not exist"
        );
        require(!users[_userAddress].isVerified, "User already verified");

        users[_userAddress].isVerified = true;
        emit UserVerified(_userAddress);
    }

    function deactivateUser(address _userAddress) external onlySystemOwner {
        require(
            users[_userAddress].userAddress != address(0),
            "User does not exist"
        );
        require(users[_userAddress].isActive, "User already deactivated");

        users[_userAddress].isActive = false;
    }

    function checkUser(address _userAddress) public view returns (bool, Role) {
        User memory user = users[_userAddress];
        return (user.isActive && user.isVerified, user.role);
    }

    function addEHRData(
        address _patientAddress,
        bytes32 _dataHash,
        DataType _dataType,
        bytes memory _encryptedSymmetricKey,
        bytes memory _signature
    ) external onlyProvider onlyVerifiedUser returns (bool) {
        require(_patientAddress != address(0), "Invalid patient address");
        require(
            healthRecords[_dataHash].dataHash == bytes32(0),
            "Record already exists"
        );

        (bool isValid, Role role) = checkUser(_patientAddress);
        require(isValid && role == Role.PATIENT, "Invalid patient");

        healthRecords[_dataHash] = HealthRecord({
            owner: _patientAddress,
            dataHash: _dataHash,
            dataType: _dataType,
            encryptedSymmetricKey: _encryptedSymmetricKey,
            timestamp: block.timestamp,
            isValid: true,
            provider: msg.sender,
            signature: _signature
        });

        totalRecords++;
        emit HealthRecordAdded(_dataHash, _patientAddress, _dataType);
        return true;
    }

    function addPHRData(
        bytes32 _dataHash,
        DataType _dataType,
        bytes memory _signature
    ) external onlyPatient onlyVerifiedUser returns (bool) {
        require(
            healthRecords[_dataHash].dataHash == bytes32(0),
            "Record already exists"
        );

        healthRecords[_dataHash] = HealthRecord({
            owner: msg.sender,
            dataHash: _dataHash,
            dataType: _dataType,
            encryptedSymmetricKey: new bytes(0),
            timestamp: block.timestamp,
            isValid: true,
            provider: msg.sender,
            signature: _signature
        });

        totalRecords++;
        emit HealthRecordAdded(_dataHash, msg.sender, _dataType);
        return true;
    }

    function updateRecord(
        bytes32 _dataHash,
        bytes memory _newEncryptedSymmetricKey,
        bytes memory _newSignature
    ) external recordExists(_dataHash) returns (bool) {
        HealthRecord storage record = healthRecords[_dataHash];
        require(
            msg.sender == record.owner || msg.sender == record.provider,
            "Unauthorized"
        );

        record.encryptedSymmetricKey = _newEncryptedSymmetricKey;
        record.signature = _newSignature;
        record.timestamp = block.timestamp;

        emit RecordUpdated(_dataHash, msg.sender);
        return true;
    }

    function invalidateRecord(
        bytes32 _dataHash
    ) external recordExists(_dataHash) onlySystemOwner {
        healthRecords[_dataHash].isValid = false;
    }

    function requestNonIncentiveBasedPermission(
        address _owner,
        bytes32 _dataHash,
        PermissionType _permissionType
    ) external onlyVerifiedUser recordExists(_dataHash) returns (bytes32) {
        require(_owner != address(0), "Invalid owner address");
        require(
            _permissionType != PermissionType.NONE,
            "Invalid permission type"
        );
        require(
            healthRecords[_dataHash].owner == _owner,
            "Invalid record owner"
        );

        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, _owner, _dataHash, block.timestamp)
        );

        permissionRequests[requestId] = PermissionRequest({
            requester: msg.sender,
            owner: _owner,
            dataHash: _dataHash,
            permissionType: _permissionType,
            status: RequestStatus.PENDING,
            requestDate: block.timestamp,
            expiryDate: block.timestamp + 30 days,
            incentiveAmount: 0,
            isIncentiveBased: false
        });

        totalRequests++;
        emit PermissionRequested(requestId, msg.sender, _owner);
        return requestId;
    }

    function requestIncentiveBasedPermission(
        address _owner,
        bytes32 _dataHash,
        PermissionType _permissionType
    )
        external
        payable
        onlyVerifiedUser
        recordExists(_dataHash)
        returns (bytes32)
    {
        require(_owner != address(0), "Invalid owner address");
        require(
            _permissionType != PermissionType.NONE,
            "Invalid permission type"
        );
        require(msg.value > 0, "Incentive amount required");
        require(
            healthRecords[_dataHash].owner == _owner,
            "Invalid record owner"
        );

        bytes32 requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                _owner,
                _dataHash,
                block.timestamp,
                msg.value
            )
        );

        permissionRequests[requestId] = PermissionRequest({
            requester: msg.sender,
            owner: _owner,
            dataHash: _dataHash,
            permissionType: _permissionType,
            status: RequestStatus.PENDING,
            requestDate: block.timestamp,
            expiryDate: block.timestamp + 30 days,
            incentiveAmount: msg.value,
            isIncentiveBased: true
        });

        totalRequests++;
        emit PermissionRequested(requestId, msg.sender, _owner);
        return requestId;
    }

    function approvePermission(
        bytes32 _requestId,
        bytes memory _encryptedKeyForRequester
    ) external onlyVerifiedUser returns (bool) {
        PermissionRequest storage request = permissionRequests[_requestId];
        require(request.owner == msg.sender, "Only owner can approve");
        require(
            request.status == RequestStatus.PENDING,
            "Invalid request status"
        );
        require(block.timestamp <= request.expiryDate, "Request expired");

        request.status = RequestStatus.APPROVED;
        permissions[request.requester][request.dataHash][msg.sender] = true;

        if (request.isIncentiveBased) {
            payable(msg.sender).transfer(request.incentiveAmount);
        }

        emit PermissionGranted(_requestId, request.requester, msg.sender);
        return true;
    }

    function revokePermission(
        address _revokedUser,
        bytes32 _dataHash
    ) external recordExists(_dataHash) {
        require(
            msg.sender == healthRecords[_dataHash].owner,
            "Only owner can revoke"
        );
        require(
            permissions[_revokedUser][_dataHash][msg.sender],
            "Permission does not exist"
        );

        permissions[_revokedUser][_dataHash][msg.sender] = false;
        emit PermissionRevoked(_dataHash, _revokedUser);
    }

    function checkPermission(
        address _user,
        bytes32 _dataHash
    ) external view returns (bool) {
        return permissions[_user][_dataHash][healthRecords[_dataHash].owner];
    }

    function grantEmergencyAccess(
        address _provider,
        bytes32 _dataHash
    ) external onlyPatient recordExists(_dataHash) {
        require(_provider != address(0), "Invalid provider address");
        (bool isValid, Role role) = checkUser(_provider);
        require(isValid && role == Role.PROVIDER, "Invalid provider");

        permissions[_provider][_dataHash][msg.sender] = true;
        emit EmergencyAccess(_provider, msg.sender, block.timestamp);
    }

    function getRecordDetails(
        bytes32 _dataHash
    )
        external
        view
        recordExists(_dataHash)
        returns (
            address owner,
            DataType dataType,
            uint256 timestamp,
            address provider,
            bool isValid
        )
    {
        HealthRecord memory record = healthRecords[_dataHash];
        return (
            record.owner,
            record.dataType,
            record.timestamp,
            record.provider,
            record.isValid
        );
    }

    function getEncryptedKey(
        bytes32 _dataHash
    ) external view recordExists(_dataHash) returns (bytes memory) {
        require(
            msg.sender == healthRecords[_dataHash].owner ||
                permissions[msg.sender][_dataHash][
                    healthRecords[_dataHash].owner
                ],
            "Unauthorized"
        );
        return healthRecords[_dataHash].encryptedSymmetricKey;
    }
}
