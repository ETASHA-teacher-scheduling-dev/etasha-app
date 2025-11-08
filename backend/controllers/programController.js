const db = require("../models");
const Program = db.program;
const { Op } = require("sequelize");

// Find all programs with search
exports.findAll = async (req, res) => {
  console.log("--- Fetching all programs. Query params:", req.query); // DEBUG LOG
  const { search } = req.query;
  const whereCondition = {};

  if (search) {
    whereCondition[Op.or] = [
      { program_name: { [Op.iLike]: `%${search}%` } },
      // Add other searchable fields if needed
    ];
  }

  try {
    // The query will be empty {} if no search term, fetching all programs.
    const programs = await Program.findAll({ where: whereCondition, order: [['program_name', 'ASC']] });
    console.log(`--- Found ${programs.length} programs. ---`); // DEBUG LOG
    res.status(200).send(programs);
  } catch (err) {
    console.error("!!! ERROR fetching programs:", err); // DEBUG LOG
    res.status(500).send({ message: err.message });
  }
};

// Create a new program
exports.create = async (req, res) => {
  try {
    const program = await Program.create(req.body);
    res.status(201).send(program);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// --- NEW FUNCTION: Update a program by ID ---
exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const [num] = await Program.update(req.body, { where: { id: id } });
    if (num == 1) {
      res.send({ message: "Program was updated successfully." });
    } else {
      res.status(404).send({ message: `Cannot update Program with id=${id}. Maybe it was not found!` });
    }
  } catch (err) {
    res.status(500).send({ message: `Error updating Program with id=${id}` });
  }
};

// --- NEW FUNCTION: Delete a program by ID ---
exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await Program.destroy({ where: { id: id } });
    if (num == 1) {
      res.send({ message: "Program was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete Program with id=${id}. Maybe it was not found.` });
    }
  } catch (err) {
    res.status(500).send({ message: `Could not delete Program with id=${id}` });
  }
};