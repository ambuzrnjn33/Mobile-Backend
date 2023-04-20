//require("aws-sdk"),
const aws =       {
          Upload
      } = require("@aws-sdk/lib-storage"),
      {
          S3
      } = require("@aws-sdk/client-s3");

/* ------------------------------------------------aws config -------------------------------------------------------- */
// aws.config.update({
//     accessKeyId: process.env.S3_ACCESKEY_ID,
//     secretAccessKey: process.env.S3_SECRET_KEY,
//     region: "ap-south-1"
// })

/* ------------------------------------------------aws fileUpload-------------------------------------------------------- */
const uploadFile = async (file) => {

    // { apiVersion: '2006-03-01' }
    // return new Promise(async function (resolve, reject) {
        let s3 = new S3({ 
             accessKeyId: process.env.S3_ACCESKEY_ID,
            secretAccessKey: process.env.S3_SECRET_KEY,
            region: "ap-south-1"}); 
       let unique = Math.random().toString(36).slice(2, 7);
            var uploadParams = { 
            ACL: "public-read",
            Bucket: "devdutta",  
            Key: "api/" + unique + file.originalname,
            Body: file.buffer
        }

        // S3 ManagedUpload with callbacks are not supported in AWS SDK for JavaScript (v3).
        // Please convert to `await client.upload(params, options).promise()`, and re-run aws-sdk-js-codemod.
        // S3 ManagedUpload with callbacks are not supported in AWS SDK for JavaScript (v3).
        // Please convert to `await client.upload(params, options).promise()`, and re-run aws-sdk-js-codemod.
        const upload = new Upload({
            client: s3,
            params: uploadParams
        })

      await upload.done()
        .then(data =>  { 
            console.log(data)
            return data.Location})
        .catch(err => {
            console.log(err)
            return { "error": err }
        }
            )

           
  //  });
}
//module.exports = uploadFile