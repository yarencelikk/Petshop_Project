'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Pet_Types', [
      { name: 'Kedi' },
      { name: 'Köpek' },
      { name: 'Kuş' }
    ], {});
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('PetTypes', null, {});
  }
};