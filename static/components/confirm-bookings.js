const confirmBooking = {
  template: 
  `<div>
  <div>
    <nav class="navbar navbar-light navbar-expand-md fixed-top navbar-shrink py-3" id="mainNav">
      <div class="container">
        <img src="../static/images/Ticket%20Show%20Logo.png" width="194" height="66">
        <button data-bs-toggle="collapse" class="navbar-toggler" data-bs-target="#navcol-1">
          <span class="visually-hidden">Toggle navigation</span><span class="navbar-toggler-icon"></span>
        </button>
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
            </li>
          </ul>
          <a v-if="isLoggedIn" class="btn btn-primary shadow" role="button">
            <router-link to="/logout" style="float: right"> Logout </router-link>
          </a>
          <a v-if="!isLoggedIn" class="btn btn-primary shadow" role="button">
            <router-link to="/login" style="float: right"> For Admin </router-link>
          </a>
        </div>
      </div>
    </nav>

    <section id="confirmBooking" class="container container-fluid min-vh-100" style="margin-top: 150px;">
      <div class="container-fluid">
        <div id="add-venue-form" class="container h-100 d-flex justify-content-center align-items-center">
          <!-- Display show_img on the left side -->
          <div class="col-md-4 p-2 card m-5">
            <img :src="show.show_img" class="img-fluid" alt="Show Image">
            <div class="card-body">
            <span class="pe-3">Available Seats: {{ availableSeats }}</span>
            </br>
            <span class="pe-3">Show Time: {{ show.show_starting_time }} to {{ show.show_ending_time }}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="jumbotron my-auto">
              <h1 class="display-4 fw-bold underline">{{ show.show_name }} Booking!</h1>
            Theatre name: {{ theatre.theatre_name }}, Location: {{ theatre.theatre_location }}
              <form @submit.prevent="confirmBooking" enctype="multipart/form-data">
                <input name="show_id" type="hidden" :value="show.show_id">
                <div class="form-group">
                  <label for="numBookings">Number of bookings</label>
                  <input v-model="numBookings" type="number" class="form-control" id="numBookings" :min="1">
                </div>
                <div class="form-group">
                  <label for="show_price">Ticket Price</label>
                  <input name="show_price" type="text" class="form-control" disabled :value="show.show_price">
                </div>
                <button id="confirm-booking-button" type="submit" class="btn btn-primary">Confirm Booking!</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  </section>
  </div>`,
  data: function() {

    return {
      isLoggedIn: JSON.parse(localStorage.getItem('isLoggedIn')),
      numBookings: 0,
      availableSeats: -1,
      show: {
        show_id: '',
        show_name: '',
        show_starting_time: '',
        show_ending_time: '',
        show_price: '',
        show_img: '',
        theatre_id: '',
      },
      theatre: {
        theatre_name: '',
        theatre_location: '',
      }
    }
  },
  methods: {
    getShowDetails: function(id) {
      const headers = {
        'Authorization': localStorage.getItem("Authorization"),
        'Content-Type': 'application/json',
      };
      fetch(`/api/shows/${id}`, {method:"GET", headers: headers })
      .then(response => {
        if (response.ok) {
          return response.json();
        }else{
          // throw new Error(response.statusText);
          this.$router.push({ path: '/dashboard' })
        }
      })
      .then(data => {
        console.log(data.show);
        this.show.show_id = data.show.show_id;
        this.show.show_name = data.show.show_name;
        this.show.show_starting_time = data.show.show_starting_time;
        this.show.show_ending_time = data.show.show_ending_time;
        this.show.show_price = data.show.show_price;
        this.show.show_img = data.show.show_img;
        this.show.theatre_id = data.show.show_theatre;
        // console.log(this.show);
        this.getAvailableSeats(this.show.theatre_id);
        this.getTheatreDetails(this.show.theatre_id);

      fetch("/api/bookings/show/"+this.show.show_id, { method: "GET", headers: headers })
      .then((res) => {
        if (!res.ok) {
          throw Error(res.statusText);
        } else {
          return res.json();
        }
      })
      .then((data) => {
        console.log(data)
        this.availableSeats = this.availableSeats - data.total_bookings;
        if (this.availableSeats == 0) {
          //wait for 5 seconds
          setTimeout(() => {
            alert("Show is Housefull");
          }, 2000);
          
        }
      })
      })
    },confirmBooking: function() {
      // use fetch to make a booking
      fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization':  localStorage.getItem("Authorization")
        },
        body: JSON.stringify({
          booking_show_id: this.show.show_id,
          num_bookings: this.numBookings,
        })
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then(json => {
        alert("Booking made successfully");
        this.$router.push('/dashboard');
      })
      .catch(err => {
        console.log(err);
        alert("Booking failed");
      })

    },
    getTheatreDetails: function(id) {
      const headers = {
        'Authorization': localStorage.getItem("Authorization"),
        'Content-Type': 'application/json',
      };
      fetch(`/api/theatres/${id}`, {method:"GET", headers: headers })
      .then(response => {
        if (response.ok) {
          return response.json();
        }else{
          throw new Error(response.statusText);
        }
      })
      .then(data => {
        console.log(data.theatre);
        this.theatre.theatre_name = data.theatre.theatre_name;
        this.theatre.theatre_location = data.theatre.theatre_location;
      })
    },
    getAvailableSeats: function(id) {
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
          this.availableSeats = Math.floor(data.theatre.theatre_capacity / data.theatre.shows.length)
        })
        .catch((err) => {
          console.log(err);
        });
    },

  },
  created() {
    this.getShowDetails(this.$route.params.id);
    if (localStorage.getItem('Authorization') != null) {
      localStorage.setItem('isLoggedIn', true);
    }
  }
  

}

export default confirmBooking