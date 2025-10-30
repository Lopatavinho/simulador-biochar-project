// db/database.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Inicializa o Sequelize, usando SQLite e definindo o local do arquivo .sqlite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    // O arquivo do banco de dados será criado na pasta db/simulador_biochar.sqlite
    storage: path.join(__dirname, 'simulador_biochar.sqlite'), 
    logging: false, // Desativa logs SQL no console para clareza
});

try {
    sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
} catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
}

module.exports = sequelize;