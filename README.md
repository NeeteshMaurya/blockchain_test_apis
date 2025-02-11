#  Crypto API (Web3.js + AI + Express.js + MongoDB)  

## API Endpoints & Responses  

### **1 NFT Metadata Retrieval**  
- **GET** `/nft/:contractAddress/:tokenId`  
- **Response Example:**  
```json
{
  "name": "CryptoPunk #123",
  "description": "An OG CryptoPunk NFT",
  "image": "https://cryptopunks.com/image/123.png"
}
```

### **2 Cryptocurrency Transaction Tracking**  
- **GET** `/transactions`  
- **Body:**
```json
{ "walletAddress": "0xabc123..." }
```

- **Response Example:**  
```json
{
  "walletAddress": "0xabc123...",
  "transactions": [
    { "from": "0x1...", "to": "0x2...", "value": "0.5", "timestamp": "2024-01-01", "hash": "0xabc..." }
  ]
}
```

### **3 IPFS Storage**  
- **GET** `/ipfs/upload`  
- **Body:**
```json
{ "text": "Hello, IPFS!" }
```
- **Response Example:**  
```json
{ "ipfsHash": "abcdefgh..." }

```

### **4 Token Balance Lookup**  
- **GET** `/tokenBalance/:contractAddress/:walletAddress`  

- **Response Example:**  
```json
{ "walletAddress": "0xabc...", "tokenBalance": "100.0" }
```
