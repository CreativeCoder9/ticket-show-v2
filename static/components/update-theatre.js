const updateTheatre = {
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
  <div class="container-fluid mb-5 min-vh-100" style="margin-top:150px">
  <div id="add-theatre-form" class="row justify-content-center">
    <div class="col-sm-12 col-md5 card my-auto">
      <h2 class="display-5 fw-bold p-4 underline">Add a theatre!</h2>
      <form @submit.prevent="updateThisTheatre(updateTheatre.theatre_id)" enctype="application/json">
        <div class="form-group">
          <label for="theatre_name">theatre Name</label>
          <input v-model="updateTheatre.theatre_name" type="text" class="form-control" id="theatre_name">
        </div>
        <div class="form-group">
          <label for="theatreLocation">theatre Location</label>
          <input v-model="updateTheatre.theatre_location" type="text" class="form-control" id="theatre_location">
        </div>
        <div class="form-group">
          <label for="theatre_capacity">theatre capacity</label>
          <input v-model="updateTheatre.theatre_capacity" type="number" class="form-control" id="theatre_capacity" min="0">
        </div>
        <div class="form-group">
              <label for="banner"> Upload an image</label>
              <input name="banner" type="file" class= "form-control" id="banner" @change="handleImageUpload">
              <small>An image of the Theatre</small>
        </div>
        <button id="add-theatre-button" type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>
  </div>
</div>
  </div>`,
  data: function() {
    return {
      updateTheatre: {
        theatre_id: '',
        theatre_name: '',
        theatre_location: '',
        theatre_capacity: 0,
        theatre_img: ''
      },
      isLoggedIn: JSON.parse(localStorage.getItem('isLoggedIn'))
    }
  },
  methods: {
    updateThisTheatre: function(id) {
      console.log(this.updateTheatre);
      fetch (`/api/theatres/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem("Authorization")
        },
        body: JSON.stringify(this.updateTheatre)
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then(json => {
        alert("Theatre updated successfully");
        this.$router.push('/admin');
      }).catch(error => {
        alert("Theatre could not be fetched");
        console.log(error);
      })
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
          this.updateTheatre.theatre_img = data['file_url'];
          console.log(this.updateTheatre.theatre_img);
        })
        .catch(err => {
          console.log(err);
        });
      }},
    getTheatre: function(id) {
      const headers = {
        'Authorization': localStorage.getItem("Authorization"),
        'Content-Type': 'application/json',
      };
      fetch(`/api/theatres/${id}`, {method:"GET", headers: headers })
        .then(res => res.json())
        .then(data => {
          console.log(data);
          this.updateTheatre = data['theatre'];
        })
        .catch(err => {
          console.log(err);
        });
    }
  },
  created() {
    this.getTheatre(this.$route.params.id);
    if (localStorage.getItem('Authorization') != null) {
      localStorage.setItem('isLoggedIn', true);
    }
  }
}

export default updateTheatre