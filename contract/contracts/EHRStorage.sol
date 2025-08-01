// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract EHRStorage {
    // User roles
    enum Role {
        NONE,
        PATIENT,
        DOCTOR,
        RESEARCHER,
        HOSPITAL,
        INSURANCE,
        AMBULANCE,
        PHARMACY,
        LAB
    }

    // Data types
    enum DataType {
        EHR,
        PHR,
        LAB_RESULT,
        PRESCRIPTION,
        IMAGING,
        INSURANCE_CLAIM,
        EMERGENCY_RECORD
    }

    // Permission types
    enum PermissionType {
        VIEW,
        EDIT,
        EMERGENCY_ACCESS,
        INSURANCE_PROCESSING,
        LAB_PROCESSING,
        PRESCRIPTION_PROCESSING
    }

    // Status of permission requests
    enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED,
        EXPIRED
    }
    enum RecordStatus { PENDING, COMPLETED, VALID, INVALID }

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
        string ipfsCid;
        DataType dataType;
        string encryptedSymmetricKey;
        uint256 timestamp;
        RecordStatus status;
        address provider;
    }

    struct approvedRecord {
        address owner;
        address careProvider;
        string ipfsCid;
        DataType dataType;
        string encryptedSymmetricKey;
        uint256 approvedDate;
        uint256 expiryDate;
        bool status;
    }

    // Struct for permission requests
    struct PermissionRequest {
        address requester;
        address owner;
        bytes32 requestId;
        string ipfsCid;
        PermissionType permissionType;
        RequestStatus status;
        uint256 requestDate;
        uint256 expiryDate;
        uint incentiveAmount;
        bool isIncentiveBased;
    }

    // Struct to hold public and private keys
    struct KeyPair {
        string publicKeyForEncryption;
    }

    // Struct for hospital appointments
    struct Appointment {
        address patientAddress;
        address hospitalAddress;
        string hospitalName;
        string roomType;
        uint256 bookingDate;
    }

    // State variables
    mapping(address => User) public users;
    mapping(string => HealthRecord) public healthRecords;
    mapping(bytes32 => PermissionRequest) public permissionRequests;
    mapping(address => mapping(string => mapping(address => bool))) public permissions;
    mapping(address => approvedRecord[]) public approvedRecords;
    mapping(string => approvedRecord) public approvedRecordsByID;
    mapping(address => string[]) public ownerToHealthRecords;
    mapping(address => KeyPair) public userKeys;
    mapping(address => mapping(address => bool)) public emergencyAccesses;
    mapping(address => Appointment[]) public patientAppointments; // New state for appointments

    // System variables
    address public systemOwner;
    uint256 public totalUsers;
    uint256 public totalRecords;
    uint256 public totalRequests;
    bytes32[] public permissionRequestIds;

    // Events
    event UserRegistered(address indexed userAddress, Role role);
    event HealthRecordAdded(string indexed ipfsCid, address indexed owner, DataType dataType);
    event PermissionRequested(bytes32 requestId, address indexed requester, address indexed owner);
    event PermissionGranted(bytes32 requestId, address indexed requester, address indexed owner);
    event PermissionRevoked(string indexed ipfsCid, address indexed revokedUser);
    event RecordStatusUpdated(string indexed ipfsCid, RecordStatus newStatus);
    event EmergencyAccess(address indexed provider, address indexed patient, uint256 timestamp);
    event ApprovedRecordAdded(
        address indexed owner,
        address indexed careProvider,
        string ipfsCid,
        DataType dataType,
        string encryptedSymmetricKey,
        uint256 approvedDate,
        uint256 expiryDate,
        bool status
    );
    event AppointmentBooked(
        address indexed patientAddress,
        address indexed hospitalAddress,
        string hospitalName,
        string roomType,
        uint256 bookingDate
    ); // New event for bookings
}