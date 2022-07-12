// adding modules to the project
const express = require('express'),
morgan = require('morgan'),
bodyParser = require('body-parser'),
uuid = require('uuid'),
mongoose = require('mongoose'),
Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

// cors
const cors = require('cors');

//uncomment below to set the cors policy
// app.use(cors());
// 
// let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234', 'flicking-through-flicks.netlify.app'];
// 
// app.use(cors({
//   origin: (origin, callback) => {
//     if(!origin) return callback(null, true);
//     if(allowedOrigins.indexOf(origin) === -1) {
//       let message = 'The CORS policy for this application doesn\'t allow access from origin' + origin;
//       return callback(new Error(message), false);
//     }
//     return callback (null, true);
//   }
// }));

// DELETE this when uncommenting CORS POLICY
app.use(cors({
  origin: '*'
}));

// import authentication
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

//validate content
const { check, validationResult } = require ('express-validator');
const { has } = require('lodash');

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

/**
 * GET info on all movies
 * request body: bearer token
 * @requires passport 
 * @returns array of movie objects
 */
app.get('/movies', passport.authenticate('jwt', { session: false}), (req, res) => {
  Movies.find()
  .then((movies) => {
    res.status(SUCCESS).json(movies);
  })
  .catch((err) => {
    res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
  });
});

/**
 * GET info on all users
 * request body: bearer token
 * @requires passport
 * @returns an array of user objects
 */
app.get('/users', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.find()
  .then((users) => {
    res.status(SUCCESS).json(users);
  })
  .catch((err) => {
    res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
  });
});

/**
 * GET info on one user by username
 * request body: bearer token
 * @param {string} Username
 * @requires passport
 * @returns user object
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.findOne( { Username: req.params.Username })
  .then((user) => {
  if(user) {
    res.status(SUCCESS).json(user);
    } else {
     res.status(NOT_FOUND).json('User not found');
     }
  })
  .catch((err) => {
    res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);
  });
});

/**
 * GET favourite movies for one user by username
 * request body: bearer token
 * @param {string} Username
 * @requires passport
 * @returns an array of movie IDs
 */
app.get('/users/:Username/movies', passport.authenticate('jwt', { session: false}), (req, res) => {
	Users.findOne( { Username: req.params.Username})
	.then((user) => {
	if(user) {
    res.status(SUCCESS).json(user.FavoriteMovies);
    } else {
     res.status(NOT_FOUND).json('Could not find favorite movies for this user');
     }
  })
  .catch((err) => {
    res.status(INTERNAL_SERVER_ERROR).send('Error: ' + err);})
})	


/**
 * GET information on one particular movie by title
 * request body: bearer token
 * @param {string} Title (of movie)
 * @requires passport
 * @returns movie object
 */
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

  /**
 * GET information on one particular genre by name
 * request body: bearer token
 * @param {string} Name (of genre)
 * @requires passport
 * @returns genre object
 */
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

  /**
 * GET information on one particular director by name
 * request body: bearer token
 * @param {string} Name (of director)
 * @requires passport
 * @returns director object
 */
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

  /**
 * GET information on the movies of one particular director by name
 * request body: bearer token
 * @param {string} Name (of director)
 * @requires passport
 * @returns an array of movie objects
 */
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

  /**
   * POST a new user to the database
   * request body: Username, Password, Email, Birthday
   * Username, Password and Email are required
   * @returns user object
   */
  app.post('/users',
  // validation logic
[
  check('Username', 'Username is required').isLength({ min:5 }),
  check('Username', 'Username contains non-alphanumeric characters.').isAlphanumeric(),
  check('Password', 'Password is required.').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
],
  (req,res) => {

    let errors = validationResult(req);
    // check body for errors
    if(!errors.isEmpty()) {
      return res.status(UNPROCESSABLE_ENTITY).json({ error: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password); // hashing the password 

    // creates and returns the new user
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

  /**
   * PUT updated user info into the database
   * 
   */
  app.put('/users/:Username', passport.authenticate('jwt', { session: false}),
[
  check('Username', 'Username is required').isLength({ min:5 }),
  check('Username', 'Username contains non-alphanumeric characters.').isAlphanumeric(),
  //check('Email', 'Email does not appear to be valid').isEmail()
],
  (req,res) => {
    let errors = validationResult(req);

    if(!errors.isEmpty()) {
      return res.status(UNPROCESSABLE_ENTITY).json({ error: errors.array() });
    }
	
	let hashedPassword;

	if (req.body.hasOwnProperty('Password')) {
    hashedPassword = Users.hashPassword(req.body.Password);
  }

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
    app.patch('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false}), async (req,res) => {	     
      const movie = await Movies.findOne({_id: req.params.MovieID });
      Users.findOneAndUpdate ({ Username: req.params.Username
      }, {
        $push: { FavoriteMovies: movie}
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
