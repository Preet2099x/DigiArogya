### How to Run React App in Secure Mode (HTTPS)

1. Run CMD in terminal mode.
2. Install `mkcert` by running the following command:
    ```sh
    choco install mkcert 
    ```
3. Create the `.cert` directory in the root folder of your project if it doesn't exist:
    ```sh
    mkdir -p .cert
    ```
4. Generate the certificate (run from the root of this project):
    ```sh
    mkcert -key-file ./.cert/key.pem -cert-file ./.cert/cert.pem "localhost"
    ```
    We'll be storing our generated certificates in the `.cert` directory.
5. Add the following lines to your `.env` file:
    ```sh
    HTTPS=true
    SSL_CRT_FILE=./.cert/cert.pem
    SSL_KEY_FILE=./.cert/key.pem
    ```
