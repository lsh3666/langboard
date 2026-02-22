import { Utils } from "@langboard/core/utils";
import crypto from "crypto";
import os from "os";

let sequence = 0n;
let lastTimestamp = 0n;

class SnowflakeID extends Number {
    static FIXED_SHORT_CODE_LENGTH = 11;
    static EPOCH = 1704067200000n;
    #value: bigint;

    constructor(value?: bigint | number | string) {
        if (Utils.Type.isString(value)) {
            const parsedValue = Number(value);
            if (isNaN(parsedValue)) {
                super(0);
                this.#value = 0n;
                return;
            }
            value = BigInt(value);
        }
        if (Utils.Type.isNumber(value)) {
            super(value);
            this.#value = BigInt(value);
            return;
        }

        if (Utils.Type.isBigInt(value)) {
            super(Number(value));
            this.#value = value;
            return;
        }

        const machineID = SnowflakeID.#getMachineID();

        const now = BigInt(Date.now());
        const timestamp = now - SnowflakeID.EPOCH;
        if (lastTimestamp === timestamp) {
            sequence = (sequence + 1n) & 0xfffn;
        } else {
            sequence = 0n;
            lastTimestamp = now;
        }

        value = (timestamp << 22n) | (BigInt(machineID) << 12n) | BigInt(SnowflakeID.#getRandomBits(20));
        super(value);
        this.#value = value;
    }

    public static fromShortCode(shortCode: string) {
        if (shortCode.length !== SnowflakeID.FIXED_SHORT_CODE_LENGTH) {
            return new SnowflakeID(0n);
        }
        const decodedInt = SnowflakeID.#base62Decode(shortCode);
        const originalValue = SnowflakeID.#feistelUnshuffle(decodedInt);
        return new SnowflakeID(originalValue);
    }

    public toShortCode() {
        const mixedValue = SnowflakeID.#feistelShuffle(this.#value);
        return SnowflakeID.#base62Encode(mixedValue);
    }

    public toString() {
        return this.#value.toString();
    }

    static #feistelShuffle(x: bigint, rounds = 4) {
        let left = x >> 32n;
        let right = x & 0xffffffffn;
        for (let i = 0; i < rounds; ++i) {
            const temp = right;
            right = left ^ ((right * SnowflakeID.EPOCH + BigInt(i)) & 0xffffffffn);
            left = temp;
        }
        return (left << 32n) | right;
    }

    static #feistelUnshuffle(x: bigint, rounds = 4) {
        let left = x >> 32n;
        let right = x & 0xffffffffn;
        for (let i = rounds - 1; i >= 0; --i) {
            const temp = left;
            left = right ^ ((left * SnowflakeID.EPOCH + BigInt(i)) & 0xffffffffn);
            right = temp;
        }
        return (left << 32n) | right;
    }

    static #base62Encode(n: bigint) {
        const s = [];
        while (n > 0n) {
            const r = n % 62n;
            s.push(Utils.String.BASE62_ALPHABET[Number(r)]);
            n = n / 62n;
        }
        return s.reverse().join("").padStart(SnowflakeID.FIXED_SHORT_CODE_LENGTH, Utils.String.BASE62_ALPHABET[0]);
    }

    static #base62Decode(s: string) {
        let n = 0n;
        for (let i = 0; i < s.length; i++) {
            n = n * 62n + BigInt(Utils.String.BASE62_ALPHABET.indexOf(s[i]));
        }
        return n;
    }

    static #getMachineID() {
        const modulo = 2 ** 10;

        const mac = os.networkInterfaces().eth0 ? os.networkInterfaces().eth0?.[0].mac : "00:00:00:00:00:00";
        const hostname = os.hostname();
        const raw = mac + hostname;

        const digest = crypto.createHash("sha256").update(raw).digest();

        const intVal = BigInt("0x" + digest.toString("hex").slice(0, 16));

        return intVal % BigInt(modulo);
    }

    static #getRandomBits(bits: number) {
        const bytes = Math.ceil(bits / 8);
        const randomBytes = crypto.randomBytes(bytes);

        let result = BigInt(0);
        for (let i = 0; i < randomBytes.length; i++) {
            result = (result << 8n) | BigInt(randomBytes[i]);
        }

        const mask = (1n << BigInt(bits)) - 1n;
        return result & mask;
    }
}

export default SnowflakeID;
