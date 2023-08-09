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
            <a v-if="!isLoggedIn" class="btn btn-primary shadow" role="button"><router-link to="/login" style="float: right"> For Admin </router-link></a>
        </div>
    </div>
    </nav>

  <div id="home-page" class="container min-vh-100 shadow p-5" style="margin-top:150px;">
  <div class="col-8">
    <h1 class="fw-bold" style="margin-top:20px;">Welcome to the Show :)</h1>
    <h5>Book your shows & share your reviews, because they matter....</h5>
  </div>
  <div id = "signup-form" class="col -8 container mt-3 mb-5">
      <div>
        <form action="" method="POST">
            <div class="form-group">
              <label for="email">Email address</label>
              <input name="email" type="email" class="form-control" id="email" required>
              <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input name="password" type="password" class="form-control" id="password" required>
            </div>
            <button id="registration-button" type="submit" class="btn btn-primary mb-2">Sign up</button> 
        </form>
        <a href="/login">Already have an account? login here.</a>
      </div>
    </div>
  </div>
  </div>
    </div>`,
    data: function() {

      return {
        isLoggedIn: JSON.parse(localStorage.getItem('isLoggedIn')),
      }
    }
}
  
  export default register