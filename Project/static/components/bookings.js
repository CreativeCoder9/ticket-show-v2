const bookings = {
    template: 
    `<div class="min-vh-100">
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
    <div class="container my-3">
    <div class="col" style="margin-top:150px;">
      <h1 class="text-center underline">Your Bookings!</h1>
    </div>
  </div>
  <div v-if="bookings.length > 0" class="row">
    <div v-for="booking in bookings" :key="booking.booking_id" class="col-6 g-0 card">
        <ul class="list-group d-flex align-items-center card-body">
        <div class="card-footer">{{booking.booked_at}}</div> 
          <li class="list-group-item">
            <span class="fw-bold pl-5">{{ booking.show_name }}, </span>
            <span>{{ booking.theatre_location }} </span>
            <button class="btn m-5 shadow" disabled>{{ booking.num_bookings }} Tickets</button>
          </li>
        </ul>
    </div>
  </div>
  <div v-else class="alert alert-danger text-center" role="alert">
    No bookings found!
  </div>
    </div>`,
    data: function() {

      return {
        isLoggedIn: JSON.parse(localStorage.getItem('isLoggedIn')),
        bookings: []
      }
    },
    methods: {
        getBookings() {
            const headers = {
              Authorization: localStorage.getItem('Authorization'),
              "Content-Type": "application/json",
            };
            fetch("/api/bookings", { method: "GET", headers: headers })
              .then((res) => res.json())
              .then((data) => {
                this.bookings = data["bookings"];
              })
              .catch((err) => {
                console.log(err);
              });
          }
    },
    created: function() {
        this.getBookings();
        if (localStorage.getItem('Authorization') != null) {
          localStorage.setItem('isLoggedIn', true);
        }
    }


}
  
  export default bookings