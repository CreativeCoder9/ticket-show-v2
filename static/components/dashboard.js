const dashboard = {
  template: `<div>

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
                <li class="nav-item">
                  <a class="nav-link"><router-link to="/bookings" style="float: right"> Your Bookings </router-link></a>
                </li> </ul>
            <a v-if="isLoggedIn" class="btn btn-primary shadow" role="button"><router-link to="/admin" style="float: right"> For Admin </router-link></a>
        </div>
    </div>
    </nav>

    <section id="userDashboard" class="min-vh-100" style="margin-top:150px">
    <div class="container-fluid text-center">
      <div class="row">
        <div class="col">
          <h6>Hi! {{ username }}!</h6>
          <h1 class="fw-bold underline">Your Dashboard</h1>
        </div>
      </div>
      <div v-if="theatres && theatres.length > 0">
        <div v-for="theatre in theatres" :key="theatre.id" class="row pt-4 mt-2 mx-auto shadow d-flex justify-content-center pb-5 mb-5" :style="{ backgroundImage: 'url(' + theatre.theatre_img + ')'}">
          <!-- ... Theatre details ... -->
          {{theatre.theatre_name}}, 📌Location: {{theatre.theatre_location}}
          <hr>
          <div v-if="theatre.shows && theatre.shows.length > 0" class="row">

          <div v-for="show in theatre.shows" :key="show.show_id" class="card col-3 m-3">
          <img :src="show.show_img" class="card-img-top shadow" style="margin-bottom:10px">
          <div class="card-body">
            <span class="card-title fw-bold">{{ show.show_name }}, </span
            ><span class="fw-normal px-1">{{ show.show_rating }}<i class="bi bi-star-fill" style="color: orange;"></i></span>
            <p class="card-text">Tags: {{ show.show_tags }}</p>
            <a class="btn btn-primary"><router-link :to="'/bookings/' + show.show_id" style="float: right"> Book Now! </router-link></a>
          </div>
          </div>


          </div>
          <div v-else>
            <div class="text-center col">
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

    </div>`,
  data: function () {
    return {
      isLoggedIn: JSON.parse(localStorage.getItem("isLoggedIn")),
      theatres: {},
      shows: {},
      username: "Guest!",
      start_time: "",
      start_time: "",
    };
  },
  methods: {
    getTheatres() {
      const headers = {
        Authorization: localStorage.getItem("Authorization"),
        "Content-Type": "application/json",
      };
      fetch("/api/theatres", { method: "GET", headers: headers })
        .then((res) => res.json())
        .then((data) => {
          this.theatres = data["theatres"];
        })
        .catch((err) => {
          console.log(err);
        });
    },
    getShows() {
      const headers = {
        Authorization: localStorage.getItem("Authorization"),
        "Content-Type": "application/json",
      };
      fetch("/api/shows", { method: "GET", headers: headers })
        .then((res) => res.json())
        .then((data) => {
          this.shows = data["shows"];
        })
        .catch((err) => {
          console.log(err);
        });
    },
    showsByTime(start_time, end_time) {
      const headers = {
        Authorization: localStorage.getItem("Authorization"),
        "Content-Type": "application/json",
      };
      fetch("/api/filter/theatres/time", { method: "GET", headers: headers })
        .then((res) => res.json())
        .then((data) => {
          this.shows = data["shows"];
        })
        .catch((err) => {
          console.log(err);
        });
    },
    getUserDetails() {
      const headers = {
        Authorization: localStorage.getItem('Authorization'),
        "Content-Type": "application/json",
      };
      fetch("/api/user", { method: "GET", headers: headers })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          this.username = data.user.user_name;
        })
        .catch((err) => {
          console.log(err);
        });
    },
    filter() {
      this.start_time = document.getElementById("start_time").value;
      this.start_time = document.getElementById("start_time").value;
      console.log(this.start_time);
      console.log(this.start_time);
      this.showsByTime(this.start_time, this.start_time);
    }
  },
  created() {
    this.getTheatres();
    this.getShows();
    this.getUserDetails();
    if (localStorage.getItem('Authorization') != null) {
      localStorage.setItem('isLoggedIn', true);
    }
  },
};

export default dashboard;
