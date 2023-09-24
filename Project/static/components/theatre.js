const theatre = {
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
    
    <section id="theatre" class="mb-5 pb-5 min-vh-100" style="margin-top:150px">
    <h2 class="text-center underline">Theatre Info</h2>
    <div class="row mt-4 align-items-start pt-3">
      <!-- Theatre column -->
      <div class="card col-3 mx-2">
        <ul class="list-group p-2">
          <li class="list-group-item fw-bold" :style="{ backgroundImage: 'url(' + theatre.theatre_img + ')', backgroundSize: 'cover' }">{{ theatre.theatre_name }}</li>
          <li class="list-group-item">Place: {{ theatre.theatre_location }}</li>
          <li class="list-group-item">Capacity: {{ theatre.theatre_capacity }}</li>
        </ul>
      </div>
      <!-- Shows column -->
      <div class="col-8 mb-5">
        <div class="row">
          <div v-if="theatre && theatre.shows && theatre.shows.length>0" class="row">
            <div v-for="show in theatre.shows" :key="show.show_id" class="card p-2 m-2 col">
            <img :src="show.show_img" class="card-img-top shadow" style="margin-bottom:10px">
            <div class="card-body">
              <span class="card-title fw-bold">{{ show.show_name }}, </span
              ><span class="fw-normal px-1">  {{ show.show_rating }} <i class="bi bi-star-fill" style="color: orange;"></i></span>
              <p class="card-text">Tags: {{ show.show_tags }}</p>
              <a class="btn btn-primary"><router-link :to="'/bookings/' + show.show_id" style="float: right"> Book Now! </router-link></a>
            </div>
            </div>
          </div>
          <div v-else class="alert alert-danger text-center" role="alert">
            <p>No Shows found!</p>
          </div>
        </div>
      </div>
    </div>
  </section>
    </div>`,
  data: function () {
    return {
      isLoggedIn: JSON.parse(localStorage.getItem("isLoggedIn")),
      theatre: {},
    };
  },
  methods: {
    getTheatre(id) {
      const headers = {
        Authorization: localStorage.getItem('Authorization'),
        "Content-Type": "application/json",
      };
      fetch("/api/theatres/"+id, { method: "GET", headers: headers })
        .then((res) => {
          if (!res.ok) {
            throw Error(res.statusText);
          } else {
            return res.json();
          }
        })
        .then((data) => {
          console.log(data);
          this.theatre = data["theatre"];
        })
        .catch((err) => {
          console.log(err);
        });
    },
  },
  created() {
    this.getTheatre(this.$route.params.id);
    if (localStorage.getItem('Authorization') != null) {
      localStorage.setItem('isLoggedIn', true);
    }
  },
};

export default theatre;
