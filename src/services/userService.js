const { User } = require("../models/index");

const createUser = async (userData) => {
  return await User.create(userData);
};

const fetchUserByEmail = async (userEmail) => {
  return await User.findOne({ where: { userEmail } });
};

const getUserById = async (id, requirePassword) => {
  let exclusions = [];
  if (!requirePassword) {
    exclusions.push("userPassword");
  }

  return await User.findByPk(id, {
    attributes: {
      exclude: exclusions,
    },
  });
};

const updateUser = async (userId, updateData) => {
  const user = await User.findOne({ where: { userId } });

  if (!user) return null;

  await user.update(updateData);

  return await User.findOne({
    where: { userId },
    attributes: { exclude: ["userPassword"] },
  });
};

module.exports = {
  createUser,
  fetchUserByEmail,
  getUserById,
  updateUser,
};
