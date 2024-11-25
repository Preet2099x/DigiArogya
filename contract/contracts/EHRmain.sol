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
        string ipfsCid; // Replaced dataHash with ipfsCid
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
        string ipfsCid; // Replaced dataHash with ipfsCid
        PermissionType permissionType;
        RequestStatus status;
        uint256 requestDate;
        uint256 expiryDate;
        uint256 incentiveAmount;
        bool isIncentiveBased;
    }

    // State variables
    mapping(address => User) public users;
    mapping(string => HealthRecord) public healthRecords; // Changed data type from bytes32 to string
    mapping(string => PermissionRequest) public permissionRequests; // Changed data type from bytes32 to string
    mapping(address => mapping(string => mapping(address => bool))) public permissions;

    // Mapping to store health record IPFS CIDs by owner address
    mapping(address => string[]) public ownerToHealthRecords;
    
    // System variables
    address public systemOwner;
    uint256 public totalUsers;
    uint256 public totalRecords;
    uint256 public totalRequests;

    // Events
    event UserRegistered(address indexed userAddress, Role role);
    event HealthRecordAdded(string indexed ipfsCid, address indexed owner, DataType dataType);
    event PermissionRequested(string indexed requestId, address indexed requester, address indexed owner);
    event PermissionGranted(string indexed requestId, address indexed requester, address indexed owner);
    event PermissionRevoked(string indexed ipfsCid, address indexed revokedUser);
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

    modifier recordExists(string memory _ipfsCid) {
        require(healthRecords[_ipfsCid].isValid, "Record does not exist");
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
        string memory _ipfsCid,
        DataType _dataType,
        bytes memory _encryptedSymmetricKey
    ) external onlyProvider returns (bool) {
        require(_patientAddress != address(0), "Invalid patient address");
        require(bytes(healthRecords[_ipfsCid].ipfsCid).length == 0, "Record already exists");

        Role patientRole = checkUser(_patientAddress);
        require(patientRole == Role.PATIENT, "Invalid patient");

        healthRecords[_ipfsCid] = HealthRecord({
            owner: _patientAddress,
            ipfsCid: _ipfsCid,
            dataType: _dataType,
            encryptedSymmetricKey: _encryptedSymmetricKey,
            timestamp: block.timestamp,
            isValid: true,
            provider: msg.sender
        });

        ownerToHealthRecords[_patientAddress].push(_ipfsCid);  // Store the CID for the owner
        
        totalRecords++;
        emit HealthRecordAdded(_ipfsCid, _patientAddress, _dataType);
        return true;
    }

    function addPHRData(
        string memory _ipfsCid,
        DataType _dataType
    ) external onlyPatient returns (bool) {
        require(bytes(healthRecords[_ipfsCid].ipfsCid).length == 0, "Record already exists");

        healthRecords[_ipfsCid] = HealthRecord({
            owner: msg.sender,
            ipfsCid: _ipfsCid,
            dataType: _dataType,
            encryptedSymmetricKey: new bytes(0),
            timestamp: block.timestamp,
            isValid: true,
            provider: msg.sender
        });

        ownerToHealthRecords[msg.sender].push(_ipfsCid);  // Store the CID for the owner
        
        totalRecords++;
        emit HealthRecordAdded(_ipfsCid, msg.sender, _dataType);
        return true;
    }

    function invalidateRecord(string memory _ipfsCid) 
        external 
        recordExists(_ipfsCid) 
        onlySystemOwner 
    {
        healthRecords[_ipfsCid].isValid = false;
    }

    // Permission Contract Functions
    function requestNonIncentiveBasedPermission(
        address _owner,
        string memory _ipfsCid,
        PermissionType _permissionType
    ) external recordExists(_ipfsCid) returns (string memory) {
        require(_owner != address(0), "Invalid owner address");
        require(_permissionType != PermissionType.NONE, "Invalid permission type");
        require(keccak256(abi.encodePacked(healthRecords[_ipfsCid].owner)) == keccak256(abi.encodePacked(_owner)), "Invalid record owner");

        string memory requestId = string(abi.encodePacked(
            msg.sender,
            _owner,
            _ipfsCid,
            block.timestamp
        ));

        permissionRequests[requestId] = PermissionRequest({
            requester: msg.sender,
            owner: _owner,
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
        return requestId;
    }

    function requestIncentiveBasedPermission(
        address _owner,
        string memory _ipfsCid,
        PermissionType _permissionType
    ) external payable recordExists(_ipfsCid) returns (string memory) {
        require(_owner != address(0), "Invalid owner address");
        require(_permissionType != PermissionType.NONE, "Invalid permission type");
        require(msg.value > 0, "Incentive amount required");
        require(keccak256(abi.encodePacked(healthRecords[_ipfsCid].owner)) == keccak256(abi.encodePacked(_owner)), "Invalid record owner");
        
        string memory requestId = string(abi.encodePacked(
            msg.sender,
            _owner,
            _ipfsCid,
            block.timestamp,
            msg.value
        ));

        permissionRequests[requestId] = PermissionRequest({
            requester: msg.sender,
            owner: _owner,
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
        return requestId;
    }

    function approvePermission(
    string memory _requestId,
    bytes memory _encryptedSymmetricKey // Added encrypted symmetric key as parameter
) external returns (bool) {
    PermissionRequest storage request = permissionRequests[_requestId];
    require(request.owner == msg.sender, "Only owner can approve");
    require(request.status == RequestStatus.PENDING, "Invalid request status");
    require(block.timestamp <= request.expiryDate, "Request expired");

   
    request.status = RequestStatus.APPROVED;

    // Update permissions mapping to grant access
    permissions[request.owner][request.ipfsCid][request.requester] = true;

    // Update the encrypted symmetric key in the corresponding health record
    HealthRecord storage record = healthRecords[request.ipfsCid];
    record.encryptedSymmetricKey = _encryptedSymmetricKey;

    emit PermissionGranted(_requestId, request.requester, request.owner);
    return true;
}


    function revokePermission(
        string memory _ipfsCid,
        address _user
    ) external recordExists(_ipfsCid) onlySystemOwner returns (bool) {
        permissions[healthRecords[_ipfsCid].owner][_ipfsCid][_user] = false;
        emit PermissionRevoked(_ipfsCid, _user);
        return true;
    }

    // Access control
    function getHealthRecordsByOwner(address userAddress) 
    public view returns (HealthRecord[] memory) 
{
    uint256 totalRecordsForOwner = ownerToHealthRecords[userAddress].length;
    HealthRecord[] memory records = new HealthRecord[](totalRecordsForOwner);
    
    // Loop through each record of the owner and populate the HealthRecord array
    for (uint256 i = 0; i < totalRecordsForOwner; i++) {
        string memory ipfsCid = ownerToHealthRecords[userAddress][i];
        HealthRecord memory record = healthRecords[ipfsCid];
        records[i] = record;
    }
    
    return records;
    }

    // Emergency Access
    function emergencyAccess(address _patientAddress) 
        external onlyProvider returns (bool) 
    {
        require(keccak256(abi.encodePacked(users[_patientAddress].role)) == keccak256(abi.encodePacked(Role.PATIENT)), "Patient not found");
        
        emit EmergencyAccess(msg.sender, _patientAddress, block.timestamp);
        return true;
    }
}