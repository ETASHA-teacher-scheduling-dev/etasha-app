const bcrypt = require('bcryptjs');

const password = process.argv[2]; // Get password from command line

if (!password) {
  console.log("Please provide a password. Usage: node hash-password.js <your_password>");
  process.exit(1);
}

const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(password, salt);

console.log("Your hashed password is:");
console.log(hashedPassword);