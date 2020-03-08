import LocalStrategy from 'passport-local';

const initializePassport = (passport) => {
    passport.use('login', new LocalStrategy(
        (username, password, done) => {
            try {
                console.log(username, password)
                return done(null, {id: 'user1'})
            } catch (e) {
                return done(e)
            }
        }
    ))
}
export default initializePassport;
