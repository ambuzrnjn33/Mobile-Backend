
const axios = require("axios")
const NodeGeocoder = require('node-geocoder')
const getLocationByAdd2 = async(address)=>{

    const params = {
        access_key: "4c91de2d5e397a5c46236ac630adc668",
        query: address,
      };
      console.log(address)
    
      const resp = await axios.get(
        "http://api.positionstack.com/v1/forward",
        {
          params,
        }
      );
    
      if (!resp.data.data[0]) {
        return null;
      }
    
      lat = resp.data.data[0].latitude;
      lang = resp.data.data[0].longitude;
      //console.log(resp)

      return [lat, lang]



}



const getLocationByAdd = async (address) => {
  const options = {
    provider: "google",
    apiKey: process.env.GOOGLE_API_KEY,
    formatter: null,
  };
  const geocoder = NodeGeocoder(options);
  console.log(process.env.GOOGLE_API_KEY);

  try {
    const result = await geocoder.geocode(address);
    console.log(result)
    return [result[0].latitude, result[0].longitude];
  } catch (error) {
    console.log(error);
  }
};

module.exports = getLocationByAdd