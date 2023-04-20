

//const client = require("twilio")(process.env.acountSID, process.env.authToken);



const sendOtp = async(country, phone)=> {
    

    await client.verify
    .services(process.env.serviceID)
    .verifications.create({ to: `+${country}${phone}`, channel: "sms" })
    .then((verification) => {

      return true;
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
}

const verifyOtp = async(country, phone, otp)=> {

    await client.verify
    .services(process.env.serviceID)
    .verificationChecks.create({ to: `+${country}${phone}`, code: otp })
    .then((verification_check) => {
      return {
        status: true,
        message: "OTP verified successfully",
        data: verification_check.status,
      };
    })
    .catch((err) => {
      console.log(err);
      return { status: false ,message: "Something went wrong" };
    });


}
//module.exports = sendOtp
//module.exports = verifyOtp