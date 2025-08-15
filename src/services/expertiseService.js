const { Expertise } = require("../models");
const { Op } = require("sequelize");

const getExpertises = async ({ page = 1, limit = 10, search }) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const whereClause = {};

  if (search) {
    whereClause[Op.or] = [{ expertiseArea: { [Op.like]: `%${search}%` } }];
  }

  const { count, rows } = await Expertise.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset,
  });

  return {
    expertises: rows,
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
  };
};

const createExpertise = async (data) => {
  const { expertiseArea, expertiseDescription } = data;

  const existingExpertise = await Expertise.findOne({
    where: { expertiseArea },
  });

  if (existingExpertise) {
    return { success: false, message: "Expertise already exists." };
  }

  const newExpertise = await Expertise.create({ expertiseArea, expertiseDescription });

  return { success: true, message: "Expertise added successfully", expertise: newExpertise };
};

const updateExpertise = async (expertiseCode, data) => {
  const expertise = await Expertise.findOne({ where: { expertiseCode } });

  if (!expertise) {
    return { success: false, message: "Expertise not found." };
  }

  await expertise.update(data);
  return { success: true, message: "Expertise updated successfully", expertise };
};

const deleteExpertise = async (expertiseCode) => {
  const expertise = await Expertise.findOne({ where: { expertiseCode } });

  if (!expertise) {
    return { success: false, message: "Expertise not found." };
  }

  await expertise.destroy();
  return { success: true, message: "Expertise deleted successfully" };
};

module.exports = {
  getExpertises,
  createExpertise,
  updateExpertise,
  deleteExpertise,
};