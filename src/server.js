const app = require("./index.js")


app.listen(process.env.PORT || 3000, ()=> {
    console.log("Server started On PORT " + (process.env.PORT || 3000))
})
