// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EHRStorage.sol";

contract EHRFeatures is EHRStorage {
    // --- Modifiers needed for this contract ---
    modifier onlySystemOwner() {
        require(msg.sender == systemOwner, "Only system owner can call this function");
        _;
    }

    modifier onlyHospital() {
        require(users[msg.sender].role == Role.HOSPITAL, "Only hospitals can perform this action");
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


    // --- Specialized Functions ---

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

    function invalidateRecord(string memory _ipfsCid)
        external
        recordExists(_ipfsCid)
        onlySystemOwner
    {
        healthRecords[_ipfsCid].status = RecordStatus.INVALID;
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

    function processPrescription(string memory _ipfsCid) external recordExists(_ipfsCid) {
        HealthRecord storage recordToUpdate = healthRecords[_ipfsCid];

        require(users[msg.sender].role == Role.PHARMACY, "Caller is not a pharmacy");
        require(recordToUpdate.dataType == DataType.PRESCRIPTION, "Not a prescription");
        require(recordToUpdate.status == RecordStatus.PENDING, "Not a pending prescription");
        require(permissions[recordToUpdate.owner][_ipfsCid][msg.sender], "Pharmacy does not have access");

        recordToUpdate.status = RecordStatus.COMPLETED;

        emit RecordStatusUpdated(_ipfsCid, RecordStatus.COMPLETED);
    }


    // --- Specialized Getter Functions ---

    function getRecordsByCareProvider(address _careProvider)
        public
        view
        returns (approvedRecord[] memory)
    {
        require(_careProvider != address(0), "Invalid care provider address");

        uint256 approvedRecordsCount = 0;
        for (uint i = 0; i < approvedRecords[_careProvider].length; i++) {
            approvedRecord storage ar = approvedRecords[_careProvider][i];
            if (ar.status == true) {
                approvedRecordsCount++;
            }
        }

        approvedRecord[] memory allApprovedRecords = new approvedRecord[](approvedRecordsCount);
        uint256 index = 0;
        for (uint j = 0; j < approvedRecords[_careProvider].length; j++) {
            approvedRecord storage ar = approvedRecords[_careProvider][j];
            if (ar.status == true) {
                allApprovedRecords[index] = ar;
                index++;
            }
        }
        return allApprovedRecords;
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

    function checkEmergencyAccess(address _ambulance, address _patient)
        public
        view
        returns (bool)
    {
        return emergencyAccesses[_ambulance][_patient];
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

    // --- Insurance Claim Functions ---
    function submitInsuranceClaim(
        string memory _claimId,
        string memory _insuranceProvider,
        string memory _insurancePlan,
        string memory _diagnosis,
        string memory _hospitalName,
        uint256 _claimAmount,
        string memory _medicalReportHash
    ) external returns (bool) {
        require(users[msg.sender].role == Role.PATIENT, "Only patients can submit insurance claims");
        require(bytes(_claimId).length > 0, "Claim ID cannot be empty");
        require(bytes(_insuranceProvider).length > 0, "Insurance provider cannot be empty");
        require(bytes(_diagnosis).length > 0, "Diagnosis cannot be empty");
        require(_claimAmount > 0, "Claim amount must be greater than 0");

        bytes32 claimHash = keccak256(abi.encodePacked(_claimId));
        require(insuranceClaims[claimHash].claimant == address(0), "Claim ID already exists");

        InsuranceClaim memory newClaim = InsuranceClaim({
            claimId: _claimId,
            claimant: msg.sender,
            insuranceProvider: _insuranceProvider,
            insurancePlan: _insurancePlan,
            diagnosis: _diagnosis,
            hospitalName: _hospitalName,
            claimAmount: _claimAmount,
            medicalReportHash: _medicalReportHash,
            submissionDate: block.timestamp,
            status: ClaimStatus.PENDING,
            approvedAmount: 0,
            rejectionReason: ""
        });

        insuranceClaims[claimHash] = newClaim;
        patientClaims[msg.sender].push(claimHash);
        allClaimHashes.push(claimHash);

        emit InsuranceClaimSubmitted(
            _claimId,
            msg.sender,
            _insuranceProvider,
            _claimAmount,
            block.timestamp
        );

        return true;
    }

    function getPatientClaims(address _patient) 
        external 
        view 
        returns (InsuranceClaim[] memory) 
    {
        require(
            msg.sender == _patient || 
            users[msg.sender].role == Role.INSURANCE || 
            users[msg.sender].role == Role.HOSPITAL,
            "Not authorized to view claims"
        );

        bytes32[] memory claimHashes = patientClaims[_patient];
        InsuranceClaim[] memory claims = new InsuranceClaim[](claimHashes.length);

        for (uint i = 0; i < claimHashes.length; i++) {
            claims[i] = insuranceClaims[claimHashes[i]];
        }

        return claims;
    }

    function getAllInsuranceClaims() 
        external 
        view 
        returns (InsuranceClaim[] memory) 
    {
        require(
            users[msg.sender].role == Role.INSURANCE || 
            users[msg.sender].role == Role.HOSPITAL ||
            msg.sender == systemOwner,
            "Not authorized to view all claims"
        );

        InsuranceClaim[] memory claims = new InsuranceClaim[](allClaimHashes.length);

        for (uint i = 0; i < allClaimHashes.length; i++) {
            claims[i] = insuranceClaims[allClaimHashes[i]];
        }

        return claims;
    }

    function approveInsuranceClaim(
        string memory _claimId,
        uint256 _approvedAmount
    ) external returns (bool) {
        require(
            users[msg.sender].role == Role.INSURANCE,
            "Only insurance providers can approve claims"
        );
        require(_approvedAmount > 0, "Approved amount must be greater than 0");

        bytes32 claimHash = keccak256(abi.encodePacked(_claimId));
        require(insuranceClaims[claimHash].claimant != address(0), "Claim does not exist");
        require(insuranceClaims[claimHash].status == ClaimStatus.PENDING, "Claim is not pending");

        insuranceClaims[claimHash].status = ClaimStatus.APPROVED;
        insuranceClaims[claimHash].approvedAmount = _approvedAmount;

        return true;
    }

    function rejectInsuranceClaim(
        string memory _claimId,
        string memory _rejectionReason
    ) external returns (bool) {
        require(
            users[msg.sender].role == Role.INSURANCE,
            "Only insurance providers can reject claims"
        );
        require(bytes(_rejectionReason).length > 0, "Rejection reason cannot be empty");

        bytes32 claimHash = keccak256(abi.encodePacked(_claimId));
        require(insuranceClaims[claimHash].claimant != address(0), "Claim does not exist");
        require(insuranceClaims[claimHash].status == ClaimStatus.PENDING, "Claim is not pending");

        insuranceClaims[claimHash].status = ClaimStatus.REJECTED;
        insuranceClaims[claimHash].rejectionReason = _rejectionReason;

        return true;
    }
}