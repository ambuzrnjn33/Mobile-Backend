const vendorModel = require("../models/vendorModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("../validations/valid");
const getLocationByAdd = require("../helper/getlocation");
const { sendSMS, generateOtp } = require("../helper/otp2");
const otpModel = require("../models/otpM");
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require("../helper/sendMail")
const Payment = require('../models/paymentModal')
const planModel = require('../models/planModel');
const purchaseModel = require("../models/purchaseModel");
const moment = require('moment')
//------------vendor controllers------------//


const instance = new Razorpay({
  key_id: process.env.Razorpay_Key_Id,
  key_secret: process.env.Razorpay_Key_Secret,
});


const createAccessToken = (user) => {
  return jwt.sign(
    { user: user },
    process.env.ACCESS_TOKEN_SECRET || "showcase-api",
    { expiresIn: "1d" }
  );
};
const createRefreshToken = (user) => {
  return jwt.sign(
    { user: user },
    process.env.ACCESS_TOKEN_SECRET || "showcase-api",
    { expiresIn: "7d" }
  );
};

const vendorCnt = {
  createVendor: async (req, res) => {
    try {
      //let body = req.body
      let {
        name="",
        email,
        password,
        address = "",
        description = "",
        phone,
       // profileImage = "",
       // storeName=""
      } = req.body;
      //let profileImage = req.files?.[0]

      // let vendorExists = await vendorModel.findOne({ email })
      // if(vendorExists) return res.status(400).send({ status: false, message: "Email already in use" });

      let userExists = await vendorModel.findOne({ email });
      if (userExists) {
        if (userExists.isDeleted == true) {
          await vendorModel.findOneAndDelete({ email }, { isDeleted: true });
        } else {
          return res
            .status(400)
            .send({ status: false, message: "Email already in use" });
        }
      }

      let phoneExist = await vendorModel.findOne({ phone });
      if (phoneExist) {
        if (phoneExist.isDeleted) {
          await vendorModel.findOneAndDelete({ phone }, { isDeleted: true });
        } else {
          return res
            .status(400)
            .send({ status: false, message: "phone already in use" });
        }
      }

      if (name && !validator.isValidOnlyCharacters(name))
        return res.status(400).send({
          status: false,
          message: "Name should contain only English letters and spaces",
        });

      if (email && !validator.isValidEmail(email))
        return res
          .status(400)
          .send({ status: false, message: "Invalid email address" });

      if (password && !validator.isValidPassword(password))
        return res.status(400).send({
          status: false,
          message: "Password should be between 8 and 15 characters",
        });

      // if (!validator.isValidAddress(address)) return res.status(400).send({ status: false, message: "Invalid address format"})

      // if (!validator.isValidPhone(phone)) return res.status(400).send({ status: false,message: "Invalid phone number format"})

      //if (profileImage && !validator.isValidImageType(profileImage.mimetype)) return res.status(400).send({ status: false, message: 'Invalid image type. Only jpeg/jpg/png images can be uploaded' });

      let newPass = await bcrypt.hash(password, 10);
      const loc = await getLocationByAdd(address) || [1, -1]

      let vendorData = await vendorModel.create({
        name,
        email,
        password: newPass,
        address,
        description,
        phone,
        latitude: loc[0],
        longitude: loc[1],
        
        isDeleted: true,
      });
      //console.log(vendorData)

      if (vendorData) {
        const otp = await generateOtp(6);

        await sendSMS(vendorData.phone, otp);
        let otpd = await new otpModel({
          userId: vendorData._id,
          phone: phone,
          otp: otp,
        });
        otpd.save();
        console.log(otpd);

        return res.status(201).send({ status: true, data: vendorData });
      }
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  resendOtp: async (req, res) => {
    try {
      let { vendorId } = req.body;
      let data = await vendorModel.findById(vendorId);
      //console.log(data)

      if (!data) {
        return res.status(400).send({ status: false, msg: "Invalid userId" });
      }

      const otp = generateOtp(6);
      let otpd = new otpModel({
        userId: vendorId,
        phone: data.phone,
        otp: otp,
      });
      await otpd.save();

      await sendSMS(data.phone, otp);
      return res
        .status(200)
        .send({ status: true, msg: `Otp sent ${data.phone}` });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  loginVendor: async (req, res) => {
    try {
      //let {vendorId} = req.params
      let { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .send({ status: false, msg: "Please enter email and password" });
      }
      let vendor = await vendorModel.findOne({ email: email });
      if (!vendor) {
        return res
          .status(400)
          .send({ status: true, msg: "Invalid Vendor details" });
      }
      let match = await bcrypt.compare(password, vendor.password);
      if (!match) {
        return res
          .status(400)
          .send({ status: false, msg: "Email and Password does't match" });
      }
      let accessToken = createAccessToken(vendor._id);
      let refreshToken = createRefreshToken(vendor._id);
      res.header("Authorization", "Bearer : " + accessToken);
      res.cookie("token", accessToken, {
        maxAge: 1 * 24 * 60 * 60 * 1000, // 7d
        httpOnly: false,
      });

      res.cookie("refreshtoken", refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
        httpOnly: false,
      });
      if(vendor.plan!="basic"){
        let check_plan = await paymentModel.find({user: vendor._id})
        let date2 = Date.now()
        let date1 = moment(check_plan.createdAt).format("YYYY-MM-DD")

        let days = date2.diff(date1, 'days') 
        console.log(days)
        if(days > check_plan.duration){
          vendor.plan = "basic"
          vendor.save();

        }
        
        

      }

      

      return res
        .status(200)
        .send({ status: true, data: vendor, token: accessToken });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  loginByPhone: async (req, res) => {
    try {
      let { phone } = req.body;
      if (!phone) {
        return res
          .status(400)
          .send({ status: false, msg: "enter phone number" });
      }
      let user = await vendorModel.findOne({ phone }, { isDeleted: false });
      const otp = generateOtp(6);
      await sendSMS(user.phone, otp);
      let otpd = new otpModel({
        userId: user._id,
        phone: phone,
        otp: otp,
      });
      await otpd.save();
      console.log(otpd);
      return res.status(200).send({
        status: true,
        data: user,
        msg: `Otp sent ${user.phone}`,
      });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  loginByOtp: async (req, res) => {
    try {
      let { vendorId, otp } = req.body;

      let match = await otpModel.findOne({ userId: vendorId, otp: otp });
      if (!match) {
        return res
          .status(400)
          .send({ status: false, msg: "First create an acc" });
      }
      let data = await vendorModel.findOne(
        { _id: vendorId },
        { isDeleted: false }
      );

      if (data) {
        let accessToken = createAccessToken(data._id);
        let refreshToken = createRefreshToken(data._id);

        res.header("Authorization", "Bearer : " + accessToken);
        res.cookie("token", accessToken, {
          maxAge: 1 * 24 * 60 * 60 * 1000, // 7d
          httpOnly: false,
        });

        res.cookie("refreshtoken", refreshToken, {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
          httpOnly: false,
        });

        if(data.plan!="basic"){
          let check_plan = await paymentModel.find({user: data._id})
          let date2 = Date.now()
          let date1 = moment(check_plan.createdAt).format("YYYY-MM-DD")
  
          let days = date2.diff(date1, 'days') 
          console.log(days)
          if(days > check_plan.duration){
            data.plan = "basic"
            data.save();
  
          }
          
          
  
        }

        await otpModel.findOneAndDelete({ userId: vendorId, otp: otp });

        return res
          .status(201)
          .send({ status: true, data: data, token: accessToken });
      }
    } catch (err) {
      return res.send({ status: false, msg: err.message });
    }
  },

  userOtpVerify: async (req, res) => {
    try {
      console.log(req.body);
      let { vendorId, otp } = req.body;
      let match = await otpModel.findOne({ userId: vendorId, otp: otp });
      if (!match) {
        return res
          .status(400)
          .send({ status: false, msg: "First create an acc" });
      }
      let data = await vendorModel.findOneAndUpdate(
        { _id: vendorId },
        { isDeleted: false },
        { new: true }
      );
      if (data) {
        let accessToken = createAccessToken(data._id);
        let refreshToken = createRefreshToken(data._id);

        res.header("Authorization", "Bearer : " + accessToken);
        res.cookie("token", accessToken, {
          maxAge: 1 * 24 * 60 * 60 * 1000, // 7d
          httpOnly: false,
        });

        res.cookie("refreshtoken", refreshToken, {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
          httpOnly: false,
        });

        await otpModel.findOneAndDelete({ userId: vendorId, otp: otp });

        return res
          .status(201)
          .send({ status: true, data: data, token: accessToken });
      }
    } catch (err) {
      return res.send({ status: false, msg: err.message });
    }
  },

  forgotPass: async (req, res) => {
    try {
      let { email = "", phone = "" } = req.body;
      let qr = [];
      if (email.length > 0) {
        qr.push({ email: email });
      } else {
        qr.push({ phone: phone });
      }
      let user = await vendorModel.findOne(...qr, { isDeleted: false });
      if (!user) {
        return res.status(400).send({ status: false, msg: "Invalid User" });
      }
      let otp = generateOtp(6);
      await sendSMS(user.phone, otp);
      let otpdata = new otpModel({
        userId: user._id,
        phone: user.phone,
        otp: otp,
      });
      console.log(otpdata);
      await otpdata.save();
      return res.status(200).send({
        status: true,
        msg: `An otp is send to your mobile number ${user.phone}`,
        vendorId: user._id,
      });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  recoverPass: async (req, res) => {
    try {
      //let {userId} = req.params
      let { vendorId, otp, password } = req.body;
      let valid = await otpModel.findOne({ userId: vendorId, otp });
      if (!valid) {
        return res.status(400).send({ status: false, msg: "Invalid otp" });
      }
      let newPass = await bcrypt.hash(password, 10);
      let data = await vendorModel.findOneAndUpdate(
        { _id: vendorId, isDeleted: false },
        { password: newPass },
        { new: true }
      );
      if (data) {
        await otpModel.findOneAndDelete({ userId: vendorId, otp });
        return res
          .status(201)
          .send({ status: true, data: data, msg: "password updated" });
      }
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  logoutUser: async (req, res) => {
    try {
      res.clearCookie("token");
      return res.json({ msg: "Logged out" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  changePhone: async (req, res) => {
    try {
      let { vendorId } = req.params;
      let { phone, country } = req.body;
      let otp = await generateOtp(6);
      await sendSMS(phone, otp);
      let otpdata = await new otpModel({
        userId: vendorId,
        phone,
        otp: otp,
      });
      otpdata.save();
      console.log(otpdata);
      return res.status(200).send({ status: true, msg: "otp is sent" });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  updatePhone: async (req, res) => {
    try {
      let { vendorId } = req.params;
      let { otp } = req.body;
      let valid = await otpModel.findOne({ userId: vendorId, otp });
      if (!valid) {
        return res.status(400).send({ status: false, msg: "Invalid otp" });
      }
      let data = await vendorModel.findOneAndUpdate(
        { _id: vendorId, isDeleted: false },
        { phone: valid.phone },
        { new: true }
      );
      if (data) {
        await otpModel.findOneAndDelete({ userId: vendorId, otp });
        return res
          .status(201)
          .send({ status: true, msg: "Phone number updated", data: data });
      }
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  insertPurchaseProd : async(req, res)=> {
    try{
      let {vendorId} = req.params
      let {name, phone, price, productId, email} = req.body

      let data = await purchaseModel.create({name, phone, price, productId, email, vendorId})
      return res.status(201).send({ status: true, data: data });

    }
    catch(err){
      return res.status(400).send({ status: false, msg: err.message });

    }

  },


  getVendor: async (req, res) => {
    try {
      let { vendorId } = req.params;

      let data = await vendorModel
        .findById(vendorId, { isDeleted: false })
        .select("-password")
        .populate("savedProducts");
      return res.status(200).send({ status: true, data: data });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  getTotalSells: async (req, res) => {
    try {
      let { vendorId } = req.params;

      let data = await orderModel.findOne({
        vendorId: vendorId,
        isDeleted: false,
      }); //.populate("savedProducts")
      return res
        .status(200)
        .send({ status: true, data: data, total: data.length });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  updateVendor: async (req, res) => {
    try {
      let { vendorId } = req.params;
      const { name, address, gender, description, storeName } = req.body;

      if (name && !validator.isValidOnlyCharacters(name))
        return res.status(400).send({
          status: false,
          message: "Name should contain only English letters and spaces",
        });

      let data = await vendorModel.findOneAndUpdate(
        { _id: vendorId, isDeleted: false },
        { name, address, gender, description, storeName },
        { new: true }
      );
      if (data) {
        return res.status.send({ statu: true, data: data });
      }
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  findVendor: async (req, res) => {
    try {
      let { userId } = req.params;
      let user = await vendorModel
        .findById(userId, { isDeleted: false })
        .select("name, profileImage, storeName");
      if (!user) {
        return res
          .status(400)
          .send({ status: false, msg: "User Does not exist" });
      }
      return res.status(200).send({ status: true, data: user });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  changePassVendor: async (req, res) => {
    try {
      let { vendorId } = req.params;
      let { oldPassword, newPassword } = req.body;
      let userData = await vendorModel.findById(vendorId, { isDeleted: false });
      if (!userData) {
        return res.status(400).send({ status: false, msg: "INVALID USER" });
      }
      let match = await bcrypt.compare(oldPassword, userData.password);
      if (!match) {
        return res
          .status(400)
          .send({ status: false, msg: "OLDPASSWORD IS WRONG" });
      }

      if (!validator.isValidPassword(newPassword))
        return res.status(400).send({
          status: false,
          message: "Password should be between 8 and 15 characters",
        });

      let newPass = await bcrypt.hash(newPassword, 10);
      userData.password = newPass;

      await userData.save();
      return res.status(200).send({ status: true, msg: "PASSWORD UPDATED" });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  deletVendor: async (req, res) => {
    try {
      let { vendorId } = req.params;
      let vendor = await vendorModel.findById(vendorId, { isDeleted: false });

      if (!vendor)
        return res
          .status(404)
          .send({ status: false, message: "Vendor not found" });

      await vendor.deleteOne();
      return res
        .status(200)
        .send({ status: true, msg: "Vendor deleted successfully" });
    } catch (err) {
      return res.status(500).send({ status: false, msg: err.message });
    }
  },

  updateAddVendor: async (req, res) => {
    try {
      let { vendorId } = req.params;
      let { address } = req.body;

      // let {address, latitude, longitude} = req.body
      let loc = await getLocationByAdd(address);
      if (loc == null) {
        return res
          .status(400)
          .send({ status: false, msg: "You entered a invalid address" });
      }

      let data = await vendorModel.findOneAndUpdate(
        { _id: vendorId, isDeleted: false },
        { address, latitude: loc[0], longitude: loc[1] },
        { new: true }
      );

      if (!data) {
        return res
          .status(400)
          .send({ status: false, msg: "Inavlid Vendor Id" });
      }

      return res.status(200).send({ status: true, data: data });
    } catch (err) {
      return res.status(500).send({ status: false, msg: err.message });
    }
  },

  getSavedProducts: async (req, res) => {
    try {
      let { vendorId } = req.params;

      let data = await vendorModel.findById(vendorId).populate("savedProducts").select("savedProducts");

      return res.status(200).send({ status: true, data: data });
    } catch (err) {
      return res.status(400).send({ status: false, msg: err.message });
    }
  },

  getAddress: async (req, res) => {
    try {
      let { vendorId } = req.params;
      let vendor = vendorModel.findById(vendorId);

      if (!vendor)
        return res.status(404).send({ status: false, msg: "Vendor not found" });

      let address = await vendor.select("address");
      return res.status(200).send({ status: true, data: address });
    } catch (err) {
      return res.status(500).send({ status: false, msg: err.message });
    }
  },

  
  updateProfileImage: async (req, res)=> {
    try {
        let {vendorId} = req.params
        let {profileImage} = req.body
        let userData = await vendorModel.findById(vendorId)
       
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

  addPurchase : async (req, res) => {

    try {
      let {name, email, phone, date, productId=""} = req.body
      let {vendorId} = req.params
      let data = await purchaseModel.create({name, email, phone, date, vendorId, productId})
      return res.status(200).send({ status: true, data: data });

    }
   catch(err){
    return res.status(400).send({status: false, msg: err.message})
  }

},

getPurchaseById : async (req, res)=> {
  
  try {
   
    let {vendorId} = req.params
    let data = await purchaseModel.find({vendorId})
    return res.status(200).send({ status: true, data: data });

  }
 catch(err){
  return res.status(400).send({status: false, msg: err.message})
}


},

  


  
  order: async (req, res) => {
    try {
        let planId = req.body.planId
        let plan = await planModel.findById(planId)
        if(!plan){
          return res.status(400).send({status: false, msg: "Enter valid plan id"})
        }
        let price = plan.price

        console.log(planId)

 
        const options = {
            amount: Number(price),
            currency: "INR",
            notes: [plan.title, plan.duration]
        };

        const order = await instance.orders.create(options);
        console.log(order)
        res.send({
            status: true,
            message: 'Success',
            order: order
        })


    } catch(err) {
        return res.status(400).send({status: false, msg: err.message})

    }
},



verifyPayment: async (req, res) => {

  try {
    console.log("verifing")
      //console.log(req.body)
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body.response || {}
      const { email, vendorId, plan, name, duration } = req.body || {}
      //console.log(req.body)
      //let details = {email: "poradi500@gmail.com"}
    
      let body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(body.toString())
          .digest('hex');
 
      
      if (expectedSignature === razorpay_signature) {
          console.log("verifing")
          // await sendEmail(req.body, (err, res)=>{
          //   console.log(err)
          // })

          const order = new Payment({
              plan,
              name,
              orderId: razorpay_order_id,
              email: email,
              transactionId: razorpay_payment_id,
              user: vendorId,
              duration
          })

          const result = await order.save()

          if (result) {
            //console.log(res)

              sendEmail(req.body)
              //let owner = await productModel.findById(productId).select("vendorId")

              let vendorplan = await vendorModel.findByIdAndUpdate(vendorId, {plan})


              
              res.status(200).send({
                  success: true,
                  razorpay_order_id,
                  razorpay_payment_id,
                  result,
                  msg: `${plan}  activated `
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

getPaymentKey : async (req, res)=>{
  try {
      return res.status(200).send({status: true, key : process.env.Razorpay_Key_Id})

  }
  catch(err){
      return res.status(400).send({status: false, msg: err.message})
  }
}







};



module.exports = vendorCnt;
