require("dotenv").config();

const bodyParser = require('body-parser')
const express = require('express')
const cookieParser = require("cookie-parser");
const cors = require("cors")
const {uploadFile} = require('./helper/aws4.js')
const multer = require("multer")
const app = express()
const productModel = require("./models/productModel")
//const aws = require("aws-sdk");
const jwt = require('jsonwebtoken')
const productRoutes = require("./routes/prodRoutes.js")

const { default: mongoose } = require('mongoose')
const userRoutes = require("./routes/userRoutes")
const vendorRoutes = require("./routes/vendorRoutes");
const verifyOtp = require("./helper/otp");
const paypal = require('./helper/paypal')


// const { Upload } = require("@aws-sdk/lib-storage");
// const { S3Client, S3 } =  require("@aws-sdk/client-s3") ;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())
app.use(multer().any())


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true
})
.then( ()=> console.log("MONGODB IS CONNECTED"))
.catch( err=> console.log(err))

app.use(cookieParser());
app.use(cors())


//////////////

const createAccessToken = (user) => {
  return jwt.sign({user: user}, (process.env.ACCESS_TOKEN_SECRET || "showcase-api"), { expiresIn: "1d" });
};
const createRefreshToken = (user) => {
  return jwt.sign({user: user}, (process.env.REFRESH_TOKEN_SECRET || "showcase-api"), { expiresIn: "7d" });
};

/////////////////////////



// const s3 = new S3Client({
//   accessKeyId: process.env.S3_ACCESKEY_ID,
//   secretAccessKey: process.env.S3_SECRET_KEY,
//   region: process.env.S3_REGION,    //"ap-northeast-1",
//   //signatureVersion: "v4",
// })


console.log(process.env.DB_USER)

app.use("/user", userRoutes)

app.use("/vendor", vendorRoutes)

app.use("/product", productRoutes)



app.post("/s3upload", async(req, res)=>{
  try{
    let file = req.files[0]
    let data = await uploadFile(file)
    console.log(data)
    return res.send({status: true, link: data})

  }
  catch(err){
    return res.status(400).send({status: true, msg: err.message})
  }


})



// app.post("/s3upload", async(req, res)=>{
     
//     // let link = await uploadFile(file)
//      //console.log(file.length)
//     // return res.status(200).send({status: true, link: link})


// try {
//   let file = req.files[0]
//   let data = await uploadFile(file)
//   console.log(data)
//   return res.send({status: true, data})

//   let unique =  Date.now().toString() + Math.random().toString(36).slice(2, 7);
//   const parallelUploads3 = new Upload({
//     client: s3,
//     params: {
//      Bucket: process.env.S3_BUCKET,  
//     Key: "api/" + unique + file.originalname,
//     ACL:'public-read',
//     Body: file.buffer },

//     tags: [
//       /*...*/
//     ], // optional tags
//     queueSize: 4, // optional concurrency configuration
//     //partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
//     leavePartsOnError: false, // optional manually handle dropped parts
//   });

//   parallelUploads3.on("httpUploadProgress", (progress) => {
//     //console.log(progress);
//   });

//   await parallelUploads3.done();
//   res.send({status: true, link: parallelUploads3.singleUploadResult.Location})
// } catch (err) {
//   return res.status(400).send({status: false, err: err.message})
// }

// })

//-------------------------------------//

app.get("/refreshToken", (req, res) => {
  try {
    const rf_token = req.cookies.refreshtoken;
    if (!rf_token)
      return res.status(400).json({ msg: "Please Login or Register" });

    jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err)
        return res.status(400).json({ msg: "Please Login or Register" });

      const accesstoken = createAccessToken(user.user);
      res.cookie("token", accesstoken, {
        maxAge: 1 * 24 * 60 * 60 * 1000, // 7d
        httpOnly: false
      });

      res.json({ accesstoken });
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
}),





//-------------------------------------------------//

app.use('/paypal', paypal)



//----------------------OTP apis ---------------------//

var config = {
  apiKey: "test-b52ab03d-3b31-43f1-a13e-08459f74e896",
  //language: "en",
  redirect_url: "http://localhost:8080/test",
  source: [{ type: "phone", feature: "otp" }]
}

var ma = require("mojoauth-sdk")(config)


 app.post("/onetimepassword", async(req, res) => {



//   let email = "poradi500@gmail.com"
// let query = {}
// query.language = "en"

// ma.mojoAPI
//   .signinWithEmailOTP(email, query)
//   .then(response => {
//     console.log(response)
//   })
//   .catch(function (error) {
//     console.log(error)
//   })

let phone = "+118942810041" // pass the phone number in the international format e.g for US, +1XXXXXXXXXX
let query = {}
// query.language = "en"

ma.mojoAPI
  .signinWithPhoneOTP(phone, query)
  .then(response => {
    console.log(response)
    return res.send(response)
  })
  .catch(function (error) {
    console.log(error)
    return res.send(error)
  })

 })




//   let { country, phone } = req.body;
//   let data = await sendOtp(country, phone)
//   if(!data){
//     return res.status(400).send({status: false, msg: "something went wrong"})

//   }
//   return res.status(200).send({status: true, msg: "Otp send successfully"})

 
// });

 app.post("/otpcheck", async(req, res) => {
  let state_id = "Your StateID"
let otp = "Your OTP"

ma.mojoAPI
  .verifyPhoneOTP(otp, state_id)
  .then(response => {
    console.log(response)
    return res.send(response)
  })
  .catch(function (error) {
    console.log(error)
    return res.send(error)
  })




 })
//   try{
//     let { otp, country, phone } = req.body;
//     let data = await verifyOtp(otp, country, phone)
//     if(data.status){
//       return res.status(200).send({status: true, data: data.data})

//     }else{
//       return res.status(400).send({status: false, msg: "something went wrong"})
//     }
    

//   }
//   catch(err){
//     return res.status(400).send({status: false, msg: "something went wrong"})

//   }
  

// })


//------------------------------//



app.use("*", (req, res)=>{res.send("working api")})

//---------otp---------//

// app.post("/onetimepassword", (req, res) => {
//     let { country, phone } = req.body;
  
//     client.verify
//       .services(process.env.serviceID)
//       .verifications.create({ to: `+${country}${phone}`, channel: "sms" })
//       .then((verification) => {
  
//         res.json({ message: "OTP sent successfully" });
//       })
//       .catch((err) => {
//         console.log(err);
//         res.json({ message: "Something went wrong" });
//       });
//   });


//   app.post("/otpcheck", (req, res) => {
//     let { otp, country, phone } = req.body;
  
//     client.verify
//       .services(process.env.serviceID)
//       .verificationChecks.create({ to: `+${country}${phone}`, code: otp })
//       .then((verification_check) => {
//         res.json({
//           message: "OTP verified successfully",
//           data: verification_check.status,
//         });
//       })
//       .catch((err) => {
//         console.log(err);
//         res.json({ message: "Something went wrong" });
//       });
//   });


  //---------------------------------------//

 



module.exports = app