const {verify} = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    const accessToken = req.headers["accesstoken"];
    if (!accessToken) return res.json({ error: "User not logged in" });
    try{
        const validToken = verify(accessToken, "secret");
        req.user = validToken;
        if(validToken){
            return next();
        }
    }catch(err){
        return res.json({ error: err });
    }
};

module.exports = { validateToken };