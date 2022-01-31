// adding express and morgan modules to the project
const express = require('express'),
      morgan = require('morgan'),
      bodyParser = require('body-parser'),
      uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

// make sure the logging happens before anything else
app.use(morgan('common'));

// default textual response for endpoint '/'
app.get('/', (req, res) => {
  res.send('Welcome to my movie API!');
});

let movies = [
  {
    title: 'Carol',
    director: {
      name: 'Todd Haynes',
      bio: 'Todd Haynes is an American filmmaker from Los Angeles, California. His films span four decades with consistent themes examining the personalities of well-known musicians, dysfunctional and dystopian societies, and blurred gender roles.',
      birthYear: 1961,
      deathYear: null
    },
    description: 'Set in New York City during the early 1950s, Carol tells the story of a forbidden affair between an aspiring female photographer and an older woman going through a difficult divorce.',
    genre: {
      name: 'Drama',
      description: 'The drama genre is defined by conflict and often looks to reality rather than sensationalism. Emotions and intense situations are the focus, but where other genres might use unique or exciting moments to create a feeling, movies in the drama genre focus on common occurrences. Drama is a very broad category and untethered to any era — from movies based on Shakespeare to contemporary narratives.'
    },
    imageURL: 'https://www.vintagemovieposters.co.uk/wp-content/uploads/2015/12/IMG_0913.jpg',
    featured: true
  },

  {
    title: 'Popstar: Never Stop Never Stopping',
    director: {
      name: 'Akiva Schaffer',
      bio: 'Akiva D. Schaffer is an American film director, comedian, actor, and writer. He is a member of the comedy group The Lonely Island along with Andy Samberg and Jorma Taccone. He began his career with The Lonely Island making videos for Channel 101. In 2005, Saturday Night Live hired the trio, Schaffer joining as a writer.',
      birthYear: 1977,
      deathYear: null
    },
    description: 'When it becomes clear that his solo album is a failure, a former boy band member does everything in his power to maintain his celebrity status.',
    genre: {
      name: 'Comedy',
      description: 'The comedy genre is defined by events that are intended to make someone laugh, no matter if the story is macabre, droll, or zany. Comedy can be found in most movies, but if the majority of the film is intended to be a comedy you may safely place it in this genre. The best comedy movies range throughout this entire spectrum of humor.'
    },
    imageURL: 'https://www.filmstories.co.uk/wp-content/uploads/2021/05/popstar-never-stop.jpg',
    featured: false

  },

  {
    title: 'Moulin Rouge',
    director: {
      name: 'Baz Lurhman',
      bio: 'Baz Luhrmann is an Australian writer, director, and producer with projects spanning film, television, opera, theatre, music, and recording industries. He is regarded by many as a contemporary example of an auteur for his distinctly recognizable style and deep involvement in the writing, directing, design, and musical components of all his work. As a storyteller, he\'s known as a pioneer of pop culture, fusing high and low culture with a unique sonic and cinematic language. ',
      birthYear: 1962,
      deathYear: null
    },
    description: 'A poor Bohemian poet in 1890s Paris falls for a beautiful courtesan and nightclub star whom a jealous duke covets.',
    genre:
    { name: 'Musical',
      description: 'Musicals originated as stage plays, but they soon became a favorite for many film directors and have even made their way into television. Musicals can incorporate any other genre, but they incorporate characters who sing songs and perform dance numbers.'
  },
  imageURL: 'https://movieposters.ie/wp-content/uploads/2013/01/MQUAD_MR_.jpg',
  featured: false
}
]

let users = [
  {
    id: 1,
    name: 'Ana Maria',
    favoriteMovies: []
  },
  {
    id: 2,
    name: 'Zé Luis',
    favoriteMovies: ['Carol']
  }
]

// get info on all movies
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});

// get info on one movie by title
app.get('/movies/:title', (req, res) => {
  const movie = movies.find((movie) => {
    return movie.title === req.params.title
  })

  if (movie.title) {
    res.status(200).json(movie);
  }

  else {
    const message ='Sorry, we couldn\'t find this movie.';
    res.status(400).send(message)
  }
});

// get info on genre
app.get('/movies/genres/:genreName', (req,res) => {
  const { genreName } = req.params;
  const genre = movies.find( movie => movie.genre.name === genreName).genre;

  if(genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send('Sorry, we couldn\'t find this genre.')
  }
});

// get info on director
app.get('/movies/directors/:directorName', (req,res) => {
  const { directorName } = req.params;
  const director = movies.find( movie => movie.director.name === directorName).director;

  if(director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('Sorry, we couldn\'t find this director.')
  }
});

// get films by director name
app.get('/movies/directors/:directorName/movielist/', (req,res) => {
  const { directorName } = req.params;
  const director = movies.find( movie => movie.director.name === directorName);

  if(director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('Sorry, we couldn\'t find this director.')
  }
});

// add a new user to the database
app.post('/users', (req,res) => {
  const newUser = req.body;

  if(newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).send(newUser);
  } else {
    const message ='Missing name in request body.';
    res.status(400).send(message);
  }
});

// allow users to update their username
app.put('/users/:id', (req,res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find(user => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('Sorry, we couldn\'t find this user.')
  }
});

// add movie to favorites
app.post('/users/:id/:movieTitle', (req,res) => {
  const { id } = req.params;
  const { movieTitle } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(movieTitle + ' has been added to ' + user.name + '\'s list.');
  } else {
    res.status(400).send('Sorry, we couldn\'t find this user.')
  }
});

// delete movie from favorites
app.delete('/users/:id/:movieTitle', (req,res) => {
  const { id } = req.params;
  const { movieTitle } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
    res.status(200).send(movieTitle + ' has been removed from ' + user.name + '\'s list.');
  } else {
    res.status(400).send('Sorry, we couldn\'t find this user.')
  }
});


// delete user
app.delete('/users/:id', (req,res) => {
  const { id } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    users = users.filter(user => user.id !== id)
    res.status(200).send('User ID ' + id + ' has been deleted.');
  } else {
    res.status(400).send('Sorry, we couldn\'t find this user.')
  }
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
