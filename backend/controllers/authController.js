const db = require("../models");
const config = require("../config/auth.config"); // We will create this
const Trainer = db.trainer;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// We'll create a 'signup' function for creating new users later.
// For now, let's focus on SIGN IN.

exports.signin = async (req, res) => {
  try {
    // 1. Find the user by their email
    const user = await Trainer.findOne({
      where: {
        email: req.body.email,
      },
    });

    // If no user is found with that email
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    // --- THIS IS THE NEW SECURITY CHECK ---
    // 2. Check if the user's status is 'inactive'
    if (user.status === 'inactive') {
      return res.status(403).send({ // 403 Forbidden is a good status code here
        message: "Your account is inactive. Please contact an administrator.",
      });
    }
    // --- END OF NEW CHECK ---

    // 3. If the user is active, proceed to check the password
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    // If the password is not valid
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    // 4. If password is valid, generate a token and send the user data
    const token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400, // 24 hours
    });

    res.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken: token,
    });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};