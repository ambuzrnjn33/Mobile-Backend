const Users = require('../models/userModel')
const bcrypt = require('bcrypt')
//const userModel = require('../models/userModel')
const jwt = require("jsonwebtoken")
const Review = require("../models/reviewModel")
const productModel = require('../models/productModel')
const validator = require("../validations/valid")
const getLocationByAdd = require('../helper/getlocation')
const sendEmail = require("../helper/sendMail")
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/paymentModal')
const orderModel = require('../models/orderModel')
const otpModel = require('../models/otpM')
const {sendSMS, generateOtp} = require('../helper/otp2')
const vendorModel = require('../models/vendorModel')
const commentModel = require('../models/commentModel')




const instance = new Razorpay({
    key_id: process.env.Razorpay_Key_Id,
    key_secret: process.env.Razorpay_Key_Secret,
});

const userCnt = {

    createUser : async (req, res)=> {
        try {
            console.log("started...")
            let {name="", email, password, gender="", address, phone, profileImage="" } = req.body
            //let profileImage = req.files?.[0]

            if(!email || !password || !address || !phone){
                return res.status(400).send({status: false, msg: "PLEASE ENTER ALL THE FIELDS"})
            }

            let userExists = await Users.findOne({ email}, {isDeleted: true})
            if(userExists){
                if(userExists.isDeleted){
                    await Users.findOneAndDelete({ email }, {isDeleted: true})
                }else{
                    return res.status(400).send({ status: false, message: "Email already in use" });
                }
            } 

            let phoneExist = await Users.findOne({ phone })
            if(phoneExist){
                if(phoneExist.isDeleted){
                    await Users.findOneAndDelete({ phone }, {isDeleted: true})
                }else{
                    return res.status(400).send({ status: false, message: "phone already in use" });

                }

            } 


           // if (!validator.isValidOnlyCharacters(name)) return res.status(400).send({ status: false, message:"Name should contain only English letters and spaces"})

            if (!validator.isValidEmail(email)) return res.status(400).send({ status: false, message: "Invalid email address" })

            if (!validator.isValidPassword(password)) return res.status(400).send({ status: false, message: 'Password should be between 8 and 15 characters' });

            // if (!validator.isValidAddress(address)) return res.status(400).send({ status: false, message: "Invalid address format"})

            // if (!validator.isValidPhone(phone)) return res.status(400).send({ status: false,message: "Invalid phone number format"})

            //if (profileImage && !validator.isValidImageType(profileImage.mimetype)) return res.status(400).send({ status: false, message: 'Invalid image type. Only jpeg/jpg/png images can be uploaded' });

            let newPass = await bcrypt.hash(password, 10)
            const loc = await getLocationByAdd(address)
            //console.log(loc)

            const otp = await generateOtp(6)
           
            await sendSMS(phone,otp)
            
            
            let data = await Users.create({name, email, password: newPass, address, phone, latitude: loc[0], longitude: loc[1], isDeleted: true})
            
            //let data = new Users({name, email, password: newPass, gender, address, phone, profileImage, latitude: loc[0], longitude: loc[1]})
            let otpd = await new otpModel({
                userId: data._id,
                phone: phone,
                otp: otp
            })
            otpd.save()
            console.log(otpd)
           // console.log(data)
            return res.status(201).send({status: true, data: data})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }

    },
    resendOtp : async (req, res)=> {
        try{
            let {userId} = req.body
            let data = await Users.findById(userId)
            if(!data){
                return res.status(400).send({status: false, msg: "Invalid userId"})
            }
            const otp = generateOtp(6)
            let otpd = await new otpModel({
                userId: data._id,
                phone: data.phone,
                otp: otp
            })
            otpd.save()
            console.log(otpd)
            
        
            
            await sendSMS(data.phone, otp)
            return res.status(200).send({status: true, msg: `Otp sent ${data.phone}`})
            

        }
        catch(err){
            return res.send({status: false, msg: err.message})

        }
    },

    userOtpVerify : async(req, res)=>{
        try {
            let {userId, otp} = req.body
           //let {data, otp} = req.body

            let match = await otpModel.findOne({userId: userId, otp: otp})
            if(!match){
                return res.status(400).send({status: false, msg: "First create an acc"})
            }
            let data = await Users.findOneAndUpdate({_id: userId}, { isDeleted: false}, {new: true})
            //console.log(data)
            if(data){
                let accessToken = createAccessToken(data._id)
                let refreshToken = createRefreshToken(data._id)
    
                res.header("Authorization", "Bearer : " + accessToken);
                res.cookie("token", accessToken, {
                    maxAge: 1 * 24 * 60 * 60 * 1000, // 7d
                    httpOnly: false
                  });
    
                res.cookie("refreshtoken", refreshToken, {
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
                    httpOnly: false
                  });


                return res.status(201).send({status: true, data: data, token: accessToken})
            }
            return res.send({status: false, msg: "something went wrong"})



        }
        catch(err){
            return res.send({status: false, msg: err.message})

        }

    },

    loginByPhone : async(req, res)=> {
        try {
            let {phone} = req.body
            console.log(phone)
            if(!phone){
                return res.status(400).send({status: false, msg: "enter phone number"})
            }
            let user = await Users.findOne({phone:phone}, {isDeleted: false})
            console.log(user)
            const otp = generateOtp(6)
            await sendSMS(user.phone, otp)
            let otpd =  new otpModel({
                userId: user._id,
                phone: phone,
                otp: otp
            })
            await otpd.save()
            console.log(otpd)
            return res.status(200).send({status: true, userId: user._id, msg: `Otp sent ${user.phone}`})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }
    },

    loginByOtp : async(req, res)=>{
        try{
            let {userId, otp} = req.body
            
            let match = await otpModel.findOne({userId: userId, otp: otp})
            if(!match){
                return res.status(400).send({status: false, msg: "First create an acc"})
            }
            let data = await Users.findOne({_id: userId}, {isDeleted: false})

            if(data){
                let accessToken = createAccessToken(data._id)
                let refreshToken = createRefreshToken(data._id)
    
                res.header("Authorization", "Bearer : " + accessToken);
                res.cookie("token", accessToken, {
                    maxAge: 1 * 24 * 60 * 60 * 1000, // 7d
                    httpOnly: false
                  });
    
                res.cookie("refreshtoken", refreshToken, {
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
                    httpOnly: false
                  });

                  await otpModel.findOneAndDelete({userId: userId, otp: otp})


                return res.status(201).send({status: true, data: data, token: accessToken})
            }



        }
        catch(err){
            return res.send({status: false, msg: err.message})

        }
    },






    getUser : async (req, res)=> {
        try {
            let {userId} = req.params
            let userData = await Users.findById(userId,{isDeleted: false}).select("-password")
            if(!userData){
                return res.status(400).send({status: false, msg: "USER IS NOT VALID"})
            }
            return res.status(200).send({status: false, data: userData})

        }
        catch(err){
            return res.send({status: false, msg: err.message})
        }

    },

    forgotPass : async(req, res)=>{
        try {
            let {email="", phone=""} = req.body
            let qr = []
            if(email.length>0){
                qr.push({email: email})

            }else{
                qr.push({phone: phone})

            }
            let user = await Users.findOne(...qr, {isDeleted: false})
            if(!user){
                return res.status(400).send({status: false, msg: "Invalid User"})
            }
            let otp = generateOtp(6)
            let otpdata = new otpModel({
                userId: user._id,
                phone: user.phone,
                otp: otp
            })
            console.log(otpdata)
            await otpdata.save()
            return res.status(200).send({status: true, msg: `An otp is send to your mobile number ${user.phone}`, userId: user._id})


        }
        catch(err){
            return  res.status(400).send({status: false, msg: err.message})
        }

    },

    recoverPass : async(req, res)=> {
        try {
            //let {userId} = req.params
            let {userId, otp, password} = req.body
            let valid = await otpModel.findOne({userId, otp})
            if(!valid){
                return res.status(400).send({status: false, msg: "Invalid otp"})
            }
            let newPass = await bcrypt.hash(password, 10)
            let data = await Users.findOneAndUpdate({_id: userId, isDeleted: false}, {password: newPass}, {new: true})
            if(data){
                return res.status(201).send({status: true, data: data})
            }
            
        }
        catch(err){
            return  res.status(400).send({status: false, msg: err.message})
        }

    },
    changePhone : async (req, res)=> {
        try {
            let {userId} = req.params
            let {phone, country} = req.body
            let otp = await generateOtp(6)
            await sendSMS(phone, otp)
            let otpdata = await new otpModel({
                userId,
                phone,
                otp: otp
            })
            otpdata.save()
            console.log(otpdata)
            return res.status(200).send({status: true, msg: "otp is sent"})

        }
        catch(err){
            return  res.status(400).send({status: false, msg: err.message})
        }

    },
    updatePhone : async(req, res)=> {
        try
        {
            let {userId} = req.params
            let {otp} = req.body
            let valid = await otpModel.findOne({userId, otp})
            if(!valid){
                return res.status(400).send({status: false, msg: "Invalid otp"})
            }
            let data = await Users.findOneAndUpdate({_id: userId, isDeleted: false}, {phone: valid.phone},{new: true})
            if(data){
                return res.status(201).send({status: true, msg: "Phone number updated", data: data})
            }

        }
        catch(err){
            return  res.status(400).send({status: false, msg: err.message})

        }
    },


    updateUser : async (req, res)=> {
        try {
            let {userId} = req.params
            let {name, email, profileImage, gender} = req.body
            let valid = await Users.findById(userId,{isDeleted: false})
            if(!valid){
                return res.status(400).send({status: false, msg: "USER IS INVAID"})
            }

            if (name && !validator.isValidOnlyCharacters(name)) return res.status(400).send({ status: false, message:"Name should contain only English letters and spaces"})

            if (email && !validator.isValidEmail(email)) return res.status(400).send({ status: false, message: "Invalid email address" })

            // if (!validator.isValidPhone(phone)) return res.status(400).send({ status: false,message: "Invalid phone number format"})

            //if (profileImage && !validator.isValidImageType(profileImage.mimetype)) return res.status(400).send({ status: false, message: 'Invalid image type. Only jpeg/jpg/png images can be uploaded' });

            let data = await Users.findOneAndUpdate({_id: userId}, {name, email, profileImage, gender}, {new: true})
            return res.status(201).send({status: true, data: data})

        } 
        catch(err){
            return  res.status(400).send({status: false, msg: err.message})
        }

    },

    loginUser : async (req, res)=>{
        try {
            const {email, password} = req.body
            let valid = await Users.findOne({email: email,isDeleted: false})
            if(!valid){
                return res.status(400).send({status: false, msg: "EMAIL IS NOT VALID"})
            }
            let hashPass = await bcrypt.compare(password, valid.password)
            if(!hashPass){
                return res.status(400).send({status: false, msg: "PASSWORD DOES NOT MATCH"})
            }
            let accessToken = createAccessToken(valid._id)
            let refreshToken = createRefreshToken(valid._id)

            //res.header("Authorization", "Bearer : " + accessToken);
            res.cookie("token", accessToken, {
                maxAge: 1 * 24 * 60 * 60 * 1000, // 7d
                httpOnly: false
              });

            res.cookie("refreshtoken", refreshToken, {
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
                httpOnly: false
              });

            return res.status(200).send({status: true, data: valid, token: accessToken})

        }
        catch(err){
            return  res.status(400).send({status: false, msg: err.message})
        }

    },

    refreshToken: (req, res) => {
        try {
          const rf_token = req.cookies.refreshtoken;
          if (!rf_token)
            return res.status(400).json({ msg: "Please Login or Register" });
    
          jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err)
              return res.status(400).json({ msg: "Please Login or Register" });
    
            const accesstoken = createAccessToken(user.user);
    
            res.json({ accesstoken });
          });
        } catch (err) {
          return res.status(500).json({ msg: err.message });
        }
      },
    

    findUser : async(req, res)=>{
        try {
            let {userId} = req.params
            let user = await Users.findById(userId, {isDeleted: false}).select("name profileImage")
            if(!user){
                return res.status(400).send({status: false, msg: "User Does not exist"})
            }
            return res.status(200).send({status: true, data: user})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})


        }

    },

    logoutUser :  async (req, res) => {
        try {
          res.clearCookie("token");
          return res.json({ msg: "Logged out" });
        } catch (err) {
          return res.status(500).json({ msg: err.message });
        }
      },

    updatePass: async (req, res)=> {
        try {
            let {userId} = req.params
            let {oldPassword, newPassword} = req.body
            let userData = await Users.findById(userId)
            if(!userData){
                return  res.status(400).send({status: false, msg: "INVALID USER"})
            }
            let match = await bcrypt.compare(oldPassword, userData.password)
            if(!match){
                return  res.status(400).send({status: false, msg: "OLDPASSWORD IS WRONG"})
            }

            if (!validator.isValidPassword(newPassword)) return res.status(400).send({status:false, message: "Password should be between 8 and 15 characters"})

            let newPass = await bcrypt.hash(newPassword, 10)
            userData.password = newPass
            await userData.save()
            return res.status(200).send({status: true, msg: "PASSWORD UPDATED"})
        }
        catch(err){
            return  res.status(400).send({status: false, msg: err.message})
        }
    },


    updateProfileImage: async (req, res)=> {
        try {
            let {userId} = req.params
            let {profileImage} = req.body
            let userData = await Users.findById(userId)
           
            if(!userData){
                return  res.status(400).send({status: false, msg: "INVALID USER"})
            }
            userData.profileImage = profileImage
            userData.save();
        
            return res.status(200).send({status: true, msg: "Profile Updated"})
        }
        catch(err){
            return  res.status(400).send({status: false, msg: err.message})
        }
    },


//-----------------------Cart api's-------------------------//


    addToCart : async (req, res)=>{
        try {
            let {userId} = req.params
            let {productId} = req.query
            let valid = await productModel.findById(productId)
            if(!valid){
                return  res.status(400).send({status: false, msg: "Invalid Product Id"})
            }
            let data = await Users.findByIdAndUpdate(userId, {$addToSet : {cart : productId}})
            if(data){
                return res.status(200).send({status: true, msg: "Product added to cart success"})
            }

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }
    },

    removeFromCart : async (req, res)=>{
        try {
            let {userId} = req.params
            let {productId} = req.query
            let valid = await productModel.findById(productId)
            if(!valid){
                return  res.status(400).send({status: false, msg: "Invalid Product Id"})
            }
            let data = await Users.findByIdAndUpdate(userId, {$pull : {cart : productId}})
            if(data){
                return res.status(200).send({status: true, msg: "Product Removed from cart success"})
            }

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }
    },

    getCart : async (req, res)=>{
        try {
            let {userId} = req.params

            let data = await Users.findById(userId).populate('cart').select("cart")
            if(data){
                return res.status(200).send({status: true, data: data})
            }
        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }
    },

//------------------------Location apis -----------------------//

    updateLocation : async (req, res)=> {
        try {
            let {userId} = req.params
            let {address} = req.body

            let loc = await getLocationByAdd(address)
            if(loc==null){
                return res.status(400).send({status: false, msg: "You entered a invalid address"})
            }

            let data = await Users.findOneAndUpdate({_id: userId },
                 {address, latitude: loc[0], longitude: loc[1]},
                 {new: true})

            if(data){
                return res.status(200).send({status: true, msg: "USER LOCATION UPDATED SUCCESSFULY", data: data})
            }

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }
    },


    getLocation : async (req, res)=>{
        try {
            let {userId} = req.params
            let data = await Users.findById(userId).select("address latitude longitude")
            if(!data){
                return res.status(400).send({status: false, msg: "Invalid User Id"})

            }
            return res.status(200).send({status: true, data: data})
        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }

    },

    // otpVerify : async(req, res)=>{
    //     try {
    //         let {userId} = req.params
    //         let user = await Users.findById(userId).select("phone")
    //         let data = await sendOtp("india", phone)
    //         if(data){
    //             return res.status(200).send({status: true, msg: "otp send successfull"})
    //         }


    //     }
    //     catch(err){
    //         return res.status(400).send({status: false, msg: err.message})

    //     }

    // },

    deleteUser: async (req, res) => {
        try {
            let { userId } = req.params
            let user = await Users.findById(userId);

            if (!user) return res.status(404).send({status:false,message: "User not found"})

            await user.deleteOne();
            return res.status(200).send({status:true,msg: "User deleted successfully"})

        } catch (err) {
            return res.status(500).send({status: false,msg: err.message})
        }
    },

    //-----------Review apis----------------------//


    addProductReview: async (req, res) => {
        try {
            let productId = req.query.productId;
            let id = req.params.userId
             let { star, review } = req.body;
            //  let acc = await orderModel.findOne({userId: id, productId: productId})
            //  if(!acc){
            //     return res.status(400).send({status: false, msg: "You can add review after purchasing"})
            //  }

            let newReview = await Review({
                productId,
                userId: id,
                 star,
                review,
                accepted: true
            });

            await newReview.save();
            

           // let allrev= await Review.find({productId: productId},{accepted: true})
            let avgStar = await productModel.findById(productId).select("rating totalReviews")
            console.log(avgStar)
            let tot = avgStar.rating * avgStar.totalReviews
            console.log(tot)
            let ravg = Math.floor((tot + Number(star)) / (avgStar.totalReviews+1))
            console.log(ravg)
            avgStar.rating = ravg
            avgStar.totalReviews += 1
            let prod = await avgStar.save();
            // let newavg = ((allrev.length-1 * avgStar.rating) + star) / allrev.length
            // console.log(newavg)
            // let xd = await productModel.findByIdAndUpdate(productId, {rating: newavg}, {new:true})
            // console.log(xd)
            
            return res.status(201).send({ status: true, review: newReview, product: prod });
        } catch (err) {
            return res.status(400).send({ status: false, msg: err.message });
        }
      },

      addComments: async (req, res) => { 
        try {
            let productId = req.query.productId;
            let id = req.params.userId
             let { comment } = req.body;
             let data = await commentModel.create({userId: id, comment: comment, productId})
             return res.status(201).send({ status: true, data: data});
        }
        catch(err){
            return res.status(400).send({ status: false, msg: err.message });

        }
        
      },
      getComments : async (req, res) => {
        try{
            let productId = req.params.productId;
           // let id = req.params.userId
            let data = await commentModel.find({productId})

            if(data){
            return res.status(201).send({ status: true, data: data});
            }


        }
        catch(err){
            return res.status(400).send({ status: false, msg: err.message });

        }

      },

      getProductReviews: async (req, res) => {
        let productId  = req.params.productId;

        try {
            let reviews = await Review.find(
                { productId, accepted: true },
                { __v: 0, accepted: 0, createdAt: 0, updatedAt: 0 }
            )
            .populate('userId','name profileImage')
            .lean();

             return res.status(200).send({ status: true, reviews});

        } catch (err) {
          return res.status(400).send({ status: false, msg: err.message });
        }
      },

      getProductsByVendor : async(req, res)=>{
        try {
            //let {userId} = req.params
            let {vendorId} = req.query

            let data = await productModel.find({vendorId})
            if(data){
                return res.status(200).send({status: true, data: data})
            }
            return res.status(400).send({status: false, msg: "Unable to fetch products By VendorId"})

        }
        catch(err){
            return res.status(400).send({ status: false, msg: err.message });

        }
      },

      deleteProductRev : async(req, res)=>{
        try {
            let {userId} = req.params
            let {reviewId} = req.body
            let data = await Review.findById(reviewId)
            //console.log(data)
            if(!data){
                return res.status(400).send({status: false, msg: "invalid review"})
            }
            if(data.userId!=userId){
                return res.status(400).send({status: false, msg: "You are not owner of this review"})

            }
            let avgStar = await productModel.findById(data.productId).select("rating totalReviews")
            
            let tot = avgStar.rating * avgStar.totalReviews
            
            let ravg = Math.floor((tot - Number(data.star)) / (avgStar.totalReviews-1))
            
            avgStar.rating = ravg
            avgStar.totalReviews += 1
            let prod = await avgStar.save();
            await Review.findByIdAndDelete(reviewId)


            return res.status(200).send({status: false, data: data, product: prod, msg: "Review deleted"})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }

      },


      //------------------------Payment apis--------------------------------//



      order: async (req, res) => {
        try {

            const options = {
                amount: Number(req.body.pay),
                currency: "INR"
            };

            const order = await instance.orders.create(options);
            res.send({
                status: 200,
                message: 'Success',
                order: order
            })


        } catch(err) {
            return res.status(400).send({status: false, msg: err.message})

        }
    },


    verifyPayment: async (req, res) => {

        try {
            //console.log(req.body)
            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body.response || {}
            const { email, userId, plan, productId } = req.body || {}
            //let details = {email: "poradi500@gmail.com"}
          
            let body = razorpay_order_id + "|" + razorpay_payment_id;

            const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');

            
            if (expectedSignature === razorpay_signature) {
                //console.log("verifing")
                await sendEmail(req.body).then((err, res)=>console.log(err + res))

                const order = new Payment({
                    plan,
                    orderId: razorpay_order_id,
                    orderEmail: email,
                    paymentId: razorpay_payment_id,
                    user: userId,
                })

                const result = await order.save()

                if (result) {

                    sendEmail(req.body)
                    let owner = await productModel.findById(productId).select("vendorId")
                    

                    let buy = await orderModel.create({productId: productId, payment: result._id, vendorId: owner.vendorId, userId: userId})

                    res.status(200).send({
                        success: true,
                        razorpay_order_id,
                        razorpay_payment_id,
                        result
                    })

                } else {
                    res.status(400).send({
                        status: false,
                        message: 'something went wrong'
                    })
                }
            } else {
                res.send({
                    status: false
                })
            }

        } catch (err) {
            return res.status(400).send({status: false, msg: err.message})

        }
    },

    getPurchasedlist : async(req, res)=>{
        try {
            let {userId} = req.params
            let data = await orderModel.find({userId: userId}).populate("payment")
            if(data){
                return res.status(400).send({status: true, data: data})
            }

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }

    },

      getPaymentKey : async (req, res)=>{
        try {
            return res.status(200).send({status: true, key : process.env.Razorpay_Key_Id})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }
      }

      //////////////////////////////////////////////////////

}
const createAccessToken = (user) => {
    return jwt.sign({user: user}, (process.env.ACCESS_TOKEN_SECRET || "showcase-api"), { expiresIn: "1d" });
  };
  const createRefreshToken = (user) => {
    return jwt.sign({user: user}, (process.env.REFRESH_TOKEN_SECRET || "showcase-api"), { expiresIn: "7d" });
  };

module.exports = userCnt