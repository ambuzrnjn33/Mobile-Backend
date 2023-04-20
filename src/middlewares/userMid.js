const jwt = require("jsonwebtoken");
const Users = require("../models/userModel")

const userAuth = (req, res, next) => {
  try {

    let token = req.header("Authorization")
    if (!token) return res.status(400).send({ status: false, message: "Token is required" })
    token = token.split(" ")
    //console.log(token)
    //let token = req.cookies.token

    if (token[0] != "Bearer") return res.status(400).send({ status: false, message: "Please give a bearer token" })

    jwt.verify(token[1], (process.env.ACCESS_TOKEN_SECRET || "showcase-api"), (err, user) => {
      if (err) return res.status(403).json({ msg: "Invalid Authentication" });

      req.user = user.user;
      next();
    }); 
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const userAuth2 = async (req, res, next)=>{

    try {
        let id = req.params.userId
        let valid = await Users.findById(id)
        if(!valid){
            return res.status(400).json({ msg: "Invalid Id" });
        }
    if(id==req.user){
        next()
    }else{
        return res.status(400).json({ msg: "You are not authorized user" });

    }

    }
    catch(err){
        return res.status(400).json({ msg: err.message });

    }
    

}

module.exports = {userAuth, userAuth2}