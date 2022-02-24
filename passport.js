const passport = require('passport'),
      LocalStrategy = require('passport-local').Strategy,
      Models = require('./models.js'),
      passportJWT = require('passport-jwt');


let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;


// local strategy = http authentication to log the user in
passport.use(new LocalStrategy({
  usernameField: 'Username',
  passwordField: 'Password'
}, (username, password, callback) => {
  console.log(username + '  ' + password);
  Users.findOne({Username: username}, (error, user) => {
    if(error) {
      return callback(error);
    }

    if(!user) {
      return callback(null, false, {message: 'Incorrect username'});
    }

    if(!user.validatePassword(password)) {
      return callback(null, false, { message: 'Incorrect password.'})
    }

    return callback(null, user);
  });
}));


// jwt strategy

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret'
}, (jwtPayload,callback) => {
  return Users.findById(jwtPayload._id)
    .then((user) => {
      return callback(null,user);
    })
    .catch((error) => {
      return callback(error)
    });
}));
