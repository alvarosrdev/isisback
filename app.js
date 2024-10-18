const express = require('express');
const session = require('express-session');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

const conn = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'isis'});

// Middleware
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173', // Cambia esto a la URL de tu cliente
  credentials: true // Permite el envío de cookies y encabezados de autenticación
}));


app.use(session({
  secret: 'alvarosrDev',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 1800000, // 30 minutos
    secure: false // Cambiar a true en producción con HTTPS
  }
}));

const isAuthenticated = (req, res, next) => {
  console.log('Verificando autenticación...');
  if (req.session.user) {
    return next();
  } else {
    return res.status(401).json({ message: 'No autorizado' });
  }
};


app.get('/amilogged', (req, res) => {
  if (req.session.user) {
    return res.json({ message: 'y' });
  } else {
    return res.json({ message: 'n' });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM usuarios WHERE usuario = ? AND contra = ?`;
  conn.query(query, [username, password], (err, result) => {
    if (err) {
      console.error('Error during query:', err);
      return res.status(500).send('Hubo un error en el servidor');
    }

    if (result.length > 0) { 
      req.session.user = username;
      console.log(`Usuario logueado: ${username}`);
      return res.json({ pass: 'y' });
    } else {
      return res.status(401).json({ message: 'Credenciales incorrectas', pass: 'n' });
    }
  });
});


  // if (username === 'holita' && password === 'holita') {
  //   req.session.user = username; 
  //   console.log(`Usuario logueado: ${username}`); 
  //   return res.json({ pass: 'y' });
  // } else {
  //   return res.status(401).json({ message: 'Credenciales incorrectas', pass: 'n' });
  // }

app.get('/posts', (req, res) => {

  if (req.session.user) {
    conn.query('SELECT * FROM publicaciones ORDER BY id DESC', (err, result) => {
      if (err) {
        console.error('Error during query:', err);
        return res.status(500).send('Hubo un error en el servidor');
      }
  
      res.json(result);
    });
  }else{
    res.status(401).send('Inicie sesión')
  }

  
});




app.get('/protected', isAuthenticated, (req, res) => {
  res.json({ message: `Acceso permitido a ${req.session.user}` });
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesión cerrada correctamente' });
  });
});

app.listen(3001, () => {
  console.log('Backend corriendo en puerto 3001');
});