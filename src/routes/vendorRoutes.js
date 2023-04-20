const express = require('express')
const router = express.Router()
const vendorCnt = require("../controllers/vendorCnt")
const MW = require("../middlewares/vendorMid")
const prodCnt = require("../controllers/productCnt")

router.post("/createvendor", vendorCnt.createVendor)

router.post("/verifyuser", vendorCnt.userOtpVerify)

router.post("/resend-otp", vendorCnt.resendOtp)

router.post("/login", vendorCnt.loginVendor)

router.post("/loginby-phone", vendorCnt.loginByPhone)

router.post("/login-otp", vendorCnt.loginByOtp)

router.post("/logout", vendorCnt.logoutUser)

router.get("/getvendor/:vendorId", MW.vendorAuth, MW.vendorAuth2, vendorCnt.getVendor)

router.get("/findvendor/:vendorId", MW.vendorAuth, vendorCnt.getVendor)

router.patch("/changepass/:vendorId", MW.vendorAuth, vendorCnt.findVendor)

router.post("/:vendorId/change-phone",MW.vendorAuth, MW.vendorAuth2, vendorCnt.changePhone)

router.post("/:vendorId/update-phone", MW.vendorAuth, MW.vendorAuth2, vendorCnt.updatePhone)

router.post("/forgot-pass", vendorCnt.forgotPass)

router.post("/recover-pass", vendorCnt.recoverPass)

router.put("/updatevendor/:vendorId", MW.vendorAuth, MW.vendorAuth2, vendorCnt.updateVendor)

router.delete("/deletevendor/:vendorId", MW.vendorAuth,MW.vendorAuth2,vendorCnt.deletVendor)

router.get("/getallprod/:vendorId", MW.vendorAuth, vendorCnt.getSavedProducts)

router.get("/getaddress/:vendorId", MW.vendorAuth, vendorCnt.getAddress)

router.patch("/updatelocation/:vendorId", MW.vendorAuth, MW.vendorAuth2, vendorCnt.updateAddVendor)


//-----------------store Routes--------//


router.post("/:vendorId/store", MW.vendorAuth, MW.vendorAuth2, prodCnt.createStore)

router.get("/:vendorId/getStore", MW.vendorAuth, prodCnt.getStore)

router.get("/:vendorId/getallStore", MW.vendorAuth,MW.vendorAuth2,  prodCnt.getStoreByVendor)


//---------------product routes--------------//


router.post("/:vendorId/createproduct",  MW.vendorAuth,MW.vendorAuth2, prodCnt.createProduct)

router.put("/:vendorId/updateproduct",  MW.vendorAuth,MW.vendorAuth2, prodCnt.updateProduct)
//---name, description, video, price, discount, category, subCategory, tags---{productId} = req.query//

router.patch("/:vendorId/prod-location",  MW.vendorAuth,MW.vendorAuth2, prodCnt.updateProdLoc)

router.get("/:vendorId/getproduct",  MW.vendorAuth, prodCnt.getProduct)

router.get("/:vendorId/findproduct",  MW.vendorAuth, prodCnt.findProduct)



//------------------------------------//

router.post("/verify-payment", vendorCnt.verifyPayment)

router.get("/getapi-key", vendorCnt.getPaymentKey)

router.post("/create-plan", MW.vendorAuth, vendorCnt.order)

router.post("/:vendorId/add-purchase", MW.vendorAuth, MW.vendorAuth2, vendorCnt.addPurchase)

router.patch("/updateimage/:vendorId", MW.vendorAuth, MW.vendorAuth2, vendorCnt.updateProfileImage)

router.get("/:vendorId/get-purchase", MW.vendorAuth, MW.vendorAuth2, vendorCnt.getPurchaseById)



module.exports = router 