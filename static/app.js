import home from './components/home.js'
import login from './components/login.js'
import register from './components/register.js'
import dashboard from './components/dashboard.js'
import theatre from './components/theatre.js'
import admin from './components/admin.js'
import updateTheatre from './components/update-theatre.js'
import updateShow from './components/update-show.js'
import addShow from './components/add-show.js'
import addTheatre from './components/add-theatre.js'
import confirmBooking from './components/confirm-bookings.js'
import bookings from './components/bookings.js'


const routes = [
  { path: '/', component: home, props:true },
  { path: '/login', component: login },
  { path: '/register', component: register },
  { path: '/dashboard', component: dashboard },
  { path: '/theatres/:id', component: theatre, props:true },
  { path: '/admin', component: admin },
  { path: '/update-theatre/:id', component: updateTheatre, props:true },
  { path: '/update-show/:id', component: updateShow, props:true },
  { path: '/add-show', component: addShow },
  { path: '/add-theatre', component: addTheatre },
  { path: '/bookings/:id', component: confirmBooking, props:true },
  { path: '/bookings', component: bookings },

]

const router = new VueRouter({
  // mode: 'history',
  routes,
  base: '/',
})

router.beforeEach((to, from, next) => {
  if (to.path === '/login' || to.path === '/register' || to.path === '/') {
    next()
  } else {
    if (localStorage.getItem('Authorization') != null) {

      if (to.path === '/admin' && localStorage.getItem('role') != 'admin') {
        next('/login')
      }
      else if (to.path === '/add-show' && localStorage.getItem('role') != 'admin') {
        alert('You are not authorized to access this page');
        next('/')
      }
      else if (to.path === '/add-theatre' && localStorage.getItem('role') != 'admin') {
        alert('You are not authorized to access this page');
        next('/')
      }
      next()
    } else {
      next('/login')
    }
  }
})


const app = new Vue({
  el: '#app',
  router,
  data: function() {
    return {
      isLoggedIn: localStorage.getItem('isLoggedIn'),
    }
  },
  methods: {},
    
 created() {
  if (localStorage.getItem('Authorization') != null) {
    localStorage.setItem('isLoggedIn', true);
  } else {
    localStorage.setItem('isLoggedIn', false);
  }

 }
})

