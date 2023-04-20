const express = require('express')
const productCnt = require('../controllers/productCnt')
const router = express.Router()
const userCnt = require("../controllers/userCnt")
const MW = require("../middlewares/userMid")


//--------------User Routes-------------//

router.post("/createuser", userCnt.createUser)

router.get("/getuser/:userId", MW.userAuth, MW.userAuth2, userCnt.getUser)

router.get("/finduser/:userId", MW.userAuth, userCnt.findUser)

router.post("/login", userCnt.loginUser)

router.post("/logout", userCnt.logoutUser)

router.post("/verifyuser", userCnt.userOtpVerify)

router.post("/resend-otp", userCnt.resendOtp)

router.post("/loginby-phone", userCnt.loginByPhone)

router.post("/login-otp", userCnt.loginByOtp)

router.put("/updateuser/:userId", MW.userAuth, MW.userAuth2, userCnt.updateUser)

router.patch("/updateimage/:userId", MW.userAuth, MW.userAuth2, userCnt.updateProfileImage)

router.patch("/updateuserpass/:userId", MW.userAuth, MW.userAuth2, userCnt.updatePass)

router.patch("/updatelocation/:userId", MW.userAuth, MW.userAuth2, userCnt.updateLocation)

router.delete("/deleteuser/:userId",MW.userAuth, MW.userAuth2, userCnt.deleteUser)

router.get("/userlocation/:userId", MW.userAuth, userCnt.getLocation)

router.post("/:userId/add-review", MW.userAuth, MW.userAuth2, userCnt.addProductReview)

router.delete("/:userId/delete-review", MW.userAuth, MW.userAuth2, userCnt.deleteProductRev)

router.post("/:userId/add-comments", MW.userAuth, MW.userAuth2, userCnt.addComments)

router.get("/get-comments/:productId",userCnt.getComments)

router.post("/:userId/change-phone", MW.userAuth, MW.userAuth2, userCnt.changePhone)

router.post("/:userId/update-phone", MW.userAuth, MW.userAuth2, userCnt.updatePhone)

router.post("/forgot-pass", userCnt.forgotPass)

router.post("/recover-pass", userCnt.recoverPass)

router.get("/get-prod-vendor",  userCnt.getProductsByVendor)

router.get("/get-showcase-rating", productCnt.getOverallRating)

router.get("/get-reviews/:productId",userCnt.getProductReviews)

router.get("/:userId/addtocart", MW.userAuth, MW.userAuth2, userCnt.addToCart)

router.get("/:userId/removefromcart", MW.userAuth, MW.userAuth2, userCnt.removeFromCart)

router.get("/:userId/getcart", MW.userAuth, MW.userAuth2, userCnt.getCart)

//router.post("/:userId/getproducts", MW.userAuth, productCnt.getFilterProduct)

router.post("/getproducts", productCnt.getFilterProduct)

router.get("/:productId/getproduct", productCnt.findProduct)

router.get("/:vendorId/vendor-products", productCnt.getOtherProducts)

router.get("/getapi-key", userCnt.getPaymentKey)

router.post("/create-order", MW.userAuth, userCnt.order)

router.post("/verify-payment", userCnt.verifyPayment)

router.get("/:userId/purchased-list", MW.userAuth, MW.userAuth2, userCnt.getPurchasedlist)


router.post('/:userId/add-feedback',MW.userAuth, MW.userAuth2, productCnt.addFeedBack)

router.get('/get-all-rating', productCnt.getOverallRating)








module.exports = router