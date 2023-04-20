
const express = require('express')
const router = express.Router()
const vendorCnt = require("../controllers/vendorCnt")
const MW = require("../middlewares/vendorMid")
const prodCnt = require("../controllers/productCnt")
const productCnt = require('../controllers/productCnt')
const userCnt = require("../controllers/userCnt")



router.get("/:productId/get-single-product", productCnt.findProduct)

router.get("/get-reviews/:productId", userCnt.getProductReviews)

router.post('/get-products', productCnt.getFilterProduct)

router.get("/:vendorId/otherproducts",  prodCnt.getOtherProducts)

router.get("/:productId/getproduct", productCnt.findProduct)

router.get("/findvendor/:vendorId",  vendorCnt.getVendor)

router.post('/add-new-plan', productCnt.createPlan)

router.get('/:planId/get-plan', productCnt.getPlanById) 

router.get('/get-all-plan', productCnt.getAllPlan)

router.get("/get-showcase-rating", productCnt.getOverallRating)

router.get("/get-showcase-reviews", productCnt.getCustomerFeedback)

router.get("/get-comments/:productId",userCnt.getComments)



//router.get('/get-latest-products', productCnt.getFilterProduct)

// router.route('/search/:key', productCnt.getFilterProduct)

// router.get('/min-max-price',  productCnt.getFilterProduct)

module.exports = router