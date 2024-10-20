const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.log("No token provided, proceeding as guest");
    req.userId = null; // Ou qualquer valor que indique que é um usuário não autenticado
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Failed to authenticate token:", err);
      req.userId = null; // Se o token falhar, tratá-lo como um visitante
      return next();
    }

    req.userId = decoded.id;
    next();
  });
};
