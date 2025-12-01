const express = require('express');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const app = express();

// Configurar o cliente JWKS
const jwksClient = jwksRsa({
    jwksUri: 'https://dev.nstech.com.br/foundation/auth/realms/nstech/protocol/openid-connect/certs', // Substitua pela URL do seu JWKS
});

// Função para obter a chave pública
function getKey(header, callback) {
    jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) {
            return callback(err);
        }
        callback(null, key.getPublicKey());
    });
}

// Middleware para validar o JWT e as roles
const validateAudience = (audience) => {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Token inválido' });
            }

            // Verifica o issued time (iat) e audience (aud)
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.iat > currentTime) {
                return res.status(403).json({ message: 'Token ainda não é válido' });
            }

            const hasValidAudience = decoded.aud.some(aud => aud === audience);

            if (!hasValidAudience) {
                return res.status(403).json({ message: 'Audience inválida' });
            }

            req.user = {
                id: decoded.sub
            };

            next();
        });
    };
};

const validateRole = (audience, role) => {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Token inválido' });
            }

            // Verifica o issued time (iat) e audience (aud)
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.iat > currentTime) {
                return res.status(403).json({ message: 'Token ainda não é válido' });
            }

            if (audience=="") {
                return res.status(403).json({ message: 'Audience inválida' });
            }

            var hasPermission = decoded.resource_access[audience]?.roles.includes(role)??false;

            if ((role??"")=="" || !hasPermission) {
                return res.status(403).json({ message: 'Acesso negado: Permissão insuficiente' });
            }

            next();
        });
    };
};

// Rota protegida que requer uma audiência específica
app.get('/protected1', validateAudience('hub-de-agendamento'), (req, res) => {
    res.json({
        message: 'Usuário possui audiencia válida',
        user: req.user
    });
});


// Rota protegida que requer uma role específica
app.get('/protected2', validateRole('hub-de-agendamento', 'admin'), (req, res) => {
    res.json({
        message: 'Acesso concedido',
        user: req.user
    });
});

// Rota protegida que requer uma role específica
app.get('/protected3', validateRole('hub-de-agendamento', 'dashboard'), (req, res) => {
    res.json({
        message: 'Acesso concedido',
        user: req.user
    });
});


// Rota protegida que requer uma audiência específica
app.get('/protected4', validateAudience('hub-de-agendamentossss'), (req, res) => {
    res.json({
        message: 'Acesso concedido',
        user: req.user
    });
});

// Inicia o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
