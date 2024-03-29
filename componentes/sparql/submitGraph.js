const hash = require('object-hash');
const options=require('./../../.config').admin
require('./../helpers/util')

function staging(jsonTriples){
 return new Promise(async (resolve,reject)=>{
     let payload=JSON.stringify(jsonTriples)
     let uid=generateUID(payload)
     let formData = new FormData();
     formData.append('payload', payload);
     let d = new Date();
     uid=`${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}${uid}`
     fetch(`${options.protocol}://${options.hostname}:${options.port}${options.path}${uid}`, {
         method: options.method,
         body: formData
     }).then(async (res)=>{
         res=await res.json()
         resolve({uid, data: res.data, err:res.err})
     }).catch(err=>{
         resolve({uid, data:null, err,})
     })
 })
}

function production(){

}


function generateUID(payload){
    return hash(payload, {algorithm: 'md5'})
}

module.exports = {staging,production}