const InsuranceContract = artifacts.require("InsuranceContract");

module.exports = function(deployer) {
  deployer.deploy(InsuranceContract);
};
