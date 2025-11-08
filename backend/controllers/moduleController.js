const db = require("../models");
const Module = db.module;

// GET /api/modules - Get all modules
exports.findAll = async (req, res) => {
  console.log("--- Fetching all modules ---"); // DEBUG LOG
  try {
    // We remove all 'where' conditions for now to ensure we get all data.
    const modules = await Module.findAll({ order: [['name', 'ASC']] });
    console.log(`--- Found ${modules.length} modules. ---`); // DEBUG LOG
    res.status(200).send(modules);
  } catch (err) {
    console.error("!!! ERROR fetching modules:", err); // DEBUG LOG
    res.status(500).send({ message: err.message });
  }
};
// CREATE
exports.create = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).send({ message: "Module name cannot be empty!" });
  }
  try {
    const module = await Module.create(req.body);
    res.status(201).send(module);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


// UPDATE
exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const [num] = await Module.update(req.body, { where: { id: id } });
    if (num == 1) {
      res.send({ message: "Module was updated successfully." });
    } else {
      res.status(404).send({ message: `Cannot update Module with id=${id}.` });
    }
  } catch (err) {
    res.status(500).send({ message: "Error updating Module." });
  }
};

// DELETE
exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await Module.destroy({ where: { id: id } });
    if (num == 1) {
      res.send({ message: "Module was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete Module with id=${id}.` });
    }
  } catch (err) {
    res.status(500).send({ message: "Could not delete Module." });
  }
};