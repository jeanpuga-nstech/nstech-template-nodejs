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
const validateToken = (requiredRoles = []) => {
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

            const validAudiences = ['fracionado', 'hub-de-ofertas', 'realm-management', 'backoffice', 'config-nsapps', 'painel-de-produtos', 'poc-ao-vivo', 'account'];
            const hasValidAudience = decoded.aud.some(aud => validAudiences.includes(aud));

            if (!hasValidAudience) {
                return res.status(403).json({ message: 'Audience inválida' });
            }

            // Extraindo roles
            req.user = {
                id: decoded.sub,
                roles: decoded.realm_access.roles.concat(...Object.values(decoded.resource_access).map(resource => resource.roles))
            };

            // Verifica se o usuário possui pelo menos uma das roles necessárias
            const hasRequiredRole = requiredRoles.some(role => req.user.roles.includes(role));
            if (requiredRoles.length > 0 && !hasRequiredRole) {
                return res.status(403).json({ message: 'Acesso negado: Permissão insuficiente' });
            }

            next();
        });
    };
};

// Rota protegida que requer uma role específica
app.get('/protected', validateToken(['fracionado', 'dashboard']), (req, res) => {
    res.json({
        message: 'Acesso concedido',
        user: req.user
    });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
