const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'junction.proxy.rlwy.net',
  user: 'root',
  password: 'iuzhkBPfHFcxPKTelmUkVmCBKirbwQNc',
  port: 37045,
  database: 'railway',
  connectTimeout: 20000
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed: ', err.stack);
    return;
  }
  console.log('Connected to database as id ' + connection.threadId);
});
