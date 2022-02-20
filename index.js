// adding modules to the project
const express = require('express'),
      morgan = require('morgan'),
      bodyParser = require('body-parser'),
      uuid = require('uuid'),
      mongoose = require('mongoose'),
      Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

// make sure the logging happens before anything else
app.use(morgan('common'));

// default textual response for endpoint '/'
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix!');
});


// get info on all movies
app.get('/movies', (req, res) => {
  Movies.find()
    .then((movies) => {
        res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// get info on all users
app.get('/users', (req, res) => {
  Users.find()
    .then((users) => {
        res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// get info on one movie by title
app.get('/movies/:Title', (req, res) => {
  Movies.findOne( { Title: req.params.Title })
    .then((movie) => {
      res.status(201).json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    })
});

// get info on genre
// first it finds the movie then you request the info you need from movie entry
app.get('/movies/genres/:genreName', (req,res) => {
  Movies.findOne( { "Genre.Name": req.params.genreName })
    .then((movie) => {
      res.status(201).json(movie.Genre)
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    })
});

// get info on director
app.get('/movies/directors/:directorName', (req,res) => {
  Movies.findOne( { "Director.Name": req.params.directorName })
    .then((movie) => {
      res.status(201).json(movie.Director)
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    })
});

// get films by director name
app.get('/movies/directors/:directorName/movielist/', (req,res) => {
      Movies.find( { "Director.Name": req.params.directorName })
      .then((movies) => {
        res.status(201).json(movies)
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      })
});

//add a new user to the database
app.post('/users', (req,res) => {
  Users.findOne({ Username: req.params.Username })
    .then ((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) => {res.status(201).json(user)})
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// allow users to update their info
app.put('/users/:Username', (req,res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $set:
      {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      },
    },
  { new: true},
  (err, updatedUser) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

// add movie to favorites
app.post('/users/:Username/movies/:MovieID', (req,res) => {
  Users.findOneAndUpdate ({ Username: req.params.Username
  }, {
    $push: { FavoriteMovies: req.params.MovieID}
  },
  { new: true},
  (err, updatedUser) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
  }
});
});

// delete movie from favorites
app.delete('/users/:Username/movies/:MovieID', (req,res) => {
  Users.findOneAndUpdate ({ Username: req.params.Username },
    { $pull: { FavoriteMovies: req.params.MovieID}
  },
  { new: true },
  (err, updatedUser) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});


// delete user
app.delete('/users/:Username', (req,res) => {
  Users.findOneAndRemove( { Username: req.params.Username})
    .then ((user) => {
      if(!user) {
        res.status(400).send(req.params.Username + " was not found");
      } else {
        res.status(200).send(req.params.Username + " was deleted");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.use(express.static('public'));


//error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

//listener
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
