const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

const emailOptions = {
    auth: {
        api_key: process.env.EMAIL_SENDER_API_KEY
    }
}

const emailClient = nodemailer.createTransport(sgTransport(emailOptions));

// send nodemailer 
const sendEmail = async(details) => {
    
    // const { email, treatmentName, patientName, slot, date } = query
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = details.response || {}
    const { email, userId, plan, name, amount } = details || {}
    const emailSend = {
        from: process.env.EMAIL_SENDER,
        to: email,
        subject: `You have purchased ${plan} plan`,
        text: 'Your plan is confirmed ',
        html: `
        <div>
            <h3>Hello ${name}</h3>,
            <p>We are pleased to inform you that you have successfully purchased the ${plan} plan</p>
            <p>Your amount:${amount}</p>
            <p>Your transactionId:${razorpay_payment_id}</p>
            <h4>Our Address</h4>
            <p>India</p>
            <p>Hyderbad</p>
            <p>Best Regards</p>
            <p>Showcase Official</p>
        </div>
        `
    };

    let res = await emailClient.sendMail(emailSend, function (err, info) {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Email sent: ', info);
        }
    });
    return res;
}



module.exports = sendEmail