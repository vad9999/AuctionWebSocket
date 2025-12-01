<template>
  <div class="auth-wrapper">
    <!-- Карточка авторизации -->
    <n-card title="Авторизация" class="auth-card" size="large">
      <n-form label-placement="top">
        <n-form-item label="Email">
          <n-input
            v-model:value="loginEmail"
            type="email"
            placeholder="Введите email"
          />
        </n-form-item>

        <n-form-item label="Пароль">
          <n-input
            v-model:value="loginPassword"
            type="password"
            placeholder="Введите пароль"
          />
        </n-form-item>

        <n-space justify="end">
          <n-button type="primary" @click="handleLogin">
            Войти
          </n-button>
          <n-button tertiary @click="openRegisterModal">
            Зарегистрироваться
          </n-button>
        </n-space>
      </n-form>
    </n-card>

    <!-- Модалка регистрации -->
    <n-modal
      v-model:show="showRegisterModal"
      preset="card"
      title="Регистрация"
      style="width: 480px"
    >
      <n-form label-placement="top">
        <n-form-item label="Фамилия">
          <n-input
            v-model:value="regLastName"
            placeholder="Введите фамилию"
          />
        </n-form-item>

        <n-form-item label="Имя">
          <n-input
            v-model:value="regFirstName"
            placeholder="Введите имя"
          />
        </n-form-item>

        <n-form-item label="Отчество">
          <n-input
            v-model:value="regPatronymic"
            placeholder="Введите отчество"
          />
        </n-form-item>

        <n-form-item label="Email">
          <n-input
            v-model:value="regEmail"
            type="email"
            placeholder="Введите email"
          />
        </n-form-item>

        <n-form-item label="Пароль">
          <n-input
            v-model:value="regPassword"
            type="password"
            placeholder="Введите пароль"
          />
        </n-form-item>

        <n-space justify="end">
          <n-button @click="closeRegisterModal">
            Отмена
          </n-button>
          <n-button type="primary" @click="handleRegister">
            Зарегистрироваться
          </n-button>
        </n-space>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client';
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSpace,
  NModal,
  useMessage
} from 'naive-ui';

const router = useRouter();
const message = useMessage();

// Логин
const loginEmail = ref('');
const loginPassword = ref('');

// Регистрация (отдельные поля)
const showRegisterModal = ref(false);
const regFirstName = ref('');
const regLastName = ref('');
const regPatronymic = ref('');
const regEmail = ref('');
const regPassword = ref('');

function openRegisterModal() {
  showRegisterModal.value = true;
}

function closeRegisterModal() {
  showRegisterModal.value = false;
  // можно сбросить поля, если хочешь
  // regFirstName.value = '';
  // regLastName.value = '';
  // regPatronymic.value = '';
  // regEmail.value = '';
  // regPassword.value = '';
}

async function handleLogin() {
  try {
    const res = await api.post('/api/auth/login', {
      email: loginEmail.value,
      password: loginPassword.value
    });

    const { user, token } = res.data;

    localStorage.setItem('accessToken', token);

    message.success(`Успешный вход: ${user.email}`);
    router.push('/main');
  } catch (e) {
    const text =
      e.response?.data?.error || e.message || 'Ошибка авторизации';
    message.error(text);
  }
}

async function handleRegister() {
  // простая проверка обязательных полей
  if (!regLastName.value || !regFirstName.value || !regEmail.value || !regPassword.value) {
    message.error('Фамилия, имя, email и пароль обязательны');
    return;
  }

  try {
    const res = await api.post('/api/auth/register', {
      firstName: regFirstName.value,
      lastName: regLastName.value,
      surname: regPatronymic.value || null,
      email: regEmail.value,
      password: regPassword.value
    });

    const { user, token } = res.data;

    localStorage.setItem('accessToken', token);

    message.success(`Успешная регистрация: ${user.email}`);
    showRegisterModal.value = false;
    router.push('/main');
  } catch (e) {
    const text =
      e.response?.data?.error || e.message || 'Ошибка регистрации';
    message.error(text);
  }
}
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-card {
  width: 400px;
  max-width: 90vw;
}
</style>