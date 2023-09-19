const home = {
  template: `
    <div>
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
                <li v-if="isLoggedIn==false" class="nav-item">
                  <a class="nav-link"><router-link to="/login" style="float: right"> Login </router-link></a>
                </li>
                <li v-if="isLoggedIn==false" class="nav-item">
                  <a class="nav-link" href="/register"><router-link to="/register" style="float: right"> Register </router-link></a>
                </li> </ul>
                <a v-if="isLoggedIn" class="btn btn-primary shadow" role="button" @click="logout">Logout</a>
                <a v-if="isLoggedIn==false" class="btn btn-primary shadow" role="button"><router-link to="/admin" style="float: right"> For Admin </router-link></a>
            </div>
    </div>
    </nav>

    <header>
    <div class="container">
        <div class="row">
            <div class="col-md-8 text-center text-md-start mx-auto" style="margin-top: 125px;">
                <div class="text-center">
                    <h1 class="display-4 fw-bold mb-5 pt-0 mt-0">Tickets for your&nbsp;<span class="underline">Shows</span>.</h1>
                    <p class="fs-5 text-muted mb-5" style="margin-top: -19px;">Find, browse &amp; book shows in your favourite theatres&nbsp;</p>
                    <form class="d-flex justify-content-center flex-wrap" action="" method="post" @submit.prevent="search">
                        <div class="shadow-lg mb-3"><input class="form-control" v-model="query" type="text" name="query" placeholder="Search for shows, theatres, tags.." style="width: 315.594px;" required></div>
                        <div class="shadow-md mb-3"><button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#SearchResult" type="submit">Search</button></div>
                    </form>
                    <!-- Modal -->
                    <div class="modal fade" id="SearchResult" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                      <div class="modal-dialog">
                        <div class="modal-content">
                          <div class="modal-header">
                            <h5 class="modal-title" id="exampleModalLabel">Search Results: Shows & Theatres</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                          </div>
                          <div class="modal-body">

                          <div>
                            <!-- Shows -->
                            <div v-if="searchedShows.length > 0" class="row container my-3">
                              <h6 class="text-center fw-bold">Search result: Shows!</h6>
                              <div v-for="show in searchedShows" :key="show.show_id" class="col-6 card p-0 mx-auto">            
                                <div class="row g-0">
                                  <div class="col-md-4">
                                    <img :src="show.show_img" class="card-img-top shadow">
                                  </div>
                                  <div class="col-md-8">
                                    <div class="card-body">
                                      <h6 class="card-title fw-bold text-left">{{show.show_name}}</h6>
                                      <p class="card-text">{{show.show_tags}}</p>
                                    </div>
                                  </div>
                                  <div class="card-footer"><router-link :to="'/bookings/' + show.show_id" class="btn shadow" data-bs-dismiss="modal" aria-label="Close">Book the show!</router-link></div> 
                                </div>
                              </div>
                            </div>
                            <div v-else class="alert alert-danger text-center" role="alert">
                              No Show Found!
                            </div>
                            <div class="row mt-4 align-items-center justify-content-center">
                            <div v-for="theatre in searchedTheatres" :key="theatre.theatre_id" class="card col-5 mx-1 align-items-center" :style="{ backgroundImage: 'url(' + theatre.theatre_img + ')', backgroundSize: 'cover' }">
                            <div class="card-body">
                                <h6 class="card-title fw-bold"><router-link :to="'/theatres/' + theatre.theatre_id" data-bs-dismiss="modal" aria-label="Close">{{ theatre.theatre_name }}</router-link></h6>
                              </div>
                            </div>
                          </div>
                          <div v-if="searchedTheatres.length === 0" class="alert alert-danger text-center" role="alert">
                            No theatres found!
                          </div>
                          </div>
                          </div>
                          <div class="modal-footer"></div>
                        </div>
                      </div>
                    </div>
                </div>
            </div>
            <div class="col-12 col-lg-10 mx-auto">
                <div class="text-center position-relative">
                    <!--                       <img class="img-fluid" src="../static/images/home-ticket%20-%20Edited.png" style="width: 800px;"> -->
                    <lottie-player src="https://assets9.lottiefiles.com/packages/lf20_j1adxtyb.json"  background="transparent"  speed="0.8"  style="width: 700px;margin:auto;"  loop  autoplay></lottie-player>
                </div>
            </div>
        </div>
    </div>
    </header>

    <!-- Current Shows -->
    <section id="shows" class="container py-4">
    <h2 class="text-center underline">Top Shows</h2>
    <div class="row mt-4 d-flex justify-content-center">
      <!-- Show cards -->
      <div v-for="show in shows" :key="show.show_id" class="card col-3 m-3">
      <img :src="show.show_img" class="card-img-top shadow" style="margin-bottom:10px">
        <div class="card-body">
          <span class="card-title fw-bold">{{ show.show_name }}, </span
          ><span class="fw-normal px-1">{{ show.show_rating }}<i class="bi bi-star-fill" style="color: orange;"></i></span>
          <p class="card-text">Tags: {{ show.show_tags }}</p>
          <a class="btn btn-primary"><router-link :to="'/bookings/' + show.show_id" style="float: right"> Book Now! </router-link></a>
        </div>
      </div>
    </div>
    <div v-if="shows.length === 0" class="alert alert-danger text-center" role="alert">
      No shows found!
    </div>
    </section>

    <section id="theatres" class="container py-4 mb-5">
    <h2 class="text-center underline">All Theatres</h2>
    <div class="row mt-4 align-items-center d-flex justify-content-center">
      <!-- Theatre cards -->
      <div v-for="theatre in theatres" :key="theatre.theatre_id" class="card col-3 mx-1 align-items-center" :style="{ backgroundImage: 'url(' + theatre.theatre_img + ')', backgroundSize: 'cover' }">
      <div class="card-body">
          <h6 class="card-title fw-bold"><router-link :to="'/theatres/' + theatre.theatre_id">{{ theatre.theatre_name }}</router-link></h6>
        </div>
      </div>
    </div>
    <div v-if="theatres.length === 0" class="alert alert-danger text-center" role="alert">
      No theatres found!
    </div>
  </section>
    </div>
    `,
  data: function () {
    // localStorage.setItem('Authorization', 'WyI1Njc4NGRhYzEzYmU0ZjJmOGUzZTk5NDQ3ZDhlYjBhZSJd.ZM4Blw.5SwxYdlN_f0W8sl7t7fJvKqmo8Q')
    return {
      isLoggedIn: JSON.parse(localStorage.getItem("isLoggedIn")),
      query:'',
      shows: {},
      theatres: {},
      searchedShows: {},
      searchedTheatres: {}
    };
  },
  methods: {
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
    search(query) {
      const headers = {
        Authorization: localStorage.getItem("Authorization"),
        "Content-Type": "application/json",
      };
      console.log(this.query)
      fetch("/api/search/shows", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          search_query: this.query,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data["shows"]);
          this.searchedShows = data["shows"];
        })
        .catch((err) => {
          console.log(err);
        });
        fetch("/api/search/theatres", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            search_query: this.query,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            this.searchedTheatres = data["theatres"];
          })
          .catch((err) => {
            console.log(err);
          });
  


    },
    logout() {
      let userResponse = confirm("Are you sure you want to logout?");
      if (userResponse) {
        localStorage.removeItem("Authorization");
        localStorage.removeItem("isLoggedIn");
        this.isLoggedIn = false;
        alert("Logged out successfully");
        this.$router.push("/");
      } else {
        alert("Logout cancelled");
      }
    },
  },
  created() {
    this.getShows();
    this.getTheatres();
    if (localStorage.getItem('Authorization') != null) {
      localStorage.setItem('isLoggedIn', true);
    }
  },
};

export default home;
