
const jwtSecret = 'your_jwt_secret'; // from JWTStrategy

const jwt = require('jsonwebtoken'),
      passport = require('passport');

require('./passport');

/**
 * creates JWT / token 
 * @function generateJWTToken
 * @param {object} user 
 * @returns user object, jwt + token info
 */
let generateJWTToken = (user) =>
{
  return jwt.sign(user, jwtSecret, {
    subject: user.Username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}

/**
 * POST login
 * @function generateJWTToken
 * @param {*} router
 * @returns user object and token
 * @requires passport
*/
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json ( {
          message: 'Something is not right',
          user:user
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token});
      });
    }) (req,res);
  });
}
