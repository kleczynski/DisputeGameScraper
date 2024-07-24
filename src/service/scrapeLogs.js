require('dotenv').config();
const axios = require('axios');
const { client, insertTransaction, closeConnection } = require('../models/mongoClient');

const PROPOSER_ADDRESS = process.env.PROPOSER_ADDRESS;
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api-sepolia.etherscan.io/api';
const RATE_LIMIT_DELAY = parseInt(process.env.RATE_LIMIT_DELAY, 10);

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithDelay(url) {
    await delay(RATE_LIMIT_DELAY);
    return axios.get(url);
}

async function getTransactionLogs(address, apiKey, startBlock = 0, endBlock = 99999999, page = 70, offset = 10, sort = 'desc') {
    const url = `${BASE_URL}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const transactions = response.data.result;

        if (!transactions) {
            console.error('No transactions found');
            return [];
        }

        const logs = [];
        for (const tx of transactions) {
            const logUrl = `${BASE_URL}?module=logs&action=getLogs&fromBlock=${tx.blockNumber}&toBlock=${tx.blockNumber}&address=${tx.to}&apikey=${apiKey}`;
            try {
                const logResponse = await fetchWithDelay(logUrl);
                logs.push({
                    proposerTransactionHash: tx.hash,
                    logs: logResponse.data.result
                });
            } catch (error) {
                if (error.response && error.response.data === 'Max rate limit reached') {
                    console.log(`Rate limit reached, waiting...`);
                    await delay(RATE_LIMIT_DELAY);
                    try {
                        const logResponse = await fetchWithDelay(logUrl);
                        logs.push({
                            proposerTransactionHash: tx.hash,
                            logs: logResponse.data.result
                        });
                    } catch (retryError) {
                        console.error('Error fetching logs after retry:', retryError);
                    }
                } else {
                    console.error('Error fetching logs:', error);
                }
            }
        }

        return logs;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
}

function extractAddressFromTopic(topic) {
    return '0x' + topic.slice(26); 
}

async function getTransactionsFromLogs(logs) {
    const transactions = [];
    for (const log of logs) {
        const proposerTransactionHash = log.proposerTransactionHash;
        for (const entry of log.logs) {
            const rawAddress = entry.topics[1];
            const address = extractAddressFromTopic(rawAddress);
            const txUrl = `${BASE_URL}?module=account&action=txlist&address=${address}&apikey=${API_KEY}`;
            try {
                const txResponse = await fetchWithDelay(txUrl);
                transactions.push({
                    proposerTransactionHash,
                    address,
                    transactions: txResponse.data.result
                });
            } catch (error) {
                console.error('Error fetching transactions for address:', address, error);
            }
        }
    }
    return transactions;
}

function analyzeChallengerTransactions(transactions) {
    const result = {
        validTransactions: [],
        invalidTransactions: []
    };

    const processedProposerTransactions = new Set();

    transactions.forEach(txGroup => {
        const proposerTransactionHash = txGroup.proposerTransactionHash;

        if (!processedProposerTransactions.has(proposerTransactionHash)) {
            processedProposerTransactions.add(proposerTransactionHash);

            const challengedTransactionHashes = new Set();
            txGroup.transactions.forEach(tx => {
                challengedTransactionHashes.add(tx.hash);
            });

            const challengedTransactionsArray = Array.from(challengedTransactionHashes);

            const entry = {
                proposerTransactionHash,
                challengedTransactionHashes: challengedTransactionsArray
            };

            let hasValidTransaction = false;
            txGroup.transactions.forEach(tx => {
                if (tx.functionName === 'resolveClaim(uint256 _claimIndex,uint256 _numToResolve)' ||
                    tx.functionName === 'resolve()' ||
                    tx.functionName === 'claimCredit(address _recipient)') {
                    hasValidTransaction = true;
                }
            });

            if (hasValidTransaction) {
                result.validTransactions.push(entry);
            } else {
                result.invalidTransactions.push(entry);
            }
        }
    });

    return result;
}

(async () => {
    try {
        await connectToMongoDB();

        const logs = await getTransactionLogs(PROPOSER_ADDRESS, API_KEY); 
        const transactions = await getTransactionsFromLogs(logs);
        console.log('Transactions', JSON.stringify(transactions, null, 2));
        
        const analysisResult = analyzeChallengerTransactions(transactions);
        console.log(JSON.stringify(analysisResult, null, 2));
        console.log('Valid Transactions Length:', analysisResult.validTransactions.length);
        console.log('Invalid Transactions Length:', analysisResult.invalidTransactions.length);

        if (analysisResult.validTransactions.length > 0) {
            await insertTransaction(analysisResult.validTransactions);
        }

        if (analysisResult.invalidTransactions.length > 0) {
            await insertTransaction(analysisResult.invalidTransactions);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await closeConnection();
    }
})();
