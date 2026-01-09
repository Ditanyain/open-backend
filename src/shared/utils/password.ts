import bcrypt from "bcrypt";

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (plain: string, hashed: string) => {
  return await bcrypt.compare(plain, hashed);
};

export { hashPassword, comparePassword };
