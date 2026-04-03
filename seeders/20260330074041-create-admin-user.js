'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    return queryInterface.bulkInsert('Users', [{
      name: 'Admin',
      surname: 'User',
      email: 'admin@petshop.com',
      password: hashedPassword,
      phone_number: '05000000000',
      role: 'admin',
      created_at: new Date(),
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', { email: 'admin@petshop.com' }, {});
  }
};