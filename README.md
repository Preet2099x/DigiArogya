### Local Setup Instructions

1. Connect Metamask and Ganache. Use `contract/truffle-config.js` file to create the project in the Ganache. 
2. Create a `.env` at the root dir of the project and copy `.env.sample` to `.env` and add the PINATA_ values.
3. Run the following command from the contract dir inside the project.
    ```sh
    truffle migrate --reset
    ```
    Note: Copy the contract and account address from the output and paste in the REACT_APP_CONTRACT_ADDRESS= && REACT_APP_ADMIN_ADDRESS= respectively in the `.env`.  
4. Run the following command from the root dir inside the project.
    ```sh
    npm run start
    ```
    Note: If first time, run `npm install` then `npm run start`
5. Now you can access in your browser.
