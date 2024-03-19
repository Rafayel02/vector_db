import crypto from 'crypto';
import { VaultClient } from "../client/VaultClient";

export class EncryptionService {

    private constructor() {
    }

    static async encrypt(text: string, customerId: string) {
        const keys = await VaultClient.getInstance().getCustomerKeys(customerId)
        if (!keys) {
            throw new Error("Customer keys are not set in Vault")
        }
        try {
            let cipher = crypto.createCipheriv('aes-128-cbc', keys.key, keys.iv);
            let crypted = cipher.update(text, 'utf8', 'base64');
            crypted += cipher.final('base64');
            return crypted;
        } catch (err) {
            console.error('encrypt error', err);
            return null;
        }
    }

    static async decrypt(encryptdata: string, customerId: string) {
        const keys = await VaultClient.getInstance().getCustomerKeys(customerId)
        if (!keys) {
            throw new Error("Customer keys are not set in Vault")
        }
        try {
            let decipher = crypto.createDecipheriv('aes-128-cbc', keys.key, keys.iv)
            decipher.setAutoPadding(false)
            let decoded = decipher.update(encryptdata, 'base64', 'utf8') //base64 , hex
            decoded += decipher.final('utf8')
            return decoded.replace('\r', '').replace('\n', '')
        } catch (err) {
            console.error('decrypt error', err)
            return null
        }
    }

}