const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = '30m';

function buildUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    surname: user.surname
  };
}

async function register({ firstName, lastName, surname, email, password }) {
  if (!firstName || !lastName || !email || !password) {
    throw new Error('Имя, фамилия, email и пароль обязательны');
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error('Пользователь с таким email уже существует');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName,
    lastName,
    surname: surname || null,   
    email,
    passwordHash
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: buildUserResponse(user),
    token
  };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new Error('Email и пароль обязательны');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Неверный email или пароль');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Неверный email или пароль');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: buildUserResponse(user),
    token
  };
}

module.exports = {
  register,
  login
};