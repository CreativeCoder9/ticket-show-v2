const admin = {
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
                <li class="nav-item"><a class="nav-link"><router-link to="/add-theatre" style="float: right"> Add Theatre </router-link></a></li>   
                <a class="nav-link"><router-link to="/add-show" style="float: right"> Add Show </router-link></a>
            </ul>
        </div>
    </div>
    </nav>

    <section id="theatres" class="mb-5 pb-5 min-vh-100" style="margin-top:150px;">
    <div id="add-show" v-if="!theatres.length">
    <div class="container mt-5 pt-5">
      <h3 class="text-center m-5 underline"> Add a Theatre or a show!</h3>
      <div class="row">
         <div class="col text-center">
            </spam><a class="btn btn-warning shadow m-1" role="button"><router-link to="/add-theatre" style="float: right"> ➕ </router-link></a>
            <h6 class="fw-bold p-2">Add a Theatre!</h6>
         </div>
         <div class="col text-center">
         <a class="btn btn-warning shadow m-1" role="button"><router-link to="/add-show" style="float: right"> ➕ </router-link></a>
            <h6 class="fw-bold p-2">Add a Show!</h6>
         </div>
      </div>
    </div>
    </div>
    <h2 class="text-center underline" v-if="theatres.length">Theatre Info</h2>
    <div v-for="theatre in theatres" :key="theatre.id" class="row mt-4 align-items-start pt-3">
      <!-- Theatre column -->
      <div class="card col-3 mx-2">
        <img :src="theatre.theatre_img" class="card-img-top shadow">
        <ul class="list-group p-2">
          <li class="list-group-item fw-bold" :style="'background-image:url(); background-size:cover;'">{{ theatre.theatre_name }}</li>
          <li class="list-group-item">Place: {{ theatre.theatre_location }}</li>
          <li class="list-group-item">Capacity: {{ theatre.theatre_capacity }}</li>
          <li class="list-group-item">
            <router-link :to="'/update-theatre/' + theatre.theatre_id" class="btn btn-warning">Edit this theatre</router-link>
          </li>
          <li class="list-group-item">
            <a class="btn btn-danger" href="#" @click.prevent="deleteTheatre(theatre.theatre_id)">Delete it!</a>
          </li>
        </ul>
      </div>
      <!-- Shows column -->
      <div class="col-8 mb-5">
        <div class="row">
          <div v-if="theatre.shows.length">
            <div class="row my-1">
              <div v-for="show in theatre.shows" :key="show.id" class="card p-1 col">
                <img :src="show.show_img" class="card-img-top shadow">
                <div class="card-body">
                  <h4 class="card-title">{{ show.show_name }}, {{show.show_rating}}⭐</h4>
                  <ul class="list-group">
                    <li class="list-group-item">  
                      <router-link :to="'/update-show/' + show.show_id">Update this show!</router-link>
                    </li>
                    <li class="list-group-item">
                      <a href="#" @click.prevent="deleteShow(show.show_id)">Delete this show!</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="alert alert-danger text-center" role="alert">
            <p>No Shows found!</p>
          </div>
          <div class="col text-center" v-if="!theatre.shows.length">
            <router-link to="/add-show" class="btn btn-warning shadow m-1" role="button">➕</router-link>
            <h6 class="fw-bold p-2">Add a Show!</h6>
          </div>
        </div>
      </div>
    </div>
  </section>
    </div>`,
  data: function () {
    return {
      isLoggedIn: JSON.parse(localStorage.getItem("isLoggedIn")),
      theatres: [],
      shows: [],
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
    deleteTheatre(id) {
      var userResponse = confirm("Do you want to proceed?");
      if (userResponse) {
        const headers = {
          Authorization:
          localStorage.getItem('Authorization'),
          "Content-Type": "application/json",
        };
        fetch("/api/theatres/" + id, { method: "DELETE", headers: headers })
          .then((res) => {
            if (!res.ok) {
              return res.json().then((errorData) => {
                throw new Error(`HTTP error! Status: ${res.status}`);
              });
            }
            return res.json();
          })
          .then((data) => {
            this.getTheatres();
            //check if response is ok
          })
          .catch((err) => {
            alert(
              "An error occured! Please check the console for more details."
            );
            console.log(err);
          });
      } else {
        alert("You have cancelled the operation!");
      }
    },
    deleteShow(id) {
      var userResponse = confirm("Do you want to proceed?");
      if (userResponse) {
        const headers = {
          Authorization:
          localStorage.getItem('Authorization'),
          "Content-Type": "application/json",
        };
        fetch("/api/shows/" + id, { method: "DELETE", headers: headers })
          .then((res) => {
            if (!res.ok) {
              return res.json().then((errorData) => {
                throw new Error(`HTTP error! Status: ${res.status}`);
              });
            }
            return res.json();
          })
          .then((data) => {
            this.getTheatres();
            alert("Show deleted successfully!");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        alert("You have cancelled the operation!");
      }
    },
    updateShow(id) {
      var userResponse = confirm("Do you want to proceed?");
      if (userResponse) {
        const headers = {
          Authorization: localStorage.getItem("Authorization"),
          "Content-Type": "application/json",
        };
        fetch("/api/shows/" + id, { method: "PUT", headers: headers })
          .then((res) => {
            if (!res.ok) {
              return res.json().then((errorData) => {
                throw new Error(`HTTP error! Status: ${res.status}`);
              });
            }
            return res.json();
          })
          .then((data) => {
            this.getTheatres();
            alert("Show updated successfully!");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        alert("You have cancelled the operation!");
      }
    },
    updateTheatre(id) {
      var userResponse = confirm("Do you want to proceed?");
      if (userResponse) {
        const headers = {
          Authorization: localStorage.getItem("Authorization"),
          "Content-Type": "application/json",
        };
        fetch("/api/theatres/" + id, { method: "PUT", headers: headers })
          .then((res) => {
            if (!res.ok) {
              return res.json().then((errorData) => {
                throw new Error(`HTTP error! Status: ${res.status}`);
              });
            }
            return res.json();
          })
          .then((data) => {
            this.getTheatres();
            alert("Theatre updated successfully!");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        alert("You have cancelled the operation!");
      }
    },
  },
  created() {
    this.getTheatres();
    if (localStorage.getItem('Authorization') != null) {
      localStorage.setItem('isLoggedIn', true);
    }
  },
};

export default admin;
