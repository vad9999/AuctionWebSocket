const authService = require('../services/auth');

async function register(req, res) {
  try {
    const { firstName, lastName, surname, email, password } = req.body;

    const result = await authService.register({
      firstName,
      lastName,
      surname,
      email,
      password
    });

    return res.status(201).json(result);
  } catch (e) {
    console.error('Register error:', e);
    return res.status(400).json({ error: e.message || 'Ошибка регистрации' });
  }
}


async function login(req, res) {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    return res.json(result);
  } catch (e) {
    console.error('Login error:', e);
    return res.status(401).json({ error: e.message || 'Ошибка авторизации' });
  }
}

module.exports = {
  register,
  login
};