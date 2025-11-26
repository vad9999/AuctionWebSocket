import { createRouter } from 'vue-router';
import StartPage from '../views/StartPage.vue'
import { createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'start',
        component: StartPage
    }
];

const router = createRouter({
    routes,
    history: createWebHistory()
})

export default router