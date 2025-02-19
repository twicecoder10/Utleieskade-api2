const { User } = require("../models/index");
const { Op } = require("sequelize");

const getAllAdmins = async ({
  search,
  status,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const offset = (page - 1) * limit;
  const whereClause = { userType: "sub-admin" };

  if (search) {
    whereClause[Op.or] = [
      { userFirstName: { [Op.like]: `%${search}%` } },
      { userLastName: { [Op.like]: `%${search}%` } },
      { userEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) {
    whereClause.userStatus = status;
  }

  const { rows: admins, count: totalAdmins } = await User.findAndCountAll({
    where: whereClause,
    attributes: [
      ["userId", "adminId"],
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userStatus", "status"],
      ["createdAt", "dateRegistered"],
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder]],
  });

  return {
    admins,
    totalAdmins,
    totalPages: Math.ceil(totalAdmins / limit),
    currentPage: parseInt(page),
  };
};

const getAdminById = async (adminId) => {
  return await User.findOne({
    where: { userId: adminId, userType: "sub-admin" },
    attributes: [
      ["userId", "adminId"],
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userStatus", "status"],
      ["createdAt", "dateRegistered"],
    ],
  });
};

const updateAdmin = async (adminId, { firstName, lastName, email }) => {
  const admin = await User.findOne({
    where: { userId: adminId, userType: "sub-admin" },
  });
  if (!admin) return null;

  await admin.update({
    userFirstName: firstName || admin.userFirstName,
    userLastName: lastName || admin.userLastName,
    userEmail: email || admin.userEmail,
  });

  return await User.findOne({
    where: { userId: adminId },
    attributes: { exclude: ["userPassword"] },
  });
};

const deleteAdmin = async (adminId) => {
  const admin = await User.findOne({
    where: { userId: adminId, userType: "sub-admin" },
  });
  if (!admin) return null;

  await admin.destroy();
  return admin;
};

module.exports = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
