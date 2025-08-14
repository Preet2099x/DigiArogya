// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EHRStorage.sol";

contract EHRmain is EHRStorage {
    // Modifiers
    modifier onlySystemOwner() {
        require(msg.sender == systemOwner, "Only system owner can call this function");
        _;
    }

    modifier onlyProvider() {
        require(
            users[msg.sender].role == Role.DOCTOR ||
            users[msg.sender].role == Role.HOSPITAL ||
            users[msg.sender].role == Role.LAB,
            "Only healthcare providers can call this function"
        );
        _;
    }
    
    modifier onlyHospital() {
        require(users[msg.sender].role == Role.HOSPITAL, "Only hospitals can perform this action");
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

    modifier onlyAmbulance() {
        require(users[msg.sender].role == Role.AMBULANCE, "Only ambulance services can call this function");
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

    function getKeyPair(address userAddress) external view returns (string memory) {
        require(users[userAddress].userAddress != address(0), "User not registered");
        KeyPair memory keys = userKeys[userAddress];
        return (keys.publicKeyForEncryption);
    }

    function checkUser(address _userAddress) public view returns (Role) {
        return users[_userAddress].role;
    }

    function addEHRData(
        address _patientAddress,
        string memory _ipfsCid,
        DataType _dataType,
        string memory _encryptedSymmetricKey
    ) external onlyProvider returns (bool) {
        require(_patientAddress != address(0), "Invalid patient address");
        require(bytes(healthRecords[_ipfsCid].ipfsCid).length == 0, "Record already exists");

        Role patientRole = checkUser(_patientAddress);
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

    function addApprovedRecord(
        address _owner,
        address _careProvider,
        string memory _ipfsCid,
        DataType _dataType,
        string memory _encryptedSymmetricKey,
        uint256 _approvedDate,
        uint256 _expiryDate
    ) public {
        require(_owner != address(0), "Invalid owner address");
        require(_careProvider != address(0), "Invalid care provider address");
        require(bytes(_ipfsCid).length > 0, "IPFS CID cannot be empty");
        require(_approvedDate <= block.timestamp, "Approved date cannot be in the future");
        require(_expiryDate > _approvedDate, "Expiry date must be after approved date");

        approvedRecord memory newRecord = approvedRecord({
            owner: _owner,
            careProvider: _careProvider,
            ipfsCid: _ipfsCid,
            dataType: _dataType,
            encryptedSymmetricKey: _encryptedSymmetricKey,
            approvedDate: block.timestamp,
            expiryDate: _expiryDate,
            status: true
        });

        approvedRecords[_careProvider].push(newRecord);
        approvedRecordsByID[_ipfsCid] = newRecord;

        emit ApprovedRecordAdded(
            _owner,
            _careProvider,
            _ipfsCid,
            _dataType,
            _encryptedSymmetricKey,
            _approvedDate,
            _expiryDate,
            true
        );
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

    function getRecordsByCareProvider(address _careProvider)
        public
        view
        returns (approvedRecord[] memory)
    {
        require(_careProvider != address(0), "Invalid care provider address");

        uint256 pendingPrescriptionCount = 0;
        for (uint i = 0; i < approvedRecords[_careProvider].length; i++) {
            approvedRecord storage ar = approvedRecords[_careProvider][i];
            HealthRecord storage hr = healthRecords[ar.ipfsCid];
            if (ar.status == true && hr.dataType == DataType.PRESCRIPTION && hr.status == RecordStatus.PENDING) {
                pendingPrescriptionCount++;
            }
        }

        approvedRecord[] memory pendingPrescriptions = new approvedRecord[](pendingPrescriptionCount);
        uint256 index = 0;
        for (uint j = 0; j < approvedRecords[_careProvider].length; j++) {
            approvedRecord storage ar = approvedRecords[_careProvider][j];
            HealthRecord storage hr = healthRecords[ar.ipfsCid];
            if (ar.status == true && hr.dataType == DataType.PRESCRIPTION && hr.status == RecordStatus.PENDING) {
                pendingPrescriptions[index] = ar;
                index++;
            }
        }
        return pendingPrescriptions;
    }

    function getRecordsForResearcher(address requester, string memory recordId) 
        public 
        view 
        returns (approvedRecord memory) 
    {
        require(requester != address(0), "Invalid address");
        require(users[requester].role == Role.RESEARCHER, "Only researchers can access this function");

        approvedRecord memory record = approvedRecordsByID[recordId];
        require(record.status, "Record is not active");
        require(block.timestamp <= record.expiryDate, "Access has expired");
        return record;
    }

    function invalidateRecord(string memory _ipfsCid)
        external
        recordExists(_ipfsCid)
        onlySystemOwner
    {
        healthRecords[_ipfsCid].status = RecordStatus.INVALID;
    }

    function getPermissionRequest(bytes32 requestId)
        public
        view
        returns (
            address requester,
            address owner,
            string memory ipfsCid,
            uint256 requestDate,
            uint256 expiryDate,
            uint256 incentiveAmount,
            bool isIncentiveBased,
            uint8 status
        )
    {
        PermissionRequest storage request = permissionRequests[requestId];
        return (
            request.requester,
            request.owner,
            request.ipfsCid,
            request.requestDate,
            request.expiryDate,
            request.incentiveAmount,
            request.isIncentiveBased,
            uint8(request.status)
        );
    }

    function emergencyAccess(address _patientAddress) external onlyAmbulance returns (bool) {
        require(users[_patientAddress].role == Role.PATIENT, "Invalid patient address");
        
        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, _patientAddress, block.timestamp)
        );

        permissionRequests[requestId] = PermissionRequest({
            requestId: requestId,
            requester: msg.sender,
            owner: _patientAddress,
            ipfsCid: "",
            permissionType: PermissionType.EMERGENCY_ACCESS,
            status: RequestStatus.APPROVED,
            requestDate: block.timestamp,
            expiryDate: block.timestamp + 24 hours,
            incentiveAmount: 0,
            isIncentiveBased: false
        });

        emergencyAccesses[msg.sender][_patientAddress] = true;
        emit EmergencyAccess(msg.sender, _patientAddress, block.timestamp);
        return true;
    }

    function checkEmergencyAccess(address _ambulance, address _patient) 
        public 
        view 
        returns (bool) 
    {
        return emergencyAccesses[_ambulance][_patient];
    }

    function revokeEmergencyAccess(address _ambulance, address _patient) 
        external 
        onlySystemOwner 
        returns (bool) 
    {
        require(emergencyAccesses[_ambulance][_patient], "No emergency access exists");
        emergencyAccesses[_ambulance][_patient] = false;
        return true;
    }

    function requestBatchAccess(address _owner) external returns (bytes32) {
        require(_owner != address(0), "Invalid owner address");
        require(users[_owner].role == Role.PATIENT, "Owner must be a patient");
        
        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, _owner, block.timestamp)
        );
        
        permissionRequests[requestId] = PermissionRequest({
            requester: msg.sender,
            owner: _owner,
            requestId: requestId,
            ipfsCid: "",
            permissionType: PermissionType.VIEW,
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

    function approveBatchAccess(bytes32 _requestId) external returns (bool) {
        require(permissionRequests[_requestId].owner == msg.sender, "Only the owner can approve");
        require(permissionRequests[_requestId].status == RequestStatus.PENDING, "Invalid request status");
        require(block.timestamp <= permissionRequests[_requestId].expiryDate, "Request expired");

        permissionRequests[_requestId].status = RequestStatus.APPROVED;
        
        string[] memory patientRecords = ownerToHealthRecords[msg.sender];
        for (uint i = 0; i < patientRecords.length; i++) {
            permissions[msg.sender][patientRecords[i]][permissionRequests[_requestId].requester] = true;
            
            HealthRecord memory record = healthRecords[patientRecords[i]];
            addApprovedRecord(
                msg.sender,
                permissionRequests[_requestId].requester,
                patientRecords[i],
                record.dataType,
                record.encryptedSymmetricKey,
                block.timestamp,
                permissionRequests[_requestId].expiryDate
            );
        }

        emit PermissionGranted(_requestId, permissionRequests[_requestId].requester, msg.sender);
        return true;
    }

    function bookAppointment(
        address _patientAddress,
        string memory _hospitalName,
        string memory _roomType
    ) external onlyHospital {
        require(users[_patientAddress].userAddress != address(0), "Patient is not registered");

        Appointment memory newAppointment = Appointment({
            patientAddress: _patientAddress,
            hospitalAddress: msg.sender,
            hospitalName: _hospitalName,
            roomType: _roomType,
            bookingDate: block.timestamp
        });

        patientAppointments[_patientAddress].push(newAppointment);

        emit AppointmentBooked(
            _patientAddress,
            msg.sender,
            _hospitalName,
            _roomType,
            block.timestamp
        );
    }

    function getAppointmentsByPatient(address _patientAddress)
        external
        view
        returns (Appointment[] memory)
    {
        require(
            msg.sender == _patientAddress || users[msg.sender].role == Role.HOSPITAL,
            "Not authorized to view appointments"
        );
        return patientAppointments[_patientAddress];
    }

    function processPrescription(string memory _ipfsCid) external recordExists(_ipfsCid) {
        HealthRecord storage recordToUpdate = healthRecords[_ipfsCid];

        require(users[msg.sender].role == Role.PHARMACY, "Caller is not a pharmacy");
        require(recordToUpdate.dataType == DataType.PRESCRIPTION, "Not a prescription");
        require(recordToUpdate.status == RecordStatus.PENDING, "Not a pending prescription");
        require(permissions[recordToUpdate.owner][_ipfsCid][msg.sender], "Pharmacy does not have access");

        recordToUpdate.status = RecordStatus.COMPLETED;

        emit RecordStatusUpdated(_ipfsCid, RecordStatus.COMPLETED);
    }

    struct InsuranceClaim {
        uint256 claimId;
        address patient;
        string plan;
        uint256 amount;
        string description;
        string status; // "Pending", "Approved", "Rejected"
        uint256 timestamp;
        string ipfsHash; // For uploaded insurance paper
    }

    mapping(address => InsuranceClaim[]) public insuranceClaims;
    InsuranceClaim[] public allInsuranceClaims;
    uint256 public nextClaimId = 1;

    // Patient submits insurance claim
    function addInsuranceClaim(
        address patient,
        string memory plan,
        uint256 amount,
        string memory description,
        string memory ipfsHash
    ) public {
        InsuranceClaim memory claim = InsuranceClaim({
            claimId: nextClaimId,
            patient: patient,
            plan: plan,
            amount: amount,
            description: description,
            status: "Pending",
            timestamp: block.timestamp,
            ipfsHash: ipfsHash
        });
        insuranceClaims[patient].push(claim);
        allInsuranceClaims.push(claim);
        nextClaimId++;
    }

    // Get claims for a patient
    function getInsuranceClaims(address patient) public view returns (InsuranceClaim[] memory) {
        return insuranceClaims[patient];
    }

    // Get all claims (for insurance dashboard)
    function getAllInsuranceClaims() public view returns (InsuranceClaim[] memory) {
        return allInsuranceClaims;
    }

    // Approve/reject claim (by insurance provider)
    function processInsuranceClaim(uint256 claimId, bool approve) public {
        for (uint256 i = 0; i < allInsuranceClaims.length; i++) {
            if (allInsuranceClaims[i].claimId == claimId) {
                if (approve) {
                    allInsuranceClaims[i].status = "Approved";
                } else {
                    allInsuranceClaims[i].status = "Rejected";
                }
                address patient = allInsuranceClaims[i].patient;
                for (uint256 j = 0; j < insuranceClaims[patient].length; j++) {
                    if (insuranceClaims[patient][j].claimId == claimId) {
                        insuranceClaims[patient][j].status = allInsuranceClaims[i].status;
                    }
                }
                break;
            }
        }
    }
}