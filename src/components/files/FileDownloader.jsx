import { Card, CardContent, CardHeader } from "@mui/material";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { Download, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { Buffer } from "buffer";
import { decryptWithPrivateKey } from "../../services/cryptography/asymmetricEncryption";
import decryptBase64ToFile from "../../services/cryptography/fileDecrypter";
import { downloadFromIPFS } from "../../services/ipfs/ipfsDownloader";

window.Buffer = window.Buffer || Buffer;

const FileDownloader = ({ recordInfo, ipfsHash, encryptedSymmetricKey, privateKeyLabel = "Enter your Private Key", debugInfo }) => {
  const [privateKeyForDecryption, setPrivateKeyForDecryption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get IPFS hash and encrypted key from either recordInfo or direct props
  const actualIpfsHash = recordInfo?.ipfsCid || ipfsHash;
  const actualEncryptedKey = recordInfo?.encryptedSymmetricKey || encryptedSymmetricKey;
  // DEBUG: Log props and key info
  if (debugInfo) {
    console.log('[DEBUG] FileDownloader props:', {
      recordInfo,
      ipfsHash,
      encryptedSymmetricKey,
      debugInfo
    });
  }

  const handleDownload = async () => {
    if (!privateKeyForDecryption) {
      setError("Please enter your private key");
      return;
    }
    // DEBUG: Log entered private key and encrypted key
    console.log('[DEBUG] Download attempt:', {
      privateKeyForDecryption,
      actualEncryptedKey,
      actualIpfsHash
    });

    setLoading(true);
    setError("");

    try {
      const decryptedSymmetricKey = await decryptWithPrivateKey(
        privateKeyForDecryption,
        actualEncryptedKey
      );
      const { encryptedContent, fileType, fileName } = await downloadFromIPFS(
        actualIpfsHash
      );

      const decryptedBlob = decryptBase64ToFile(
        encryptedContent,
        decryptedSymmetricKey
      );
      console.log("Content decrypted successfully");

      const downloadUrl = URL.createObjectURL(
        new File([decryptedBlob], fileName, { type: fileType })
      );
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(downloadUrl);
      console.log("Download completed successfully");
    } catch (error) {
      console.error("Download error:", error);
      setError(error.message || "Failed to download and decrypt file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card sx={{ maxWidth: 800, margin: "0 auto", padding: 2 }}>
        <CardHeader
          title="Download Encrypted File"
          sx={{ textAlign: "center" }}
        />
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <TextField
              fullWidth
              label={privateKeyLabel}
              type="password"
              value={privateKeyForDecryption}
              onChange={(e) => setPrivateKeyForDecryption(e.target.value)}
              placeholder="Enter decryption key"
              variant="outlined"
            />

            {error && (
              <div
                style={{
                  color: "#d32f2f",
                  backgroundColor: "#ffebee",
                  padding: "10px",
                  borderRadius: "4px",
                  marginTop: "10px",
                }}
              >
                {error}
              </div>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              disabled={loading || !privateKeyForDecryption}
              fullWidth
              sx={{ mt: 2 }}
              startIcon={loading ? <Loader2 /> : <Download />}
            >
              {loading ? "Downloading..." : "Download File"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileDownloader;
