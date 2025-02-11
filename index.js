require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const fetch = require('node-fetch');
const Web3 = require('web3');

const app = express();
app.use(express.json());

// -------MongoDB Setup------------
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const TransactionSchema = new mongoose.Schema({ address: String, transactions: Array });
const Transaction = mongoose.model('Transaction', TransactionSchema);

const IPFSSchema = new mongoose.Schema({ hash: String, content: String });
const IPFSData = mongoose.model('IPFSData', IPFSSchema);

// --------Web3.js Setup-----------
const web3 = new Web3(process.env.INFURA_RPC_URL); // ---->>>>Use Infura or Alchemy for blockchain access

/** NFT Metadata Retrieval **/
app.get('/nft/:contractAddress/:tokenId', async (req, res) => {
    try {
        const { contractAddress, tokenId } = req.params;
        const contract = new web3.eth.Contract(require('./ERC721_ABI.json'), contractAddress);
        const tokenURI = await contract.methods.tokenURI(tokenId).call();
        const metadata = await fetch(tokenURI).then(res => res.json());
        res.json(metadata);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Cryptocurrency Transaction Tracking **/
app.post('/transactions', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
        const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&sort=desc&apikey=${etherscanApiKey}`;
        const data = await fetch(url).then(res => res.json());

        if (data.status !== '1') return res.status(400).json({ error: 'Invalid address or no transactions found' });

        const last5Transactions = data.result.slice(0, 5).map(tx => ({
            from: tx.from, to: tx.to, value: tx.value / 10 ** 18, timestamp: new Date(tx.timeStamp * 1000), hash: tx.hash
        }));

        await Transaction.findOneAndUpdate({ address: walletAddress }, { transactions: last5Transactions }, { upsert: true, new: true });
        res.json({ walletAddress, transactions: last5Transactions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** IPFS Storage **/
app.post('/ipfs/upload', async (req, res) => {
    try {
        const { text } = req.body;
        const pinataApiKey = process.env.PINATA_API_KEY, pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

        const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', { text }, {
            headers: { 'pinata_api_key': pinataApiKey, 'pinata_secret_api_key': pinataSecretApiKey }
        });

        const ipfsHash = response.data.IpfsHash;
        await new IPFSData({ hash: ipfsHash, content: text }).save();
        res.json({ ipfsHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Token Balance Lookup **/
app.get('/tokenBalance/:contractAddress/:walletAddress', async (req, res) => {
    try {
        const { contractAddress, walletAddress } = req.params;
        const contract = new web3.eth.Contract(require('./ERC20_ABI.json'), contractAddress);
        const balance = await contract.methods.balanceOf(walletAddress).call();
        res.json({ walletAddress, tokenBalance: web3.utils.fromWei(balance, 'ether') });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
