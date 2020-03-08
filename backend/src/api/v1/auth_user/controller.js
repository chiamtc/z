const UserController = {
    login: (req, res, next) => {;
        res.status(200).json({status: 'logged in'})
    }
}

export default UserController
