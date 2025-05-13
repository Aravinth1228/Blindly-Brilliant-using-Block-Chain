async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const fileName = document.getElementById("fileName").value;
    const authorName = document.getElementById("authorName").value;
    const responseBox = document.getElementById("response");

    if (!fileInput.files[0] || !fileName || !authorName) {
        return alert("Please complete all fields.");
    }

    try {
        // Connect to MetaMask and get the recipient address
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const recipient = accounts[0];
        if (!recipient) {
            throw new Error("Failed to retrieve wallet address. Please connect your wallet.");
        }

        // Prepare form data for Pinata
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("fileName", fileName);
        formData.append("authorName", authorName);
        formData.append("recipient", recipient);

        // Upload file to Pinata via backend
        const res = await fetch("http://localhost:3000/upload", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            throw new Error("Failed to upload file to Pinata. Please check the backend.");
        }

        const result = await res.json();
        if (!result.success) {
            throw new Error(result.error || "Failed to upload file to Pinata.");
        }

        const ipfsHash = result.ipfsHash;
        const tokenURI = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        // Interact with the smart contract to mint the NFT
        const contractAddress = "0xd750443f11bfa3956313881fb8b94702ba570869"; // Replace with your deployed contract address
        const contractABI = [
            {
                "inputs": [
                    { "internalType": "address", "name": "recipient", "type": "address" },
                    { "internalType": "string", "name": "tokenURI", "type": "string" }
                ],
                "name": "mintNFT",
                "outputs": [
                    { "internalType": "uint256", "name": "", "type": "uint256" }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const tx = await contract.mintNFT(recipient, tokenURI);
        const receipt = await tx.wait();

        // Get Token ID from emitted event
        const event = receipt.events.find(e => e.event === "NFTMinted");
        const tokenId = event?.args?.tokenId?.toString();

        responseBox.innerHTML = `
            ✅ <strong>NFT Minted Successfully!</strong><br>
            🆔 <strong>Token ID:</strong> ${tokenId}<br>
            🔗 <strong>Metadata:</strong> <a href="${tokenURI}" target="_blank">${tokenURI}</a>
        `;

        // Reset the form
        fileInput.value = "";
        document.getElementById("fileName").value = "";
        document.getElementById("authorName").value = "";
    } catch (error) {
        console.error("Upload error:", error);
        responseBox.textContent = "❌ Error uploading or minting.";
    }
}
