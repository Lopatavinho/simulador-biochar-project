// models/Simulacao.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Simulacao = sequelize.define('Simulacao', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    tipoSolo: {
        // RF03: arenoso, argiloso, misto
        type: DataTypes.ENUM('Arenoso', 'Argiloso', 'Misto'),
        allowNull: false,
    },
    porcentagemBiochar: {
        // RF04: Ajuste da porcentagem de biochar
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    resultadoRetencao: {
        // RF05: Resultado da simulação (em %)
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    // O campo idUsuario (FK) será adicionado via Associação
}, {
    // Garante que a data de criação/atualização seja registrada
    timestamps: true,
    updatedAt: false, // Não precisamos do campo de atualização
});

module.exports = Simulacao;