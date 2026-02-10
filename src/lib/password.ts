import bcrypt from "bcryptjs";

const DEFAULT_ROUNDS = 12;

export async function hashPassword(plain: string, rounds = DEFAULT_ROUNDS) {
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

