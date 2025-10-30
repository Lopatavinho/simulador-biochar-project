// server.js

// 1. Carregar variáveis de ambiente
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// 2. Importações de Módulos Próprios
// Importa sequelize e modelos para sincronização e sessão
const { sequelize } = require('./models'); 
const authRoutes = require('./routes/auth'); // Etapa 4
const simulacaoRoutes = require('./routes/simulacao'); // Etapa 5

const app = express();
const PORT = process.env.PORT || 3000;

// 3. Configuração do Sequelize Store para Sessão (RNF05)
const sessionStore = new SequelizeStore({
    db: sequelize,
});

// 4. Configuração do Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 5. Configuração da Sessão
app.use(session({
    secret: process.env.SECRET_KEY_GOVBR || 'super-secreto-fallback', 
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: false, // Use true em produção com HTTPS
        httpOnly: true,
        maxAge: null, 
    }
}));

// 6. Configuração do EJS como motor de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 7. Servir arquivos estáticos (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 8. Middleware de proteção de rotas (checkAuth)
const checkAuth = (req, res, next) => {
    if (!req.session.usuarioId) {
        return res.redirect('/login');
    }
    next();
};

// 9. Rotas
app.use(authRoutes);
app.use(simulacaoRoutes); // Rotas POST /simular e /salvar-simulacao

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rotas de autenticação (não protegidas)
app.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro', { erro: null });
});

// Rotas Protegidas (aplicando checkAuth)
app.get('/simulador', checkAuth, (req, res) => {
    // Passa os parâmetros iniciais para a view, indicando que não há resultado ou erro
    res.render('simulador', { erro: null, resultado: null, sucesso: null }); 
});

app.get('/consulta', checkAuth, (req, res) => {
    // Rota de consulta (será implementada na Etapa 7)
    res.render('consulta', { simulacoes: [], termoBusca: '', erro: null, sucesso: null });
});

// 10. Iniciar o Servidor APÓS a Sincronização
sequelize.sync() 
    .then(() => {
        // Garante que a tabela de sessões seja criada
        return sessionStore.sync(); 
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erro ao conectar ou sincronizar com o banco de dados:', err);
    });
