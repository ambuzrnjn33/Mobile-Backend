const axios = require("axios");

const sendSMS = async (phone, otp) => {
  try {
    //console.log(phone)
    // if(!phone){
    //   throw new error("please enter phone number")
    // }
    let cnt = phone.substring(0,3);
    let phn = phone.substring(3)
    //console.log(phone)
    //code = code || "+91"
    const sms = await axios.get(
      `https://api.authkey.io/request?authkey=${process.env.AUTH_KEY}&mobile=${phn}&country_code=${cnt}&sid=6737&name=UPONE&otp=${otp}`
    );
    //console.log(sms);
    console.log("Success");
  } catch (error) {
    console.log(error);
  }
};

const generateOtp = (otp_length) => {
  var OTP = "";
  var digits = "0123456789";
  for (let i = 0; i < otp_length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

module.exports = { sendSMS, generateOtp };
