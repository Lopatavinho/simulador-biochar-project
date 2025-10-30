// models/Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');
const bcrypt = require('bcryptjs'); // Usado para hash seguro de senhas

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Garante que o e-mail é único
        validate: {
            isEmail: true, // Valida formato de e-mail
        },
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tipoUsuario: {
        // RF01: pesquisador, cidadão
        type: DataTypes.ENUM('Pesquisador', 'Cidadao'), 
        allowNull: false,
    },
    autenticacaoGov: {
        // Para armazenar informação se o login foi via Gov.br (RF02)
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    // Hooks para hash de senha antes de salvar no banco
    hooks: {
        beforeCreate: async (usuario) => {
            const salt = await bcrypt.genSalt(10);
            usuario.senha = await bcrypt.hash(usuario.senha, salt);
        },
        beforeUpdate: async (usuario) => {
            // Hashing apenas se a senha foi modificada
            if (usuario.changed('senha')) {
                const salt = await bcrypt.genSalt(10);
                usuario.senha = await bcrypt.hash(usuario.senha, salt);
            }
        }
    }
});

// Método auxiliar para comparar senha (uso na tela de Login)
Usuario.prototype.validarSenha = function(senha) {
    return bcrypt.compare(senha, this.senha);
};

module.exports = Usuario;