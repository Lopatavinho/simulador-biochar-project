// routes/simulacao.js
const express = require('express');
const router = express.Router();
const { Simulacao, Usuario } = require('../models');
const { Op } = require('sequelize');

// Dados estáticos de CRH base dos solos
const CRH_BASE = {
    'Arenoso': 10,
    'Misto': 18,
    'Argiloso': 25,
};

// Fator de Eficiência do Biochar (E = 1.5)
const EFICIENCIA_BIOCHAR = 1.5;

// Função para calcular a retenção hídrica (RF05)
function calcularRetencao(tipoSolo, porcentagemBiochar) {
    const crhBase = CRH_BASE[tipoSolo];
    
    if (!crhBase) {
        throw new Error("Tipo de solo inválido.");
    }
    
    // Fator de Aumento = (Porcentagem Biochar / 100) * Eficiência
    const fatorBiochar = (porcentagemBiochar / 100) * EFICIENCIA_BIOCHAR;
    
    // CRH Final = CRH Base + (CRH Base * Fator Biochar)
    const crhFinal = crhBase + (crhBase * fatorBiochar);
    
    return crhFinal;
}


// POST /simular (Etapa 5: Cálculo)
router.post('/simular', (req, res) => {
    const { tipoSolo, porcentagemBiochar } = req.body;
    const biochar = parseFloat(porcentagemBiochar);

    // Validação
    if (!tipoSolo || isNaN(biochar) || biochar < 0 || biochar > 15) {
        return res.render('simulador', { 
            erro: 'Parâmetros de simulação inválidos (Biochar deve ser entre 0% e 15%).',
            resultado: null,
            sucesso: null 
        });
    }

    try {
        const resultadoRetencao = calcularRetencao(tipoSolo, biochar);
        
        // Renderiza o simulador com o resultado
        return res.render('simulador', {
            erro: null,
            resultado: {
                tipoSolo,
                porcentagemBiochar: biochar,
                resultadoRetencao
            },
            sucesso: null
        });
    } catch (error) {
        return res.render('simulador', { erro: error.message, resultado: null, sucesso: null });
    }
});

// POST /salvar-simulacao (Etapa 6: Persistência)
router.post('/salvar-simulacao', async (req, res) => {
    const { tipoSolo, porcentagemBiochar, resultadoRetencao } = req.body;
    const idUsuario = req.session.usuarioId; // Obtido da sessão

    if (!idUsuario) {
         // Redireciona para o login se a sessão expirar
        return res.redirect('/login'); 
    }

    try {
        await Simulacao.create({
            tipoSolo,
            porcentagemBiochar: parseFloat(porcentagemBiochar),
            resultadoRetencao: parseFloat(resultadoRetencao),
            idUsuario
        });

        // Redireciona de volta ao simulador com mensagem de sucesso
        // Recarrega o resultado, garantindo que os campos estejam preenchidos
        return res.render('simulador', {
            erro: null,
            resultado: { 
                tipoSolo, 
                porcentagemBiochar: parseFloat(porcentagemBiochar), 
                resultadoRetencao: parseFloat(resultadoRetencao) 
            },
            sucesso: 'Simulação salva com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao salvar simulação:', error);
        return res.render('simulador', { erro: 'Erro ao salvar a simulação.', resultado: null, sucesso: null });
    }
});


// GET /consulta (Etapa 7: Listar simulações do usuário logado - RF21)
router.get('/consulta', async (req, res) => {
    const idUsuario = req.session.usuarioId; 

    try {
        // Busca todas as simulações para o usuário logado
        const simulacoes = await Simulacao.findAll({
            where: { idUsuario: idUsuario },
            // Ordena pela data de criação decrescente
            order: [['createdAt', 'DESC']] 
        });

        return res.render('consulta', { 
            simulacoes: simulacoes, 
            termoBusca: '', 
            erro: null,
            sucesso: req.query.sucesso || null // Permite passar mensagem de sucesso via query
        });

    } catch (error) {
        console.error('Erro ao buscar simulações:', error);
        return res.render('consulta', { 
            simulacoes: [], 
            termoBusca: '', 
            erro: 'Erro ao carregar suas simulações.',
            sucesso: null
        });
    }
});


// POST /simulacao/excluir/:id (Etapa 7: Excluir simulação - RF08)
router.post('/simulacao/excluir/:id', async (req, res) => {
    const idSimulacao = req.params.id;
    const idUsuario = req.session.usuarioId; 

    try {
        // Encontra e exclui a simulação, garantindo que pertença ao usuário logado
        const resultado = await Simulacao.destroy({
            where: {
                id: idSimulacao,
                idUsuario: idUsuario
            }
        });

        if (resultado > 0) {
            // Se a exclusão for bem-sucedida, redireciona para a consulta com mensagem de sucesso
            return res.redirect('/consulta?sucesso=Simulação excluída com sucesso.');
        } else {
            // Se 0 linhas foram afetadas, o registro não foi encontrado ou não pertencia ao usuário
            return res.redirect('/consulta?erro=Simulação não encontrada ou você não tem permissão.');
        }

    } catch (error) {
        console.error('Erro ao excluir simulação:', error);
        return res.redirect('/consulta?erro=Erro interno ao excluir a simulação.');
    }
});


module.exports = router;
