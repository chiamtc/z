const UserController = {
    login: (req, res, next) => {
        console.log('res', req);
        res.status(200).json({status: 'logged in'})
    }
}

export default UserController
