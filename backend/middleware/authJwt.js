const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const Trainer = db.trainer;

// Function to verify the JWT token
const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

// Function to check if the user has the 'scheduler' role
const isScheduler = async (req, res, next) => {
  try {
    const user = await Trainer.findByPk(req.userId);
    if (user.role === 'scheduler') {
      next(); // Role is correct, proceed to the next function
      return;
    }
    // If the role is not 'scheduler', send a Forbidden error
    res.status(403).send({ message: "Require Scheduler Role!" });
  } catch (err) {
    res.status(500).send({ message: "Unable to validate user role." });
  }
};
const authJwt = {
  verifyToken: verifyToken,
  isScheduler: isScheduler,
};

module.exports = authJwt;