const bcrypt = require('bcrypt');
const db = require('../config/db'); // Ajuste para o caminho correto do seu arquivo de configuração do banco

exports.getAllUsers = (req, res) => {
    const query = 'SELECT id, username, email, role, profilePicture FROM users'; // Inclua o que quiser retornar

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error executing query', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }

        res.status(200).json(results); // Retorna todos os usuários
    });
};

exports.updateUser = (req, res) => {
    const { username, email, password } = req.body;
    const userId = req.userId; // O ID do usuário é obtido do token JWT
    const profilePicture = req.file ? req.file.path : null;

    console.log('Update User Request Received');
    console.log('User ID:', userId);
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Profile Picture Provided:', profilePicture ? 'Yes' : 'No');

    let updateQuery = 'UPDATE users SET username = ?, email = ?';
    const queryParams = [username, email];

    if (profilePicture) {
        updateQuery += ', profilePicture = ?';
        queryParams.push(profilePicture);
    }

    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        updateQuery += ', password = ?';
        queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(userId);

    db.query(updateQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (results.affectedRows === 0) {
            console.warn('No user found with ID:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('User information updated successfully for ID:', userId);
        res.status(200).json({ message: 'User information updated successfully' });
    });
};

exports.updateUserAdmin = (req, res) => {
    const { username, email, password, role } = req.body;
    const { id } = req.params;
    const profilePicture = req.file ? req.file.path : null;

    console.log('Admin update request received');
    console.log('User ID:', id);
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Role:', role);
    console.log('Profile Picture Provided:', profilePicture ? 'Yes' : 'No');

    let updateQuery = 'UPDATE users SET username = ?, email = ?';
    const queryParams = [username, email];

    if (role) {
        updateQuery += ', role = ?';
        queryParams.push(role);
    }

    if (profilePicture) {
        updateQuery += ', profilePicture = ?';
        queryParams.push(profilePicture);
    }

    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        updateQuery += ', password = ?';
        queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(id);

    db.query(updateQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (results.affectedRows === 0) {
            console.warn('No user found with ID:', id);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('User information updated successfully for ID:', id);
        res.status(200).json({ message: 'User information updated successfully' });
    });
};


exports.getUserById = (req, res) => {
    const userId = req.params.id;

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const query = 'SELECT id, username, email, profilePicture FROM users WHERE id = ?';
    db.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error executing query', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
    
        const user = results[0];
    
        // Verifica se a imagem de perfil existe e trata dependendo do formato
        if (user.profilePicture) {
            // Verifica se a imagem é uma URL completa
            if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
                // É uma URL externa (como do Google), mantém a URL externa como está
                user.profilePicture = user.profilePicture;
            } else {
                // É um caminho local, troca barras invertidas por barras normais e adiciona o prefixo
                user.profilePicture = `https://blog-backend-production-c203.up.railway.app/${user.profilePicture.replace(/\\/g, '/')}`;
            }
        }        
    
        res.status(200).json(user);
    });
};

exports.deleteUser = (req, res) => {
    const userId = parseInt(req.params.id);  // Converte userId para número
    console.log('Request to delete user received'); // Log para verificar a requisição
    console.log('User ID to delete:', userId); // Log do ID do usuário recebido

    if (isNaN(userId)) {
        console.warn('Invalid user ID format:', userId);
        return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // Primeiro, verifica se o usuário existe
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Database error while checking user existence:', err);
            return res.status(500).json({ message: 'Database error while checking user existence', error: err });
        }
        if (results.length === 0) {
            console.warn('No user found with ID:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User found. Proceeding with deletion steps.'); // Log para indicar que o usuário existe

        // Desativar verificações de chave estrangeira
        db.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
            if (err) {
                console.error('Error disabling foreign key checks:', err);
                return res.status(500).json({ message: 'Error disabling foreign key checks', error: err });
            }
            console.log('Foreign key checks disabled'); // Log de sucesso

            // Deleta likes, comentários e posts
            const deleteQueries = [
                { query: 'DELETE FROM likes WHERE user_id = ?', name: 'Likes' },
                { query: 'DELETE FROM comments WHERE user_id = ?', name: 'Comments' },
                { query: 'DELETE FROM posts WHERE user_id = ?', name: 'Posts' }
            ];

            let deleteIndex = 0;

            const executeNextQuery = () => {
                if (deleteIndex < deleteQueries.length) {
                    const { query, name } = deleteQueries[deleteIndex];
                    db.query(query, [userId], (err, results) => {
                        if (err) {
                            console.error(`Database error during ${name.toLowerCase()} deletion:`, err);
                            return res.status(500).json({ message: `Database error during ${name.toLowerCase()} deletion`, error: err });
                        }
                        console.log(`${name} deleted successfully for user ID:`, userId); // Log para cada etapa de deleção
                        deleteIndex++;
                        executeNextQuery();
                    });
                } else {
                    console.log('All related data deleted. Proceeding to delete user.'); // Log após deletar dados relacionados

                    // Deleta o usuário após as tabelas relacionadas
                    db.query('DELETE FROM users WHERE id = ?', [userId], (err, results) => {
                        if (err) {
                            console.error('Database error during user deletion:', err);
                            return res.status(500).json({ message: 'Database error during user deletion', error: err });
                        }

                        console.log('User deletion results:', results); // Log dos resultados da deleção do usuário

                        if (results.affectedRows === 0) {
                            console.warn('No user found with ID:', userId);
                            return res.status(404).json({ message: 'User not found' });
                        }

                        console.log('User deleted successfully with ID:', userId); // Log de sucesso da deleção

                        db.query('SET FOREIGN_KEY_CHECKS = 1', (err) => {
                            if (err) {
                                console.error('Error re-enabling foreign key checks:', err);
                                return res.status(500).json({ message: 'Error re-enabling foreign key checks', error: err });
                            }

                            console.log('Foreign key checks re-enabled'); // Log de sucesso
                            res.status(200).json({ message: 'User and related data deleted successfully' });
                        });
                    });
                }
            };

            executeNextQuery();
        });
    });
};




  
  
  

