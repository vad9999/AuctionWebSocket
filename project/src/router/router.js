import { createRouter } from 'vue-router';
import AuthPage from '../views/AuthPage.vue'
import MainPage from '../views/MainPage.vue';
import AuctionPage from '../views/AuctionPage.vue';
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
    },
    {
        path: '/auction/:id',
        name: 'auction',
        component: AuctionPage,
        props: true

    }
];

const router = createRouter({
    routes,
    history: createWebHistory()
})

export default router