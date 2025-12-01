import { createRouter } from 'vue-router';
import AuthPage from '../views/AuthPage.vue'
import MainPage from '../views/MainPage.vue';
import { createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'auth',
        component: AuthPage
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    },
    {
        path: '/main',
        name: 'main',
        component: MainPage
    }
];

const router = createRouter({
    routes,
    history: createWebHistory()
})

export default router