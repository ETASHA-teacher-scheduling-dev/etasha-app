const db = require("../models");
const Trainer = db.trainer;
const Module = db.module;
const Center = db.center;
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

// CREATE a new user with password hashing
exports.create = async (req, res) => {
  const { name, email, password, role, status } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send({ message: "Name, email, and password are required!" });
  }

  try {
    const newUser = await Trainer.create({
      name: name,
      email: email,
      password: bcrypt.hashSync(password, 10),
      role: role || 'trainer',
      status: status || 'active'
    });
    res.status(201).send(newUser);
  } catch (err) {
    // --- THIS IS THE FIX ---
    // Check if the error is specifically a unique constraint violation
    if (err.name === 'SequelizeUniqueConstraintError') {
      // Send a 409 Conflict status code and a user-friendly message
      return res.status(409).send({ message: "Validation error: An account with this email address already exists." });
    }
    // For any other type of error, send a generic 500 server error
    console.error("CREATE USER FAILED:", err);
    res.status(500).send({ message: err.message || "Some error occurred while creating the User." });
  }
};

exports.findAll = async (req, res) => {
  const { search, role } = req.query;
  const whereCondition = {};

  if (search) {
    whereCondition[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (role) {
    whereCondition.role = role;
  }

  try {
    const users = await Trainer.findAll({
      where: whereCondition,
      // --- THIS IS THE FIX ---
      // We add 'required: false' to make these LEFT JOINs instead of INNER JOINs.
      // This ensures that a user is returned even if they have no assigned modules or center.
      include: [
        { 
          model: db.module, 
          attributes: ['name'], 
          through: { attributes: [] }, // Don't include the join table
          required: false 
        },
        { 
          model: db.center, 
          attributes: ['name'],
          required: false 
        }
      ],
      order: [['name', 'ASC']]
    });
    res.status(200).send(users);
  } catch (err) {
    console.error("!!! ERROR FETCHING USERS:", err); // Better logging
    res.status(500).send({ message: err.message || "Error retrieving users." });
  }
};


// UPDATE a user by ID
exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await Trainer.findByPk(id);
    if (!user) {
      return res.status(404).send({ message: `Cannot find User with id=${id}.` });
    }

    const dataToUpdate = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      status: req.body.status,
      centerId: req.body.centerId || null,
    };

    // Only update password if a new one is provided
    if (req.body.password) {
      dataToUpdate.password = bcrypt.hashSync(req.body.password, 10);
    }

    await user.update(dataToUpdate);

    // This part is for the "Edit" modal where you can assign modules
    if (req.body.moduleIds) {
      await user.setModules(req.body.moduleIds);
    }

    res.send({ message: "User was updated successfully." });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err); 
    res.status(500).send({ message: `Error updating User with id=${id}` });
  }
};

// DELETE a user by ID
exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await Trainer.destroy({ where: { id: id } });
    if (num == 1) {
      res.send({ message: "User was deleted successfully!" });
    } else {
      res.send({ message: `Cannot delete User with id=${id}. Maybe it was not found.` });
    }
  } catch (err) {
    res.status(500).send({ message: `Could not delete User with id=${id}` });
  }
};