import bcrypt from 'bcryptjs';

export function isBcryptHash(str: string) {
    return typeof str === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
  }


export async function encryptPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

export async function compareBcrypt(password: string, hash: string) {
    return await bcrypt.compare(password,hash)
}