const path = require('path');
const express = require('express');
const body_parser = require('body-parser');
const cookie_parser = require('cookie-parser');
const { Pool } = require("pg");
const CONFIG = require('./config.json')

const { generate_password, verify_password } = require('./lib/password')
const { generate_token, verify_token } = require('./lib/tokenizer')

const cookie_options = { maxAge: 1000 * 60 * 60, httpOnly: true }

async function run () {
  const pool = new Pool({
    connectionString: `postgres://postgres:postgres@localhost:5432/${CONFIG.database.name}`,
    max: 20
  });


  const app = express();
  
  app.use(body_parser.json({ extended: true }));
  app.use(cookie_parser())
  
  app.get('/api/me', async (req, res) => {
    if (!req.cookies.hasOwnProperty('racket_token') || req.cookies.racket_token === '') {
      return res.status(403).json({ error: 'No valid session.' })
    }

    const token = req.cookies.racket_token;
    const account = await verify_token(token);

    res.status(200).json({
      payload: {
        id: account.id,
        email: account.email
     }
    });
  })
  
  app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    const conn = await pool.connect();

    let result = await conn.query('select * from accounts WHERE email = $1', [email])
    if (result.rows.length > 0) {
      conn.release();
      return res.status(200).json({ error: 'E-mail already in use.' });
    }

    result = await conn.query(`insert into accounts (email, password) values($1, $2);`, [email, generate_password(password)]);
    conn.release();
  })
  
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const conn = await pool.connect();
    
    let result = await conn.query('select * from accounts WHERE email = $1', [email])
    if (result.rows.length === 0) {
      conn.release();
      return res.status(200).json({ error: 'Invalid credentials.' });
    }

    const account = result.rows[0];
    if (!verify_password(password, account.password)) {
      conn.release();
      return res.status(200).json({ error: 'Invalid credentials.' });
    }

    const token = await generate_token({
      id: account.id,
      email: account.email
    })

    conn.release();
    res
      .cookie('racket_token', token, cookie_options)
      .status(200)
      .json({ payload: null });
  })

  app.get('/api/logout', (req, res) => {
    if (!req.cookies.hasOwnProperty('racket_token')) {
      return res.status(403).json({ error: 'No valid session.' });
    }

    res
      .clearCookie('racket_token', cookie_options)
      .status(200)
      .json({ payload: null})
  })
  
  app.listen(3001, () => {
    console.log('listening on http://localhost:3001');
  });
}

run()