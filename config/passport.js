const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://blog-backend-production-c203.up.railway.app/api/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => {
  
  const email = profile.emails[0].value;
  const username = profile.displayName.replace(/\s+/g, '').toLowerCase(); // Ajuste do nome de usuário
  const profilePicture = profile.photos[0]?.value || null;

  User.findByEmail(email, (err, user) => {
    if (err) {
      console.error('Error finding user by email:', err);
      return done(err);
    }

    if (user) {
      return done(null, user);
    } else {
      console.log('User not found, creating a new one');
      // Usuário não encontrado, criar um novo
      User.create({
        email,
        username,
        password: 'dummyhashedpassword', // Placeholder, já que a senha não é relevante para login com Google
        profilePicture,
      }, (err, newUser) => {
        if (err) {
          console.error('Error creating new user:', err);
          return done(err);
        }
        return done(null, newUser);
      });
    }
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id); // Serializa apenas o ID do usuário
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    if (err) {
      console.error('Error deserializing user:', err);
    }
    done(err, user); // Recupera o usuário do banco de dados
  });
});

module.exports = passport;
