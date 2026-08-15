/**
 * Aplica correção de autenticação MySQL (mysql_native_password) para a API conseguir conectar.
 * Lê usuário e senha do .env. Rode: node fix_mysql_auth.js
 */
require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const host = process.env.DB_HOST || 'localhost';

if (!password) {
  console.error('Defina DB_PASSWORD no arquivo .env (mesma senha do MySQL).');
  process.exit(1);
}

// Escapar aspas simples na senha para o SQL
const passEscaped = String(password).replace(/\\/g, '\\\\').replace(/'/g, "''");
const hostPart = host === 'localhost' ? 'localhost' : '%';
// MariaDB: IDENTIFIED BY 'senha'. MySQL 8: IDENTIFIED WITH mysql_native_password BY 'senha'.
// Usando sintaxe MariaDB (funciona no HeidiSQL / MariaDB).
const sql = `ALTER USER '${user}'@'${hostPart}' IDENTIFIED BY '${passEscaped}';\nFLUSH PRIVILEGES;`;
const sqlPath = path.join(__dirname, 'fix_auth_run.sql');
fs.writeFileSync(sqlPath, sql, 'utf8');

const mysqlPaths = [
  'mysql',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysql.exe',
  'C:\\xampp\\mysql\\bin\\mysql.exe',
  'C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysql.exe',
  'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysql.exe'
];

function tryRun(mysqlExe, cb) {
  const args = ['-u', user, `-p${password}`, '--default-character-set=utf8mb4'];
  const child = spawn(mysqlExe, args, { stdio: ['pipe', 'inherit', 'inherit'], shell: false });
  const stream = fs.createReadStream(sqlPath);
  stream.pipe(child.stdin);
  child.on('close', (code) => {
    try { fs.unlinkSync(sqlPath); } catch (_) {}
    cb(code);
  });
  child.on('error', () => cb(-1));
}

function runNext(i) {
  if (i >= mysqlPaths.length) {
    console.error('MySQL/MariaDB CLI nao encontrado. Rode no HeidiSQL (MariaDB):');
    console.error('  ALTER USER \'' + user + '\'@\'localhost\' IDENTIFIED BY \'sua_senha\';');
    console.error('  FLUSH PRIVILEGES;');
    process.exit(1);
  }
  const mysqlExe = mysqlPaths[i];
  tryRun(mysqlExe, (code) => {
    if (code === 0) {
      console.log('Correção aplicada. Pode iniciar a API.');
      process.exit(0);
    }
    runNext(i + 1);
  });
}

console.log('Aplicando correção MySQL (mysql_native_password)...');
runNext(0);
