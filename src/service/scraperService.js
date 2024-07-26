require('dotenv').config({path:'../../.env'});
const axios = require('axios');
const { ethers } = require('ethers');
const { connectToMongoDB, insertTransaction, closeConnection } = require('../models/mongoClient');

const ETHERSCAN_API_KEY = process.env.API_KEY;
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.InfuraProvider('mainnet', INFURA_PROJECT_ID);
const proxyAddress = '0xe5965Ab5962eDc7477C8520243A95517CD252fA9'; 

if (!ETHERSCAN_API_KEY || !INFURA_PROJECT_ID) {
    console.error('Missing required environment variables. Please ensure ETHERSCAN_API_KEY and INFURA_PROJECT_ID are set in .env file.');
    process.exit(1);
}

const gameContractAbi = [
    {
        "constant": true,
        "inputs": [],
        "name": "claimDataLen",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "claimData",
        "outputs": [
            {
                "name": "parentIndex",
                "type": "uint32"
            },
            {
                "name": "counteredBy",
                "type": "address"
            },
            {
                "name": "claimant",
                "type": "address"
            },
            {
                "name": "bond",
                "type": "uint128"
            },
            {
                "name": "claim",
                "type": "bytes32"
            },
            {
                "name": "position",
                "type": "uint128"
            },
            {
                "name": "clock",
                "type": "uint128"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "status",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

async function getAbi(contractAddress) {
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
    const response = await axios.get(url);
    if (response.data.status === '1') {
        return JSON.parse(response.data.result);
    } else {
        throw new Error(`Failed to get ABI: ${response.data.result}`);
    }
}

async function getImplementationAddress(proxyAddress) {
    const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
    const storageValue = await provider.getStorage(proxyAddress, implementationSlot);
    return ethers.getAddress(`0x${storageValue.substr(26)}`);
}

async function getGameCount(contract) {
    return await contract.gameCount();
}

async function getGameAtIndex(contract, index) {
    return await contract.gameAtIndex(index);
}

async function getClaimDataLength(contract) {
    return await contract.claimDataLen();
}

async function getClaimData(contract, index) {
    return await contract.claimData(index);
}

async function getGameStatus(contract) {
    return await contract.status();
}

async function main() {
    await connectToMongoDB();
    try {
        const implementationAddress = await getImplementationAddress(proxyAddress);
        console.log('Implementation Address:', implementationAddress);

        const implementationAbi = await getAbi(implementationAddress);
        const proxyContract = new ethers.Contract(proxyAddress, implementationAbi, provider);

        const gameCount = await getGameCount(proxyContract);
        console.log('Total games:', gameCount.toString());

        let dataToInsert = [];
        let proposerGameResults = {};

        for (let i = 0; i < gameCount; i++) {
            const gameDetails = await getGameAtIndex(proxyContract, i);
            const gameContractAddress = gameDetails.proxy_;

            console.log(`Game ${i} contract address:`, gameContractAddress);

            const gameContract = new ethers.Contract(gameContractAddress, gameContractAbi, provider);
            const claimDataLength = await getClaimDataLength(gameContract);
            console.log(`Game ${i} has ${claimDataLength} claims`);

            let validTransactions = {
                proposerTransactionHash: null,
                challengedTransactionHashes: []
            };

            let invalidTransactions = {
                proposerTransactionHash: null,
                challengedTransactionHashes: []
            };

            let rootClaimant = null;
            let gameStatus = await getGameStatus(gameContract);

            for (let j = 0; j < claimDataLength; j++) {
                const claimData = await getClaimData(gameContract, j);
                console.log(`Claim ${j} data:`, claimData);

                if (j === 0) {
                    validTransactions.proposerTransactionHash = claimData.claim;
                    rootClaimant = claimData.claimant;
                }

                if (claimData.counteredBy !== '0x0000000000000000000000000000000000000000') {
                    invalidTransactions.challengedTransactionHashes.push(claimData.claim);
                } else {
                    if (j !== 0) {
                        validTransactions.challengedTransactionHashes.push(claimData.claim);
                    }
                }
            }

            if (rootClaimant) {
                if (!proposerGameResults[rootClaimant]) {
                    proposerGameResults[rootClaimant] = { defended: 0, disputed: 0, total: 0 };
                }
                proposerGameResults[rootClaimant].total += 1;
                if (gameStatus === 2) {
                    proposerGameResults[rootClaimant].defended += 1;
                } else if (gameStatus === 1) {
                    proposerGameResults[rootClaimant].disputed += 1;
                }
            }

            dataToInsert.push({
                gameIndex: i,
                gameContractAddress: gameContractAddress,
                validTransactions: validTransactions,
                invalidTransactions: invalidTransactions,
                honestProposer: gameStatus === 2 ? true : false
            });
        }

        for (let proposer in proposerGameResults) {
            const results = proposerGameResults[proposer];
            if (results.total === results.defended) {
                await insertTransaction([{ proposer, honestProposer: true }]);
            } else {
                await insertTransaction([{ proposer, honestProposer: false }]);
            }
        }

        await insertTransaction(dataToInsert);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await closeConnection();
    }
}

main();
