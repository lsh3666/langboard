import crypto from "crypto";

const encrypt = (data: string, key: string): string => {
    const salt = crypto.randomBytes(16);
    const encodedKey = crypto.scryptSync(key, salt, 32, {
        N: 16384,
        r: 8,
        p: 1,
    });

    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", encodedKey, nonce);
    const cipherText = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    const b64Cipher = cipherText.toString("base64");
    const b64Salt = salt.toString("base64");
    const b64Nonce = nonce.toString("base64");
    const b64Tag = tag.toString("base64");

    const rawString = `${b64Cipher}*${b64Salt}*${b64Nonce}*${b64Tag}`;

    const finalEncoded = Buffer.from(rawString, "utf8").toString("base64");

    return finalEncoded;
};

const decrypt = (data: string, key: string): string => {
    const decoded = Buffer.from(data, "base64").toString("utf8");
    const [b64CipherText, b64Salt, b64Nonce, b64Tag] = decoded.split("*");
    if (!b64CipherText || !b64Salt || !b64Nonce || !b64Tag) {
        throw new Error("Invalid format: expected cipher*salt*nonce*tag");
    }

    const cipherText = Buffer.from(b64CipherText, "base64");
    const salt = Buffer.from(b64Salt, "base64");
    const nonce = Buffer.from(b64Nonce, "base64");
    const tag = Buffer.from(b64Tag, "base64");

    const decodedKey = crypto.scryptSync(key, salt, 32, { N: 16384, r: 8, p: 1 });

    const decipher = crypto.createDecipheriv("aes-256-gcm", decodedKey, nonce);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(cipherText, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
};

export default {
    encrypt,
    decrypt,
};
