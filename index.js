// adding modules to the project
const express = require('express'),
morgan = require('morgan'),
bodyParser = require('body-parser'),
uuid = require('uuid'),
mongoose = require('mongoose'),
Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect(process.env.CONNECTION_URI || 'mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

// cors
const cors = require('cors');
app.use(cors());

// import authentication
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

//validate content
const { check, validationResult } = require ('express-validator');

// logging middleware
app.use(morgan('common'));

const {SUCCESS, CREATED, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY} = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  UNPROCESSABLE_ENTITY: 422
}

// default textual response for endpoint '/'
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix!');
});

// get info on all movies
app.get('/movies', passport.authenticate('jwt', { session: false}), (req, res) => {
  Movies.find()
  .then((movies) => {
    res.status(SUCCESS).json(movies);
  })
  .catch((err) => {
    res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
  });
});

// get info on all users
app.get('/users', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.find()
  .then((users) => {
    res.status(SUCCESS).json(users);
  })
  .catch((err) => {
    res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
  });
});

// get info on one movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false}), (req, res) => {
  Movies.findOne( { Title: req.params.Title })
  .then((movie) => {
    if (movie) {
      res.status(SUCCESS).json(movie);
    } else {
      res.status(NOT_FOUND).json('Movie not found');
    }})
    .catch((err) => {
      res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
    })
  });

  // get info on genre
  app.get('/movies/genres/:genreName', passport.authenticate('jwt', { session: false}), (req,res) => {
    Movies.findOne( { "Genre.Name": req.params.genreName })
    .then((movie) => {
      if (movie) {
      res.status(SUCCESS).json(movie.Genre)
    } else {
      res.status(NOT_FOUND).json('Genre not found');
    }})
    .catch((err) => {
      res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
    })
  });

  // get info on director
  app.get('/movies/directors/:directorName', passport.authenticate('jwt', { session: false}), (req,res) => {
    Movies.findOne( { "Director.Name": req.params.directorName })
    .then((movie) => {
      if (movie) {
      res.status(SUCCESS).json(movie.Director)
    } else {
      res.status(NOT_FOUND).json('Director not found');
    }
    })
    .catch((err) => {
      res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
    })
  });

  // get films by director name
  app.get('/movies/directors/movielist/:directorName/', passport.authenticate('jwt', { session: false}), (req,res) => {
    Movies.find( { "Director.Name": req.params.directorName })
    .then((movies) => {
      if(movies.length === 0) {
      res.status(NOT_FOUND).json('Director not found');
    } else if(movies) {
      res.status(SUCCESS).json(movies)
    }
      else {
      res.status(NOT_FOUND).json('Director not found');
    }
    })
    .catch((err) => {
      res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
    })
  });

  //add a new user to the database
  app.post('/users',
[
  check('Username', 'Username is required').isLength({ min:5 }),
  check('Username', 'Username contains non-alphanumeric characters.').isAlphanumeric(),
  check('Password', 'Password is required.').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
],
  (req,res) => {

    let errors = validationResult(req);

    if(!errors.isEmpty()) {
      return res.status(UNPROCESSABLE_ENTITY).json({ error: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.params.Username })
    .then ((user) => {
      if (user) {
        return res.status(BAD_REQUEST).send(req.body.Username + ' already exists');
      } else {
        Users
        .create({
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        })
        .then((user) => {res.status(CREATED).json(user)})
        .catch((error) => {
          res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
        })
      }
    })
    .catch((error) => {
      res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
    });
  });

  // allow users to update their info
  app.put('/users/:Username', passport.authenticate('jwt', { session: false}),
[
  check('Username', 'Username is required').isLength({ min:5 }),
  check('Username', 'Username contains non-alphanumeric characters.').isAlphanumeric(),
  check('Password', 'Password is required.').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
],
  (req,res) => {
    let errors = validationResult(req);

    if(!errors.isEmpty()) {
      return res.status(UNPROCESSABLE_ENTITY).json({ error: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);

    Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $set:
        {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        },
      },
      { new: true},
      (err, updatedUser) => {
        if(updatedUser) {
          res.status(SUCCESS).json(updatedUser);
        } else {
          res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
        }
      });
    });

    // add movie to favorites
    app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false}), (req,res) => {
      Users.findOneAndUpdate ({ Username: req.params.Username
      }, {
        $push: { FavoriteMovies: req.params.MovieID}
      },
      { new: true},
      (err, updatedUser) => {
        if(updatedUser) {
          res.status(SUCCESS).json(updatedUser);
        } else {
          res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
        }
      });
    });

    // delete movie from favorites
    app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false}), (req,res) => {
      Users.findOneAndUpdate ({ Username: req.params.Username },
        { $pull: { FavoriteMovies: req.params.MovieID}
      },
      { new: true },
      (err, updatedUser) => {
        if(updatedUser) {
          res.status(SUCCESS).json(updatedUser);
        } else {
          res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
        }
      });
    });


    // delete user
    app.delete('/users/:Username', passport.authenticate('jwt', { session: false}), (req,res) => {
      Users.findOneAndRemove( { Username: req.params.Username})
      .then ((user) => {
        if(!user) {
          res.status(BAD_REQUEST).send(req.params.Username + " was not found");
        } else {
          res.status(SUCCESS).send(req.params.Username + " was deleted");
        }
      })
      .catch((err) => {
        res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
      });
    });


    app.use(express.static('public'));

    app.get('/documentation', (req, res) =>
      { res.status(SUCCESS).sendFile(`${__dirname}/public/documentation.html`);
      });

    //error handling
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(INTERNAL_SERVER_ERROR).send('We\'ve found an error!');
    });

    //listener
    const port = process.env.PORT || 8080;
  app.listen(port, '0.0.0.0',() => {
   console.log('Listening on Port ' + port);
});
