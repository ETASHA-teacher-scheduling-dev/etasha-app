const db = require("../models");
const Center = db.center;

// CREATE a new center
exports.create = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).send({ message: "Center name cannot be empty!" });
  }
  try {
    const center = await Center.create(req.body);
    res.status(201).send(center);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating the Center." });
  }
};

// RETRIEVE all centers
exports.findAll = async (req, res) => {
  try {
    const centers = await Center.findAll();
    res.status(200).send(centers);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error retrieving centers." });
  }
};

// UPDATE a center by ID
exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const [num] = await Center.update(req.body, { where: { id: id } });
    if (num == 1) {
      res.send({ message: "Center was updated successfully." });
    } else {
      res.status(404).send({ message: `Cannot update Center with id=${id}. Maybe it was not found!` });
    }
  } catch (err) {
    res.status(500).send({ message: `Error updating Center with id=${id}` });
  }
};

// DELETE a center by ID
exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await Center.destroy({ where: { id: id } });
    if (num == 1) {
      res.send({ message: "Center was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete Center with id=${id}. Maybe it was not found.` });
    }
  } catch (err) {
    res.status(500).send({ message: `Could not delete Center with id=${id}` });
  }
};