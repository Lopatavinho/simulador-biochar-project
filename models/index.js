// models/index.js
const sequelize = require('../db/database');
const Usuario = require('./Usuario');
const Simulacao = require('./Simulacao');

// 9. Relacionamentos:
// Um Usuário pode ter muitas Simulações (1:N)
Usuario.hasMany(Simulacao, {
    foreignKey: 'idUsuario',
    onDelete: 'CASCADE', // Se o Usuário for deletado, suas Simulações também são
});

Simulacao.belongsTo(Usuario, {
    foreignKey: 'idUsuario',
    allowNull: false,
});

// Exporta os modelos e o objeto de conexão
module.exports = {
    sequelize,
    Usuario,
    Simulacao,
};