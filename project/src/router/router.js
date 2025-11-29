import { createRouter } from 'vue-router';
import AuthPage from '../views/AuthPage.vue'
import { createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'auth',
        component: AuthPage
    }
];

const router = createRouter({
    routes,
    history: createWebHistory()
})

export default router