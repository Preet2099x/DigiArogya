// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EHRmain {
    // User roles
    enum Role { NONE, PATIENT, PROVIDER, RESEARCHER }
    
    // Data types
    enum DataType { EHR, PHR, LAB_RESULT, PRESCRIPTION, IMAGING }
    
    // Permission types
    enum PermissionType { NONE, INCENTIVEBASED, NONINCENTIVEBASED }
    
    // Status of permission requests
    enum RequestStatus { PENDING, APPROVED, REJECTED, EXPIRED }
    
    // Structs for storing user data
    struct User {
        address userAddress;
        Role role;
        uint256 registrationDate;
        bytes32 publicKeyHash;
    }

    // Struct for health records metadata
    struct HealthRecord {
        address owner;
        bytes32 dataHash;
        DataType dataType;
        bytes encryptedSymmetricKey;
        uint256 timestamp;
        bool isValid;
        address provider;
    }

    // Struct for permission requests
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

    // State variables
    mapping(address => User) public users;
    mapping(bytes32 => HealthRecord) public healthRecords;
    mapping(bytes32 => PermissionRequest) public permissionRequests;
    mapping(address => mapping(bytes32 => mapping(address => bool))) public permissions;
    
    // System variables
    address public systemOwner;
    uint256 public totalUsers;
    uint256 public totalRecords;
    uint256 public totalRequests;

    // Events
    event UserRegistered(address indexed userAddress, Role role);
    event HealthRecordAdded(bytes32 indexed dataHash, address indexed owner, DataType dataType);
    event PermissionRequested(bytes32 indexed requestId, address indexed requester, address indexed owner);
    event PermissionGranted(bytes32 indexed requestId, address indexed requester, address indexed owner);
    event PermissionRevoked(bytes32 indexed dataHash, address indexed revokedUser);
    // event RecordUpdated(bytes32 indexed dataHash, address indexed updater);
    event EmergencyAccess(address indexed provider, address indexed patient, uint256 timestamp);

    // Modifiers
    modifier onlySystemOwner() {
        require(msg.sender == systemOwner, "Only system owner can call this function");
        _;
    }

    modifier onlyProvider() {
        require(users[msg.sender].role == Role.PROVIDER, "Only healthcare providers can call this function");
        _;
    }

    modifier onlyPatient() {
        require(users[msg.sender].role == Role.PATIENT, "Only patients can call this function");
        _; 
    }

    modifier recordExists(bytes32 _dataHash) {
        require(healthRecords[_dataHash].isValid, "Record does not exist");
        _; 
    }

    // Constructor
    constructor() {
        systemOwner = msg.sender;
        totalUsers = 0;
        totalRecords = 0;
        totalRequests = 0;
    }

    // Registry Contract Functions
    function registerUser(
        Role _role,
        bytes32 _publicKeyHash
    ) external returns (bool) {
        require(users[msg.sender].userAddress == address(0), "User already registered");
        require(_role != Role.NONE, "Invalid role");

        users[msg.sender] = User({
            userAddress: msg.sender,
            role: _role,
            registrationDate: block.timestamp,
            publicKeyHash: _publicKeyHash
        });

        totalUsers++;
        emit UserRegistered(msg.sender, _role);
        return true;
    }

    function checkUser(address _userAddress) public view returns (Role) {
        return users[_userAddress].role;
    }

    // Data Contract Functions
    function addEHRData(
        address _patientAddress,
        bytes32 _dataHash,
        DataType _dataType,
        bytes memory _encryptedSymmetricKey
    ) external onlyProvider returns (bool) {
        require(_patientAddress != address(0), "Invalid patient address");
        require(healthRecords[_dataHash].dataHash == bytes32(0), "Record already exists");

        Role patientRole = checkUser(_patientAddress);
        require(patientRole == Role.PATIENT, "Invalid patient");

        healthRecords[_dataHash] = HealthRecord({
            owner: _patientAddress,
            dataHash: _dataHash,
            dataType: _dataType,
            encryptedSymmetricKey: _encryptedSymmetricKey,
            timestamp: block.timestamp,
            isValid: true,
            provider: msg.sender
        });

        totalRecords++;
        emit HealthRecordAdded(_dataHash, _patientAddress, _dataType);
        return true;
    }

    function addPHRData(
        bytes32 _dataHash,
        DataType _dataType
    ) external onlyPatient returns (bool) {
        require(healthRecords[_dataHash].dataHash == bytes32(0), "Record already exists");

        healthRecords[_dataHash] = HealthRecord({
            owner: msg.sender,
            dataHash: _dataHash,
            dataType: _dataType,
            encryptedSymmetricKey: new bytes(0),
            timestamp: block.timestamp,
            isValid: true,
            provider: msg.sender
        });

        totalRecords++;
        emit HealthRecordAdded(_dataHash, msg.sender, _dataType);
        return true;
    }

    // function updateRecord(
    //     bytes32 _dataHash,
    //     bytes memory _newEncryptedSymmetricKey
    // ) external recordExists(_dataHash) returns (bool) {
    //     HealthRecord storage record = healthRecords[_dataHash];
    //     require(msg.sender == record.owner || msg.sender == record.provider, "Unauthorized");

    //     record.encryptedSymmetricKey = _newEncryptedSymmetricKey;
    //     record.timestamp = block.timestamp;

    //     emit RecordUpdated(_dataHash, msg.sender);
    //     return true;
    // }

    function invalidateRecord(bytes32 _dataHash) 
        external 
        recordExists(_dataHash) 
        onlySystemOwner 
    {
        healthRecords[_dataHash].isValid = false;
    }

    // Permission Contract Functions
    function requestNonIncentiveBasedPermission(
        address _owner,
        bytes32 _dataHash,
        PermissionType _permissionType
    ) external recordExists(_dataHash) returns (bytes32) {
        require(_owner != address(0), "Invalid owner address");
        require(_permissionType != PermissionType.NONE, "Invalid permission type");
        require(healthRecords[_dataHash].owner == _owner, "Invalid record owner");

        bytes32 requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                _owner,
                _dataHash,
                block.timestamp
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
    ) external payable recordExists(_dataHash) returns (bytes32) {
        require(_owner != address(0), "Invalid owner address");
        require(_permissionType != PermissionType.NONE, "Invalid permission type");
        require(msg.value > 0, "Incentive amount required");
        require(healthRecords[_dataHash].owner == _owner, "Invalid record owner");

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
        bytes32 _requestId
    ) external returns (bool) {
        PermissionRequest storage request = permissionRequests[_requestId];
        require(request.owner == msg.sender, "Only owner can approve");
        require(request.status == RequestStatus.PENDING, "Invalid request status");
        require(block.timestamp <= request.expiryDate, "Request expired");

        request.status = RequestStatus.APPROVED;

        permissions[request.owner][_requestId][request.requester] = true;

        emit PermissionGranted(_requestId, request.requester, request.owner);
        return true;
    }

    function revokePermission(
        bytes32 _dataHash,
        address _user
    ) external onlySystemOwner returns (bool) {
        require(permissions[msg.sender][_dataHash][_user], "Permission not granted");

        permissions[msg.sender][_dataHash][_user] = false;
        emit PermissionRevoked(_dataHash, _user);
        return true;
    }

    // Emergency Access Function
    function emergencyAccess(address _patientAddress) external onlyProvider {
        emit EmergencyAccess(msg.sender, _patientAddress, block.timestamp);
    }

}
