// routes/auth.js
const express = require('express');
const router = express.Router();
const { Usuario } = require('../models');

// POST /cadastro
router.post('/cadastro', async (req, res) => {
    const { nome, email, tipoUsuario, senha, confirmarSenha } = req.body;

    // Validação simples (RF09 - Campos Obrigatórios)
    if (!nome || !email || !tipoUsuario || !senha || !confirmarSenha) {
        return res.render('cadastro', { erro: 'Todos os campos com * são obrigatórios.' });
    }

    // Validação de Senha (RF14 - Critérios de Segurança e Confirmação)
    // Expressão Regular para: pelo menos 1 maiúscula, 1 minúscula, 1 caractere especial, mínimo 8 caracteres
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/; 

    if (senha !== confirmarSenha) {
        return res.render('cadastro', { erro: 'A senha e a confirmação de senha não coincidem.' });
    }

    if (!senhaRegex.test(senha)) {
        return res.render('cadastro', { 
            erro: 'A senha não atende aos critérios de segurança (mínimo 8 caracteres, letras maiúsculas, minúsculas e especial).' 
        });
    }

    try {
        // Verifica se o usuário já existe
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.render('cadastro', { erro: 'E-mail já cadastrado.' });
        }

        // Cria o usuário (o hash da senha é feito no hook do modelo Usuario.js)
        await Usuario.create({ nome, email, tipoUsuario, senha });

        // Cadastro realizado com sucesso
        return res.render('login', { erro: 'Cadastro realizado com sucesso! Faça login.' });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        return res.render('cadastro', { erro: 'Erro interno ao tentar cadastrar.' });
    }
});

// POST /login
router.post('/login', async (req, res) => {
    const { email, senha, lembrar } = req.body;

    // Validação de campos (RF09)
    if (!email || !senha) {
        return res.render('login', { erro: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) {
            return res.render('login', { erro: 'E-mail ou senha incorretos.' });
        }

        // Usa o método validarSenha do modelo Usuario (com bcryptjs)
        const senhaValida = await usuario.validarSenha(senha);

        if (!senhaValida) {
            return res.render('login', { erro: 'E-mail ou senha incorretos.' });
        }

        // Se o login for bem-sucedido:

        // Cria a sessão do usuário
        req.session.usuarioId = usuario.id;
        req.session.isGov = usuario.autenticacaoGov;

        // RF10 - Lembrar de mim
        if (lembrar) {
            // Configura a sessão para expirar em, por exemplo, 7 dias.
            req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; 
        } else {
            // A sessão expira quando o navegador fechar (padrão)
            req.session.cookie.maxAge = null;
        }

        // Login bem-sucedido, redireciona para a tela principal (Simulador)
        return res.redirect('/simulador');

    } catch (error) {
        console.error('Erro no login:', error);
        return res.render('login', { erro: 'Erro interno ao tentar logar.' });
    }
});

// Rota de Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/login');
    });
});

// TODO: Rota de login via gov.br (RF02) - A integração real requer um cliente OAuth 2.0 e credenciais reais. 
// Vamos simular um sucesso de login gov.br para fins de demonstração:
router.get('/login/govbr', async (req, res) => {
    // Simulação: se o e-mail for "govbr@exemplo.com", assume que ele autenticou com sucesso
    const emailGov = 'govbr@exemplo.com'; 

    let usuario = await Usuario.findOne({ where: { email: emailGov } });

    if (!usuario) {
        // Cria um usuário fictício após o primeiro login Gov.br (simulação)
        usuario = await Usuario.create({
            nome: 'Usuário Gov.br', 
            email: emailGov, 
            tipoUsuario: 'Cidadao', 
            senha: 'SenhaPadraoGovBr1!', // Senha obrigatória, mas nunca será usada
            autenticacaoGov: true
        });
    }

    req.session.usuarioId = usuario.id;
    req.session.isGov = true;
    res.redirect('/simulador');
});

module.exports = router;