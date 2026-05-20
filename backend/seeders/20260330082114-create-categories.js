'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Categories', [
      { name: 'Kuru Mama'},
      { name: 'Oyuncaklar'},
      { name: 'Sağlık Ürünleri'}
    ], {});
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Categories', null, {});
  }
};