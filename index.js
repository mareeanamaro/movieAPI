// adding express and morgan modules to the project
const express = require('express'),
      morgan = require('morgan');
const app = express();

// make sure the logging happens before anything else
app.use(morgan('common'));

// default textual response for endpoint '/'
app.get('/', (req, res) => {
  res.send('Welcome to my movie API!');
});

// define top movies and return a json object with them at endpoint '/movies'

let topMovies = [
{
  title: 'Carol',
  director: 'Todd Haynes'
},
{
  title: 'Mulholland Drive',
  director: 'David Lynch'
},
{
  title: 'Popstar',
  director: 'Akiva Schaffer, Jorma Taccone'
},
{
  title: 'Moulin Rouge',
  director: 'Baz Lurhman'
},
{
  title: 'Star Wars: The Last Jedi',
  director: 'Rian Johnson'
},
{
  title: 'Rear Window',
  director: 'Alfred Hitchcock'
},
{
  title: 'Iron Man 3',
  director: 'Shane Black'
},
{
  title: 'Batman Returns',
  director: 'Tim Burton'
},
{
  title: '8 Women',
  director: 'François Ozon'
},
{
  title: 'Alien',
  director: 'Ridley Scott'
}
]

app.get('/movies', (req, res) => {
  res.json(topMovies);
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
