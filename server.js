const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Load ABI and Contract Address
const CONTRACT_ABI = require("./NFTMinterABI.json");
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Setup provider, wallet, and contract
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Upload file and mint NFT
app.post("/upload", upload.single("file"), async (req, res) => {
    const file = req.file;
    const fileName = req.body.fileName;
    const authorName = req.body.authorName;
    const recipient = req.body.recipient;

    // Validate input
    if (!file || !fileName || !authorName || !recipient) {
        return res.status(400).json({ error: "Missing file, metadata, or recipient address." });
    }

    try {
        // Prepare metadata
        const metadata = {
            name: fileName, // File name
            keyvalues: {
                authorName: authorName, // Include the author's name
            },
        };

        // Prepare file for Pinata
        const formData = new FormData();
        formData.append("file", fs.createReadStream(file.path));
        formData.append("pinataMetadata", JSON.stringify(metadata));

        // Upload to IPFS via Pinata
        const pinataRes = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            maxBodyLength: Infinity,
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${process.env.PINATA_JWT}`,
            },
        });

        // Clean up temp file
        fs.unlinkSync(file.path);

        const ipfsHash = pinataRes.data.IpfsHash;
        const tokenURI = `ipfs://${ipfsHash}`;

        // Mint NFT (replace 'mintNFT' with your contract's actual minting function name if different)
        const tx = await contract.mintNFT(recipient, tokenURI);
        const receipt = await tx.wait();

        // Respond with success
        res.json({
            success: true,
            ipfsHash,
            tokenURI,
            txHash: tx.hash,
            message: "✅ File uploaded and NFT minted!",
        });
    } catch (error) {
        console.error("❌ Error uploading to Pinata or minting NFT:", error?.response?.data || error.message);

        // Clean up temp file in case of error
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        res.status(500).json({ error: "Something went wrong with uploading to Pinata or minting NFT." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
