import home from './components/home.js'
import profile from './components/profile.js'
import login from './components/login.js'
import register from './components/register.js'
import dashboard from './components/dashboard.js'

const routes = [
  { path: '/', component: home, props:true },
  { path: '/profile/:id', component: profile },
  { path: '/login', component: login },
  { path: '/register', component: register },
  { path: '/dashboard', component: dashboard },
]

const router = new VueRouter({
  // mode: 'history',
  routes,
  base: '/',
})

const app = new Vue({
  el: '#app',
  router,
  data: function() {
    localStorage.clear()
    localStorage.setItem('isLoggedIn', false)
    return {
      isLoggedIn: localStorage.getItem('isLoggedIn'),
    }
  },
  methods: {
    async login() {
      localStorage.clear()
      localStorage.setItem('isLoggedIn', true)
  1},
 },
})

