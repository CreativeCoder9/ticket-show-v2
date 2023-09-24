const register = {
  template: 
  `<div>

  <nav class="navbar navbar-light navbar-expand-md fixed-top navbar-shrink py-3" id="mainNav">
  <div class="container">
      <img src="../static/images/Ticket%20Show%20Logo.png" width="194" height="66">
      <button data-bs-toggle="collapse" class="navbar-toggler" data-bs-target="#navcol-1">
      <span class="visually-hidden">Toggle navigation</span><span class="navbar-toggler-icon"></span></button>
      <div class="collapse navbar-collapse" id="navcol-1">
          <ul class="navbar-nav mx-auto">
              <li class="nav-item"><a class="nav-link"><router-link to="/" style="float: right"> Home </router-link></a></li>
              <li class="nav-item"><a class="nav-link"><router-link to="/dashboard" style="float: right"> Dashboard </router-link></a></li>
              <li class="nav-item"><a class="nav-link"><router-link to="/admin" style="float: right"> Admin Dashboard </router-link></a></li>   
              <li v-if="!isLoggedIn" class="nav-item">
                <a class="nav-link"><router-link to="/login" style="float: right"> Login </router-link></a>
              </li>
              <li v-if="!isLoggedIn" class="nav-item">
                <a class="nav-link" href="/register"><router-link to="/register" style="float: right"> Register </router-link></a>
              </li> </ul>
          <a v-if="isLoggedIn" class="btn btn-primary shadow" role="button"><router-link to="/logout" style="float: right"> Logout </router-link></a>
          <a v-if="isLoggedIn" class="btn btn-primary shadow" role="button"><router-link to="/login" style="float: right"> For Admin </router-link></a>
      </div>
  </div>
  </nav>

  <div class="container-fluid min-vh-100" style="margin-top: 200px;">
  <div id="login-form" class="container card">
    <div class="my-auto">
      <h1 class="display-4 fw-bold">Welcome to the show!</h1>
      <p>Register your account here!</p>
      <form @submit.prevent="register">
        <div class="form-group">
          <label for="email">Email address</label>
          <input v-model="email" type="email" name="email" class="form-control" id="email">
          <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input v-model="password" name="password" type="password" class="form-control" id="password">
        </div>
        <button id="login-button" type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>
  </div>
</div>


  </div>`,
  data: function() {
    return {
      email: '',
      password: '',
      isLoggedIn: JSON.parse(localStorage.getItem('isLoggedIn')),
      authToken: localStorage.getItem('Authorization')

    }
  },
  methods: {
    register() {  

      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      var raw = JSON.stringify({
        "user_name": this.email,
        "email": this.email,
        "password": this.password
      });
      
      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };

      fetch("/auth/register", requestOptions)
      .then(response => response.json())
      .then(result => {
        alert("Registration Successful");
        this.login();
      })
      .catch(error => {
        alert("Registration Failed");
        console.log('error', error)
      });
    },login() {  

      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      var raw = JSON.stringify({
        "user_name": this.email,
        "email": this.email,
        "password": this.password
      });
      
      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };

      fetch("/auth/login?include_auth_token", requestOptions)
      .then(response => response.json())
      .then(result => {
        console.log(result.response.user.authentication_token);
        localStorage.setItem('Authorization', result.response.user.authentication_token);
        alert("Login Successful");
        this.$router.push('/dashboard');
      })
      .catch(error => {
        alert("Invalid Credentials");
        console.log('error', error)
      });
    }

  },
  created() {
    if (localStorage.getItem('Authorization') != null) {
      localStorage.setItem('isLoggedIn', true);
      this.$router.push('/dashboard');
    }
  }
}

export default register