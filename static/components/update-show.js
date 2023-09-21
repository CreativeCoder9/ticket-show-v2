const updateShow = {
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
              </ul>
          <a class="btn btn-primary shadow" role="button"><router-link to="/logout" style="float: right"> Logout </router-link></a>
      </div>
  </div>
  </nav>

<div class="container-fluid min-vh-100" style="margin-top:150px">
  <div id="add-theatre-form" class="container pb-5 mb-5 row justify-content-center">
    <div class="my-auto card col-5">
      <h1 class="fw-bold p-4 display-5">Add a Show!</h1>
      <form @submit.prevent="updateShow(updatedShow.show_id)" enctype="application/json">
        <div class="form-group">
          <label for="showName">Show Name</label>
          <input v-model="updatedShow.show_name" type="text" class="form-control" id="show_name">
        </div>
        <div class="form-group">
          <label for="showPrice">Show Price</label>
          <input v-model="updatedShow.show_price" type="number" class="form-control" id="show_price" :min="0">
        </div>
        <div class="form-group">
          <label for="showRating">Initial show rating</label>
          <input v-model="updatedShow.show_rating" type="number" class="form-control" id="show_rating" :min="0" :max="5">
        </div>
        <div class="form-group">
          <label for="showStartingTime">Show starting time</label>
          <input v-model="updatedShow.show_starting_time" type="time" class="form-control" id="show_starting_time">
        </div>
        <div class="form-group">
          <label for="showEndingTime">Show ending time</label>
          <input v-model="updatedShow.show_ending_time" type="time" class="form-control" id="show_ending_time">
        </div>
        <div class="form-group">
            <input name="poster" type="file" class= "form-control" id="banner" @change="handleImageUpload">
            <small>Upload a portait poster of the show</small>
        </div>
        <div class="form-group m-2">
          <label for="theatre">Theatre</label>
          <select v-model="updatedShow.show_theatre" id="show_theatre" class="dropdown px-4 py-2">
            <option v-for="theatre in theatres" :key="theatre.theatre_id" :value="theatre.theatre_id">
              {{ theatre.theatre_name }}, {{ theatre.theatre_location }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="showTags">Tags for the show</label>
          <input v-model="updatedShow.show_tags" type="text" class="form-control" id="show_tags">
          <small>Write the tags separated with a comma</small>
        </div>
        <button id="add-theatre-button" type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>
  </div>
</div>

  </div>`,
  data: function() {

    return {
      isLoggedIn: JSON.parse(localStorage.getItem('isLoggedIn')),
      theatres: {},
      updatedShow: {
          show_name: '',
          show_price: '',
          show_rating: '',
          show_starting_time: '',
          show_ending_time: '',
          show_theatre: '',
          show_tags: '',
          show_img: '',
      },
    }
  },
  methods: {
      updateShow(id) {  
          // console.log(this.updatedShow);
          const headers = {
              'Authorization': localStorage.getItem("Authorization"),
              'Content-Type': 'application/json',
          };
          fetch(`/api/shows/${id}`, {
              method: 'PUT',
              headers: headers,
              body: JSON.stringify(this.updatedShow),
          })
          .then(jsonResponse => {
              //checking if the response was successful

              if (!jsonResponse.ok) {
                  alert("Error adding show!");
                  throw new Error(`HTTP error! Status: ${jsonResponse.status}`);
              }
              if ( window.history.replaceState ) {
                window.history.replaceState( null, null, window.location.href );
              }

              alert("Show updated successfully!");
              this.$router.push('/admin');
          })
          .catch(err => {
              console.log("Error adding show");
              console.log(err);
          });
      },
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
        getShow(id) {
          const headers = {
            'Authorization': localStorage.getItem("Authorization"),
            'Content-Type': 'application/json',
          };
          fetch('/api/shows/' + id, {method:"GET", headers: headers })
            .then(res => res.json())
            .then(data => {
              this.updatedShow = data['show'];
              console.log(this.updatedShow);
            })
            .catch(err => {
              console.log(err);
            });
        },
        handleImageUpload(event) {
          const file = event.target.files[0];
          console.log(file);
          if (file) {
            const formData = new FormData();
            formData.append('file', file);
            const headers = {
              'Authorization': localStorage.getItem("Authorization"),
            }

            fetch('/api/uploads/geturl', {method:"POST", headers: headers, body: formData })
            .then(res => res.json())
            .then(data => {
              this.updatedShow.show_img = data['file_url'];
              console.log(this.updatedShow.show_img);
            })
            .catch(err => {
              console.log(err);
            });
          }}

      },
      created() {
          this.getTheatres();
          this.getShow(this.$route.params.id);
          if (localStorage.getItem('Authorization') != null) {
            localStorage.setItem('isLoggedIn', true);
          }
      }   
}

export default updateShow