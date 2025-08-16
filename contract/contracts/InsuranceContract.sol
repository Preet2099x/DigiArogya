// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InsuranceContract {
    // User roles
    enum Role {
        NONE,
        PATIENT,
        INSURANCE
    }

    // User structure
    struct User {
        address userAddress;
        Role role;
        uint256 registrationDate;
    }

    // Insurance claim structure
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

    // State variables
    address public systemOwner;
    mapping(address => User) public users;
    mapping(address => InsuranceClaim[]) public insuranceClaims;
    InsuranceClaim[] public allInsuranceClaims;
    uint256 public nextClaimId = 1;

    // Events
    event UserRegistered(address indexed user, Role role);
    event InsuranceClaimSubmitted(
        uint256 indexed claimId,
        address indexed patient,
        uint256 amount,
        string plan
    );
    event InsuranceClaimProcessed(
        uint256 indexed claimId,
        address indexed patient,
        string status
    );

    // Modifiers
    modifier onlySystemOwner() {
        require(msg.sender == systemOwner, "Only system owner can call this function");
        _;
    }

    modifier onlyPatient() {
        require(users[msg.sender].role == Role.PATIENT, "Only patients can call this function");
        _;
    }

    modifier onlyInsurance() {
        require(
            users[msg.sender].role == Role.INSURANCE || msg.sender == systemOwner,
            "Only insurance providers can call this function"
        );
        _;
    }

    // Constructor
    constructor() {
        systemOwner = msg.sender;
        
        // Register system owner as insurance provider
        users[msg.sender] = User({
            userAddress: msg.sender,
            role: Role.INSURANCE,
            registrationDate: block.timestamp
        });
    }

    // Register user function
    function registerUser(Role _role) external returns (bool) {
        require(users[msg.sender].userAddress == address(0), "User already registered");
        require(_role != Role.NONE, "Invalid role");
        require(_role == Role.PATIENT || _role == Role.INSURANCE, "Invalid role type");

        users[msg.sender] = User({
            userAddress: msg.sender,
            role: _role,
            registrationDate: block.timestamp
        });

        emit UserRegistered(msg.sender, _role);
        return true;
    }

    // Get user role
    function checkUser(address _userAddress) public view returns (Role) {
        return users[_userAddress].role;
    }

    // Patient submits insurance claim
    function addInsuranceClaim(
        address patient,
        string memory plan,
        uint256 amount,
        string memory description,
        string memory ipfsHash
    ) public {
        require(bytes(plan).length > 0, "Insurance plan cannot be empty");
        require(amount > 0, "Claim amount must be greater than 0");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(patient != address(0), "Invalid patient address");
        
        // Allow both patients to submit their own claims and system owner to submit on behalf
        require(
            msg.sender == patient || msg.sender == systemOwner,
            "Only patient or system owner can submit this claim"
        );
        
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
        
        emit InsuranceClaimSubmitted(nextClaimId, patient, amount, plan);
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
    function processInsuranceClaim(uint256 claimId, bool approve) public onlyInsurance {
        require(claimId > 0 && claimId < nextClaimId, "Invalid claim ID");
        
        for (uint256 i = 0; i < allInsuranceClaims.length; i++) {
            if (allInsuranceClaims[i].claimId == claimId) {
                string memory newStatus;
                if (approve) {
                    allInsuranceClaims[i].status = "Approved";
                    newStatus = "Approved";
                } else {
                    allInsuranceClaims[i].status = "Rejected";
                    newStatus = "Rejected";
                }
                
                address patient = allInsuranceClaims[i].patient;
                for (uint256 j = 0; j < insuranceClaims[patient].length; j++) {
                    if (insuranceClaims[patient][j].claimId == claimId) {
                        insuranceClaims[patient][j].status = newStatus;
                        break;
                    }
                }
                
                emit InsuranceClaimProcessed(claimId, patient, newStatus);
                return;
            }
        }
        revert("Claim not found");
    }

    // Add some sample data for testing (only owner can call this)
    function addSampleData() public onlySystemOwner {
        // Create some sample patients
        address patient1 = 0x1234567890123456789012345678901234567890;
        address patient2 = 0xaBcDef1234567890123456789012345678901234;
        
        // Add sample claims
        addInsuranceClaim(
            patient1,
            "Health Plus Plan",
            1000,
            "Routine checkup and blood tests",
            "QmSampleHash1"
        );
        
        addInsuranceClaim(
            patient1,
            "Health Plus Plan",
            2500,
            "Emergency surgery",
            "QmSampleHash2"
        );
        
        addInsuranceClaim(
            patient2,
            "Basic Health Plan",
            500,
            "Dental cleaning",
            "QmSampleHash3"
        );
        
        // Process some claims
        processInsuranceClaim(1, true);  // Approve first claim
        processInsuranceClaim(3, false); // Reject third claim
    }
}
