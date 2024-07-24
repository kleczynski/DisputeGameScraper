const { ethers } = require('ethers');

function signMessage(message, privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.signMessage(message);
}

module.exports = signMessage;
