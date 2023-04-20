

const aws = require("aws-sdk");

/* ------------------------------------------------aws config -------------------------------------------------------- */
aws.config.update({
    accessKeyId: process.env.S3_ACCESKEY_ID,
     secretAccessKey: process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION, 
})

/* ------------------------------------------------aws fileUpload-------------------------------------------------------- */
let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        let s3 = new aws.S3({ apiVersion: '2006-03-01' }); 
        let unique = Math.random().toString(36).slice(2, 7);

        var uploadParams = {
            ACL: "public-read",
            Bucket: process.env.S3_BUCKET,  
            Key: "api/" + unique + file.originalname,
            Body: file.buffer
        }


        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log("file uploaded succesfully")
            return resolve(data.Location)
        })
    })
}
module.exports.uploadFile = uploadFile
