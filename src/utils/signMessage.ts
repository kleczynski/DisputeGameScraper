import { ethers } from 'ethers';

function signMessage(message: string, privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.signMessage(message);
}

export { signMessage };
