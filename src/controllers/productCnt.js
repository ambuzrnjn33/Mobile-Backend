
const productModel = require("../models/productModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const vendorModel = require("../models/vendorModel")
const storeModel = require("../models/storeModel")
//productModel.createIndex( { location: "2dsphere" } )
const axios = require('axios')
const feedBackModel = require('../models/feedback')
const feedback = require("../models/feedback")
const getLocationByAdd = require("../helper/getlocation")
const planModel = require("../models/planModel")
const moment = require("moment")

const productCnt = {

    createPlan: async(req, res)=> {
        try {


             const {title, subTitle, price, description, duration} = req.body
             await planModel.findOneAndDelete({title})

            let data = await planModel.create({title, subTitle, price, description, duration})
            return res.status(201).send({status: true, data: data})
        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }
    },

    getAllPlan : async (req, res)=> {
        try {
            let data = await planModel.find().limit(3)
            return res.status(201).send({status: true, data: data})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }

    },

    getPlanById : async(req, res)=> {
        try {

            let data = await planModel.findById(req.params.planId)
            return res.status(201).send({status: true, data: data})
        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }

    },

    createProduct : async (req, res)=>{
        try {
            let {vendorId} = req.params
            let valid = await vendorModel.findById(vendorId)
            if(!valid){
                return res.status(400).send({status: false, msg: "Invalid Vendor Id"})
            }
            var body = req.body
            const {name, description="", price, address="", discount="", video, category="", subCategory="", tags=[]} = req.body
            body.vendorId = vendorId
            var location;

            if (body.address) {
                // const params = {
                //   access_key: "4c91de2d5e397a5c46236ac630adc668",
                //   query: req.body.address,
                // };

                // const resp = await axios.get(
                //   "http://api.positionstack.com/v1/forward",
                //   {
                //     params,
                //   }
                // );

                // if (!resp.data.data[0]) {
                //   return res.status(400).send({
                //     message: "Please add a valid address",
                //   });
                // }
                let loc = await getLocationByAdd(address)
                console.log(loc)

                // lat = 33  //resp.data.data[0].latitude;
                // lang = -30  //resp.data.data[0].longitude;
                 location =  {
                    type: "Point",
                    coordinates: loc
                  }
                 // body.location = location


                }







            let data = await productModel.create({
                name,
                description,
                price,
                address,
                discount,
                video,
                category,
                subCategory,
                tags,
                location,
                vendorId
            })

            if(data){
                await vendorModel.findOneAndUpdate({_id : vendorId}, {$addToSet : {savedProducts : data._id}})

                return res.status(201).send({status: true, data: data})
            }
        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }
    },

    updateProduct : async (req, res)=>{
        try{
            let {vendorId} = req.params
            let {productId} = req.query
            let {name, description, video, price, discount, category, subCategory, tags} = req.body
            let valid = await productModel.findById(productId)
            if(valid.vendorId!=vendorId) return res.status(400).send({status: false, msg: "you are not owner of this product"})
            let data = await productModel.findByIdAndUpdate(productId,
                {name, description, video, price, discount, category, subCategory, $addToSet: {tags: tags}}, {new: true})
            if(!data){
                return res.status(400).send({status: false, msg: "Unable to perform update product"})
            }
            return res.status(200).send({status: false, data: data})

             }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }
    },

    removeProduct : async(req,res)=> {
        try {
            let {vendorId} = req.params
            let {productId} = req.query

            let data = await productModel.findOneAndDelete({_id: productId, vendorId})
            if(data?._id){

                await vendorModel.findOneAndUpdate({_id : vendorId}, {$pull : {savedProducts : productId}})
                return res.status(200).send({status: true, msg:"Deleted success"})
            }

            return res.status(400).send({status: false, msg: "Unable to remove product"})

        }
        catch(err){

        }

    },


    getProduct : async(req, res)=>{
        try {
            let {vendorId} = req.params
            if(!vendorId) return res.status(400).send({status: false, msg: "Vendor is Not available"})
            let productId = req.query.productId
            let data = await productModel.findById(productId, {vendorId})
            if(!data){
                return res.status(400).send({status: false, msg: "Product is Not available"})
            }

                return res.status(201).send({status: true, data: data})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }
    },

    getOtherProducts : async (req, res)=>{
        try {
            const { vendorId } = req.params
            const findVendor = await vendorModel.findById(vendorId)

            if (!findVendor) return res.status(400).send({ status: false, msg: "Vendor not found"})
            const products = await productModel.find({vendorId: findVendor._id}).populate([
                //{path :"storeId", select :'storeName description'},
                {path :"vendorId", select : 'name profileImage phone'}
            ])

            return res.status(200).send({ status: true, data: products})

        } catch (err) {
            return res.status(400).send({status: false, msg: err.message})
        }
    },

    updateProdLoc : async(req, res)=>{
        try {
            let {vendorId} = req.params
            let {address} = req.body
            let {productId} = req.query

            let loc = await getLocationByAdd(address)
            if(loc==null){
                return res.status(400).send({status: false, msg: "You entered a invalid address"})
            }
            let location =  {
                type: "Point",
                coordinates: [loc[0], loc[1]]
              }

            let data = await productModel.findOneAndUpdate({_id: productId , vendorId},
                 {location},
                 {new: true})

            if(data){
                return res.status(200).send({status: true, msg: "Product LOCATION UPDATED SUCCESSFULY", data: data})
            }

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
        }
    },


    findProduct : async (req, res)=>{
        try {
            let productId = req.params.productId
            let data = await productModel.findById(productId).populate([
                //{path :"storeId", select : 'storeName description price discount'},
                {path :"vendorId", select : 'name profileImage phone storeName'}
            ])

            if(!data){
                return res.status(400).send({status: false, msg: "Product is Not available"})
            }

                return res.status(201).send({status: true, data: data})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }


    },

    getFilterProduct : async (req, res)=>{
        try {
            //let queryStr = req.query
            const {cat="", subCat="", tags="" ,sortBy=-1, sort="x", distance=10, minP=0, maxP=0, page=0, size=8, lat=33, lang=-33} = req.query
            let {inputSearch} = req.body
            let query = {}
            if(inputSearch){
                query.$or = [
                    { category: new RegExp(inputSearch, "i") },
                    { subCategory: new RegExp(inputSearch, "i") },
                    { tags:  new RegExp(inputSearch, "i") },
                    { name:  new RegExp(inputSearch, "i") }
                  ]
            }
            let qr2 = []

            if(cat.length>0){
                qr2.push({ category : cat})
                console.log(cat)
            }
            if(subCat.length>0){
                qr2.push({subCategory: subCat})
            }
            if (tags.length>0){
                qr2.push({tags: tags})
            }
            if(minP>0 ){
                qr2.push({price: {"$gte": +minP}})

            }

            if(maxP>0 ) {
                qr2.push({price: {"$lte": +maxP}})
            }
            let sorting = []
            switch(sort){
                case "s":
                    sorting.push({ $sort: { sells: -1 } })
                    break;
                case "l":
                    sorting.push({ $sort: { createdAt: 1 }})
                    break;
                case "r":
                    sorting.push({ $sort: { rating: -1 } })
                    break;
                default:
                    sorting.push({ $sort: { price: +sortBy }})
                    break;

            }


            let result = await productModel.aggregate([
              {  $geoNear: {
                    includeLocs: "location",
                    distanceField: "distance",
                    near: {type: 'Point', coordinates: [+lat, +lang]},
                    maxDistance: +distance * 1000,
                    spherical: true
                  }
                },

                {$match :
                {
                     $and : [
                         ...qr2,
                         {...query},
                         //{price: {"$gte": 5000, "$lte": 10000}}

                      ]

                 } },

                // { $lookup: { from: 'Vendor', localField: '_id', foreignField: 'vendorId', as: 'user' } },

                     //{ category : "fashion"}
                       //  {subCategory: +subCat},

                // { $facet: {
                //     min: [{ $sort: { price:  1 } }, { $limit: 1 }],
                //     max: [{ $sort: { price: -1 } }, { $limit: 1 }]
                //   }},

                //   { $project: { min: { $first: "$min.price" }, max: { $first: "$max.price" } } },


                //{ $sort: { price: +sortBy } },
                //{ $sort: { createdAt: -1 }},
                ...sorting,
                //{ $skip: +size * +page },
                //{ $limit: +size },

                // {
                //     "$lookup": {
                //       "from": "Store",
                //       "localField": "storeId",
                //       "foreignField": "_id",
                //       "as": "vendor"
                //     }
                //   },

                 // { $lookup: { from: 'Vendors', localField: '_id', foreignField: 'vendorId', as: 'user' } },
                 // { $lookup: { from: 'Store', localField: 'storeId', foreignField: '_id', as: 'store' } }
                //  { $addFields: {
                //     minPrice: { $min: "$price" },
                //   },
                // }



            ])


            if(result.length>0){

                //let data = await result.populate("storeId")
                // let data = await result.populate([
                //     {path: "storeId", select: "description storeName address"},
                //     {path: "vendorId", select: "name profileImage phone"}
                // ])
                const populateQuery = [
                    {
                        path: 'vendorId',
                        select: '_id name phone storeName',
                    },

                ];
                let data = await productModel.populate(result, populateQuery);



                let len = result.length
                let f = result[0].price
                let n = result[len-1].price

                return res.status(200).send({status: true, data: data, minMax: [f, n] })
            }
            return res.status(200).send({status: true, data: result})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }
    },

    searchByDistance : async (req, res)=> {
        try {
            let {lat, lang} = req.query
            let range = 1000 * 1000 * 5

            let data = await productModel.find({
                loc: {
                  $near: {
                    $geometry: {
                      type: "Point",
                      coordinates: [77.216721, 28.644800]
                    },
                    $minDistance: 0,
                    $maxDistance: 1000000
                  }
                }
              })
              ///////////////////////


            //     {
            //         loc: {
            //             $near: {
            //               $geometry: {
            //                 type: "Point",
            //                 coordinates: [33, -23]
            //               },
            //               $minDistance: 0,
            //               $maxDistance: 1000000
            //             }
            //           }

            //    },





              //////////////


        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }


    },


    getMinMaxPrice : async (req, res)=> {



    },

//----------------------------------------------------------//

    createStore : async(req, res)=>{
        try {

            let {vendorId} = req.params
            let {storeName, address, description} = req.body

            let data = await storeModel.create({storeName, address, description, vendorId: vendorId})

            if(!data){
                return res.status(400).send({status: false, msg: "Unable to insert into databse"})
            }
            return res.status(201).send({status: true, data: data})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }
    },

    getStore : async(req, res)=>{
        try {
            let {vendorId} = req.params
            let {storeId} = req.query
            let data = await storeModel.findById(storeId)
            if(data){
                return res.status(201).send({status: true, data: data})
            }
            return res.status(400).send({status: false, msg: "Invalid StoreId"})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
       }
    },

    getStoreByVendor : async (req, res)=> {
        try {
            let {vendorId} = req.params
            let data = await storeModel.find({vendorId : vendorId})
            if(data){
                return res.status(201).send({status: true, data: data})
            }
            return res.status(400).send({status: false, msg: "Invalid vendoId"})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})
       }

    },

    addFeedBack : async(req, res)=> {
        try {
            let {userId} = req.params
            //console.log(userId)
            let {comment,type, rating} = req.body
            let us = await feedBackModel.findOneAndDelete({userId, type})

            let data = await feedBackModel.create({userId, comment, rating, type})
            //console.log(data)
            return res.status(201).send({status: true, data: data})

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }
    },
    getCustomerFeedback : async(req, res)=> {
        try {
            let reviews = await feedBackModel.find().sort({createdAt: -1})
            if(reviews){
                return res.status(200).send({status: true, data: reviews})
            }

        }
        catch(err){
            return res.status(400).send({status: false, msg: err.message})

        }
    },

    getOverallRating : async(req, res)=> {
        let types = {}
        let service = await feedBackModel.find({type : "service"})
        if(service){
            let totalRating = service.reduce((a, b)=> a + b.rating, 0)
            let sRating = totalRating / service.length
            types.service = sRating

        }
        let video = await feedBackModel.find({type : "video"})

        if(video){
            let totalRating = video.reduce((a, b)=> a + b.rating, 0)
            let sRating = totalRating / video.length
            types.video = sRating

        }

        let vendor = await feedBackModel.find({type : "audio"})

        if(vendor){
            let totalRating = vendor.reduce((a, b)=> a + b.rating, 0)
            let sRating = totalRating / vendor.length
            types.audio = sRating

        }

        let application = await feedBackModel.find({type : "application"})

        if(application){
            let totalRating = vendor.reduce((a, b)=> a + b.rating, 0)
            let sRating = totalRating / application.length
            types.application = sRating

        }

        let customerCare = await feedBackModel.find({type : "customerCare"})

        if(customerCare){
            let totalRating = vendor.reduce((a, b)=> a + b.rating, 0)
            let sRating = totalRating / customerCare.length
            types.customerCare = sRating

        }



        return res.status(200).send(types)

    }
}


module.exports = productCnt