const express = require('express')
const router = express.Router()

var paypal = require('paypal-rest-sdk');


paypal.configure({
  'mode': 'sandbox', //sandbox or live 
  'client_id': '',
  'client_secret': ''
});





router.post('/buy' , async( req , res ) => {
    let amount = req.body.amount
    let {productId} = req.params

    let prod = await productModel.findById(productId)
    if(!prod){
        return res.status(400).send({status: false, msg: "Invalid productid"})
    }

    var payment = {
            "intent": "authorize",
	"payer": {
		"payment_method": "paypal"
	},
	"redirect_urls": {
		"return_url": "http://127.0.0.1:3000/success",
		"cancel_url": "http://127.0.0.1:3000/err"
	},
	"transactions": [{
		"amount": {
			"total": prod.price,
			"currency": "USD"
		},
		"description": " a book on mern stack "
	}]
    }
    createPay( payment ) 
        .then( ( transaction ) => {
            var id = transaction.id; 
            var links = transaction.links;
            var counter = links.length; 
            while( counter -- ) {
                if ( links[counter].method == 'REDIRECT') {
                    return res.redirect( links[counter].href )
                }
            }
        })
        .catch( ( err ) => { 
            console.log( err ); 
            res.redirect('/err');
        });
}); 


router.get('/success' , (req ,res ) => {
    console.log(req.query); 
    return res.status(200).send("Success full"); 
})

router.get('/err' , (req , res) => {
    console.log(req.query); 
    return res.status(200).send("Failed payment")
})



var createPay = ( payment ) => {
    return new Promise( ( resolve , reject ) => {
        paypal.payment.create( payment , function( err , payment ) {
         if ( err ) {
             reject(err); 
         }
        else {
            resolve(payment); 
        }
        }); 
    });
}



// app.get('/success', (req, res) => {
//     const payerId = req.query.PayerID;
//     const paymentId = req.query.paymentId;
  
//     const execute_payment_json = {
//       "payer_id": payerId,
//       "transactions": [{
//           "amount": {
//               "currency": "USD",
//               "total": "25.00"
//           }
//       }]
//     };
  
//     paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
//       if (error) {
//           console.log(error.response);
//           throw error;
//       } else {
//           console.log(JSON.stringify(payment));
//           res.send('Success');
//       }
//   });
//   });




module.exports = router