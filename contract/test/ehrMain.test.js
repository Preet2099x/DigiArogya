const EHRmain = artifacts.require('EHRmain');

contract('EHRmain', (accounts) => {
    let ehrMain;
    const [systemOwner, patient, provider, researcher] = accounts;
    let patientPublicKeyHash = web3.utils.keccak256('patient-public-key');
    let providerPublicKeyHash = web3.utils.keccak256('provider-public-key');
    let dataHash = web3.utils.keccak256('some-health-record-hash');

    beforeEach(async () => {
        ehrMain = await EHRmain.new();
    });

    it('should register and verify a new user', async () => {
        // Register a new patient
        let result = await ehrMain.registerUser(1, patientPublicKeyHash, { from: patient });
        assert.equal(result.logs[0].event, 'UserRegistered');
        assert.equal(result.logs[0].args.userAddress, patient);
        assert.equal(result.logs[0].args.role.toString(), '1'); // Role.PATIENT

        // Verify patient registration
        await ehrMain.verifyUser(patient, { from: systemOwner }); // Assuming the owner verifies the user

        // Check if user is registered and verified correctly
        let user = await ehrMain.checkUser(patient);
        assert.isTrue(user[0], 'User should be active and verified');
        assert.equal(user[1].toString(), '1', 'User role should be patient');
    });

    it('should add a health record for a verified patient', async () => {
        // Register and verify a provider
        await ehrMain.registerUser(2, providerPublicKeyHash, { from: provider });
        await ehrMain.verifyUser(provider, { from: systemOwner });

        // Register and verify a patient
        await ehrMain.registerUser(1, patientPublicKeyHash, { from: patient });
        await ehrMain.verifyUser(patient, { from: systemOwner });

        // Add health record
        let result = await ehrMain.addEHRData(patient, dataHash, 0, '0x1234', { from: provider });
        assert.equal(result.logs[0].event, 'HealthRecordAdded');
        assert.equal(result.logs[0].args.dataHash, dataHash);
        assert.equal(result.logs[0].args.owner, patient);
        assert.equal(result.logs[0].args.dataType.toString(), '0'); // EHR
    });

    it('should request non-incentive-based permission for a verified provider', async () => {
        // Register and verify a provider
        await ehrMain.registerUser(2, providerPublicKeyHash, { from: provider });
        await ehrMain.verifyUser(provider, { from: systemOwner });

        // Register and verify a patient
        await ehrMain.registerUser(1, patientPublicKeyHash, { from: patient });
        await ehrMain.verifyUser(patient, { from: systemOwner });

        // Request permission
        let requestId = await ehrMain.requestNonIncentiveBasedPermission(patient, dataHash, 1, { from: provider });
        assert.isNotNull(requestId, 'Request ID should not be null');
    });

    it('should approve a permission request for verified users', async () => {
        // Register and verify a provider
        await ehrMain.registerUser(2, providerPublicKeyHash, { from: provider });
        await ehrMain.verifyUser(provider, { from: systemOwner });

        // Register and verify a patient
        await ehrMain.registerUser(1, patientPublicKeyHash, { from: patient });
        await ehrMain.verifyUser(patient, { from: systemOwner });

        // Request permission
        let requestId = await ehrMain.requestNonIncentiveBasedPermission(patient, dataHash, 1, { from: provider });

        // Approve permission
        let result = await ehrMain.approvePermission(requestId, { from: patient });
        assert.equal(result.logs[0].event, 'PermissionGranted');
        assert.equal(result.logs[0].args.requester, provider);
        assert.equal(result.logs[0].args.owner, patient);
    });

    it('should revoke permission for verified users', async () => {
        // Register and verify a provider
        await ehrMain.registerUser(2, providerPublicKeyHash, { from: provider });
        await ehrMain.verifyUser(provider, { from: systemOwner });

        // Register and verify a patient
        await ehrMain.registerUser(1, patientPublicKeyHash, { from: patient });
        await ehrMain.verifyUser(patient, { from: systemOwner });

        // Request permission
        let requestId = await ehrMain.requestNonIncentiveBasedPermission(patient, dataHash, 1, { from: provider });

        // Approve permission
        await ehrMain.approvePermission(requestId, { from: patient });

        // Revoke permission
        await ehrMain.revokePermission(provider, dataHash, { from: patient });
        let hasPermission = await ehrMain.checkPermission(provider, dataHash);
        assert.isFalse(hasPermission, 'Permission should be revoked');
    });

    it('should grant emergency access for verified patient', async () => {
        // Register and verify a provider
        await ehrMain.registerUser(2, providerPublicKeyHash, { from: provider });
        await ehrMain.verifyUser(provider, { from: systemOwner });

        // Register and verify a patient
        await ehrMain.registerUser(1, patientPublicKeyHash, { from: patient });
        await ehrMain.verifyUser(patient, { from: systemOwner });

        // Grant emergency access
        let result = await ehrMain.grantEmergencyAccess(provider, dataHash, { from: patient });
        assert.equal(result.logs[0].event, 'EmergencyAccess');
        assert.equal(result.logs[0].args.provider, provider);
        assert.equal(result.logs[0].args.patient, patient);
    });

    it('should not allow unverified users to perform actions', async () => {
        // Attempt to register an unverified user
        try {
            await ehrMain.addEHRData(patient, dataHash, 0, '0x1234', { from: provider });
            assert.fail('The transaction should have thrown an error');
        } catch (error) {
            assert(error.message.includes('User is not verified'), 'Error should mention user verification');
        }
    });

    it('should not allow unauthorized access to records', async () => {
        // Register and verify patient and provider
        await ehrMain.registerUser(1, patientPublicKeyHash, { from: patient });
        await ehrMain.verifyUser(patient, { from: systemOwner });
        await ehrMain.registerUser(2, providerPublicKeyHash, { from: provider });
        await ehrMain.verifyUser(provider, { from: systemOwner });

        // Attempt to access record by unauthorized user (not the owner or provider)
        try {
            await ehrMain.getEncryptedKey(dataHash, { from: researcher });
            assert.fail('The transaction should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Unauthorized'), 'Error should mention unauthorized access');
        }
    });

    it('should handle expired permission requests', async () => {
        // Register and verify provider and patient
        await ehrMain.registerUser(2, providerPublicKeyHash, { from: provider });
        await ehrMain.verifyUser(provider, { from: systemOwner });
        await ehrMain.registerUser(1, patientPublicKeyHash, { from: patient });
        await ehrMain.verifyUser(patient, { from: systemOwner });

        // Request permission
        let requestId = await ehrMain.requestNonIncentiveBasedPermission(patient, dataHash, 1, { from: provider });

        // Fast forward time to expire the request
        await web3.eth.currentProvider.send({ jsonrpc: '2.0', method: 'evm_increaseTime', params: [time.duration.days(31)], id: 0 });

        // Attempt to approve expired permission request
        try {
            await ehrMain.approvePermission(requestId, { from: patient });
            assert.fail('The transaction should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Request expired'), 'Error should mention expired request');
        }
    });
});
