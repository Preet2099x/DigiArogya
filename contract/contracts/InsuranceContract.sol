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
        string companyName; // Insurance company name (e.g., "SBI", "HDFC")
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
        string insuranceCompany; // Which insurance company this claim belongs to
        address assignedInsurer; // Which insurance provider is assigned to this claim
    }

    // State variables
    address public systemOwner;
    mapping(address => User) public users;
    mapping(address => InsuranceClaim[]) public insuranceClaims;
    InsuranceClaim[] public allInsuranceClaims;
    uint256 public nextClaimId = 1;
    
    // Insurance company mappings
    mapping(string => address[]) public insuranceCompanyProviders; // company name -> list of provider addresses
    mapping(address => string) public providerToCompany; // provider address -> company name
    mapping(string => bool) public registeredCompanies; // track registered company names

    // Events
    event UserRegistered(address indexed user, Role role, string companyName);
    event InsuranceClaimSubmitted(
        uint256 indexed claimId,
        address indexed patient,
        uint256 amount,
        string plan,
        string insuranceCompany
    );
    event InsuranceClaimProcessed(
        uint256 indexed claimId,
        address indexed patient,
        string status,
        address indexed processor
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
        
        // Register system owner as admin (not tied to any specific company)
        users[msg.sender] = User({
            userAddress: msg.sender,
            role: Role.INSURANCE,
            registrationDate: block.timestamp,
            companyName: "SYSTEM_ADMIN"
        });
    }

    // Register user function with company name for insurance providers
    function registerUser(Role _role, string memory _companyName) external returns (bool) {
        require(users[msg.sender].userAddress == address(0), "User already registered");
        require(_role != Role.NONE, "Invalid role");
        require(_role == Role.PATIENT || _role == Role.INSURANCE, "Invalid role type");
        
        // For insurance providers, company name is required
        if (_role == Role.INSURANCE) {
            require(bytes(_companyName).length > 0, "Insurance company name is required");
            
            // Register the company if not already registered
            if (!registeredCompanies[_companyName]) {
                registeredCompanies[_companyName] = true;
            }
            
            // Add provider to company mapping
            insuranceCompanyProviders[_companyName].push(msg.sender);
            providerToCompany[msg.sender] = _companyName;
        }

        users[msg.sender] = User({
            userAddress: msg.sender,
            role: _role,
            registrationDate: block.timestamp,
            companyName: _role == Role.INSURANCE ? _companyName : ""
        });

        emit UserRegistered(msg.sender, _role, _role == Role.INSURANCE ? _companyName : "");
        return true;
    }
    
    // Backward compatibility: Register user without company name (for patients)
    function registerUser(Role _role) external returns (bool) {
        require(_role == Role.PATIENT, "Use registerUser(role, companyName) for insurance providers");
        return this.registerUser(_role, "");
    }

    // Get user role
    function checkUser(address _userAddress) public view returns (Role) {
        return users[_userAddress].role;
    }

    // Patient submits insurance claim with specified insurance company
    function addInsuranceClaim(
        address patient,
        string memory plan,
        uint256 amount,
        string memory description,
        string memory ipfsHash,
        string memory insuranceCompany
    ) public {
        require(bytes(plan).length > 0, "Insurance plan cannot be empty");
        require(amount > 0, "Claim amount must be greater than 0");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(patient != address(0), "Invalid patient address");
        require(bytes(insuranceCompany).length > 0, "Insurance company must be specified");
        require(registeredCompanies[insuranceCompany], "Insurance company not registered");
        
        // Allow both patients to submit their own claims and system owner to submit on behalf
        require(
            msg.sender == patient || msg.sender == systemOwner,
            "Only patient or system owner can submit this claim"
        );
        
        // Get first available provider from the specified insurance company
        address[] memory companyProviders = insuranceCompanyProviders[insuranceCompany];
        require(companyProviders.length > 0, "No providers available for this insurance company");
        
        InsuranceClaim memory claim = InsuranceClaim({
            claimId: nextClaimId,
            patient: patient,
            plan: plan,
            amount: amount,
            description: description,
            status: "Pending",
            timestamp: block.timestamp,
            ipfsHash: ipfsHash,
            insuranceCompany: insuranceCompany,
            assignedInsurer: companyProviders[0] // Assign to first available provider
        });
        
        insuranceClaims[patient].push(claim);
        allInsuranceClaims.push(claim);
        
        emit InsuranceClaimSubmitted(nextClaimId, patient, amount, plan, insuranceCompany);
        nextClaimId++;
    }
    
    // Backward compatibility: addInsuranceClaim without company (assigns to SYSTEM_ADMIN)
    function addInsuranceClaim(
        address patient,
        string memory plan,
        uint256 amount,
        string memory description,
        string memory ipfsHash
    ) public {
        addInsuranceClaim(patient, plan, amount, description, ipfsHash, "SYSTEM_ADMIN");
    }

    // Get claims for a patient
    function getInsuranceClaims(address patient) public view returns (InsuranceClaim[] memory) {
        return insuranceClaims[patient];
    }

    // Get all claims (for system admin)
    function getAllInsuranceClaims() public view returns (InsuranceClaim[] memory) {
        return allInsuranceClaims;
    }
    
    // Get claims for specific insurance company
    function getClaimsByCompany(string memory companyName) public view returns (InsuranceClaim[] memory) {
        // Count claims for this company first
        uint256 count = 0;
        for (uint256 i = 0; i < allInsuranceClaims.length; i++) {
            if (keccak256(bytes(allInsuranceClaims[i].insuranceCompany)) == keccak256(bytes(companyName))) {
                count++;
            }
        }
        
        // Create array of correct size
        InsuranceClaim[] memory companyClaims = new InsuranceClaim[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allInsuranceClaims.length; i++) {
            if (keccak256(bytes(allInsuranceClaims[i].insuranceCompany)) == keccak256(bytes(companyName))) {
                companyClaims[index] = allInsuranceClaims[i];
                index++;
            }
        }
        
        return companyClaims;
    }
    
    // Get claims assigned to specific insurance provider
    function getMyAssignedClaims() public view returns (InsuranceClaim[] memory) {
        require(users[msg.sender].role == Role.INSURANCE, "Only insurance providers can call this");
        
        string memory myCompany = users[msg.sender].companyName;
        return getClaimsByCompany(myCompany);
    }

    // Approve/reject claim (by any wallet)
    function processInsuranceClaim(uint256 claimId, bool approve) public {
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
                emit InsuranceClaimProcessed(claimId, patient, newStatus, msg.sender);
                return;
            }
        }
        revert("Claim not found");
    }
    
    // Get user company information
    function getUserCompany(address userAddress) public view returns (string memory) {
        return users[userAddress].companyName;
    }
    
    // Get list of registered insurance companies
    function getRegisteredCompanies() public view returns (string[] memory) {
        // This is a simplified version - in production you'd want to maintain a dynamic array
        string[] memory companies = new string[](3);
        companies[0] = "SBI";
        companies[1] = "HDFC"; 
        companies[2] = "SYSTEM_ADMIN";
        return companies;
    }
    
    // Check if user can process a specific claim
    function canProcessClaim(address user, uint256 claimId) public view returns (bool) {
        if (user == systemOwner) return true;
        
        if (users[user].role != Role.INSURANCE) return false;
        
        for (uint256 i = 0; i < allInsuranceClaims.length; i++) {
            if (allInsuranceClaims[i].claimId == claimId) {
                string memory claimCompany = allInsuranceClaims[i].insuranceCompany;
                string memory userCompany = users[user].companyName;
                return keccak256(bytes(userCompany)) == keccak256(bytes(claimCompany));
            }
        }
        return false;
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
