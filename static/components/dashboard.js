const dashboard = {
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

    <section id="userDashboard" class="min-vh-100">
    <div class="container-fluid text-center">
      <div class="row">
        <div class="col">
          <h6>Hi! {{ username }}!</h6>
          <h1 class="fw-bold underline">Your Dashboard</h1>
        </div>
      </div>

      <form class="d-flex justify-content-center flex-wrap" @submit.prevent="searchByTime">
        <!-- ... Form inputs here ... -->
      </form>

      <div v-if="theatres && theatres.length > 0">
        <div v-for="theatre in theatres" :key="theatre.id" class="row pt-4 mt-2 mx-auto shadow d-flex justify-content-center pb-5 mb-5">
          <!-- ... Theatre details ... -->
          
          <div v-if="theatre.shows && theatre.shows.length > 0">
            <div v-for="show in theatre.shows" :key="show.id" class="card col-3 m-2">
              <!-- ... Show card details ... -->
              {{show}}}
            </div>
          </div>
          
          <div v-else>
            <div class="text-center">
              No show found!
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="alert alert-danger text-center" role="alert">
          No theatre or show found!
        </div>
      </div>
    </div>
  </section>
  {{shows}}}

    </div>`,
    data: function() {

      return {
        isLoggedIn: JSON.parse(localStorage.getItem('isLoggedIn')),
        theatres: {},
        shows: {}
      }
    },
    methods: {
      getTheatres() {
        const headers = {
          'Authorization': localStorage.getItem('Authorization'),
          'Content-Type': 'application/json',
        };
        fetch('/api/theatres', {method:"GET", headers: headers })
          .then(res => res.json())
          .then(data => {
            this.theatres = data['theatres'];
          })
          .catch(err => {
            console.log(err);
          });
        },
        getShows() {
          const headers = {
            'Authorization': localStorage.getItem('Authorization'),
            'Content-Type': 'application/json',
          };
          fetch('/api/shows', {method:"GET", headers: headers })
            .then(res => res.json())
            .then(data => {
              this.shows = data['shows'];
            })
            .catch(err => {
              console.log(err);
            });
          }


    },
    created() {
      this.getTheatres();
      this.getShows();
    }
}
  
  export default dashboard