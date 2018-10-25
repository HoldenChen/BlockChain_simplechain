'use strict';

const Hapi=require('hapi');
var bitcoin = require('bitcoinjs-lib');
var bitcoinMessage = require('bitcoinjs-message');
var blockchain = require('./simpleChain');


// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

// query stars by wallet address
server.route({
    method:'GET',
    path:'/stars/address:{ADDRESS}',
    handler:function(request,h) {
      var blockchainArray = [];
      const promise = new Promise((resolve,reject)=>{
        blockchain.db.get('blockchain_height',function(err,value){
          if(err){
            reject(err);
            console.log('get blockheight failed!');
          }else{
            resolve(value);
            console.log(value);
          }
        });
      });
      const pse = new Promise((resolve,reject)=>{
        promise.then(function(height){
          console.log("blockheight: "+height);
          blockchain.db.createReadStream({
          }).on('data',function(data){
            blockchainArray.push(data);
            // resolve(data);

          }).on('end',function(data){
            var queryResult = [];
            blockchainArray.forEach(function(v){
              let obj = JSON.parse(v.value);
              if(typeof(obj.body)=='object'){
                   console.log(obj.body.address);
                   if(obj.body.address == request.params.ADDRESS){
                     let blockobj = JSON.parse(v.value);
                     var storyEecoded = blockobj.body.star.story;
                     var storyDecoded = Buffer.from(storyEecoded,'hex').toString('utf8');
                     var blockbody = {
                       address:blockobj.body.address,
                       star:{
                         dec:blockobj.body.star.dec,
                         ra:blockobj.body.star.ra,
                         story:storyEecoded,
                         storyDecoded:storyDecoded
                       }
                     };
                     var block = {
                       hash:blockobj.hash,
                       height:blockobj.height,
                       body:blockbody,
                       time: blockobj.time,
                       previousBlockHash:blockobj.previousBlockHash
                     }
                     queryResult.push(block);
                   }
              }
            });
            resolve(h.response(queryResult).type('application/json'));
          });
        });
      });
  return pse;
    }
});


server.route({
    method:'GET',
    path:'/stars/hash:{HASH}',
    handler:function(request,h) {
      var blockchainArray = [];
      const pse = new Promise((resolve,reject)=>{
          blockchain.db.createReadStream({
          }).on('data',function(data){
            blockchainArray.push(data);
          }).on('end',function(data){
            var queryResult = [];
            blockchainArray.forEach(function(v){
              let obj = JSON.parse(v.value);
              if(typeof(obj.hash)=='string'){
                   console.log(obj.hash);
                   if(obj.hash == request.params.HASH){
                     let blockobj = JSON.parse(v.value);
                     var storyEecoded = blockobj.body.star.story;
                     var storyDecoded = Buffer.from(storyEecoded,'hex').toString('utf8');
                     var blockbody = {
                       address:blockobj.body.address,
                       star:{
                         dec:blockobj.body.star.dec,
                         ra:blockobj.body.star.ra,
                         story:storyEecoded,
                         storyDecoded:storyDecoded
                       }
                     };
                     var block = {
                       hash:blockobj.hash,
                       height:blockobj.height,
                       body:blockbody,
                       time: blockobj.time,
                       previousBlockHash:blockobj.previousBlockHash
                     }
                     queryResult.push(block);


                   }
              }
            });
            resolve(h.response(queryResult).type('application/json'));
          });
      });
  return pse;
    }
});



//
server.route({
  method:'GET',
  path:'/block/{height}',
  handler:function(request,h){
    var promise = new Promise((resolve,reject)=>{
      blockchain.db.get(request.params.height,function(err,value){
        if(err){
          reject(err);
        }else{
          let blockobj = JSON.parse(value);
          var storyEecoded = blockobj.body.star.story;
          var storyDecoded = Buffer.from(storyEecoded,'hex').toString('utf8');
          var blockbody = {
            address:blockobj.body.address,
            star:{
              dec:blockobj.body.star.dec,
              ra:blockobj.body.star.ra,
              story:storyEecoded,
              storyDecoded:storyDecoded
            }
          };
          var block = {
            hash:blockobj.hash,
            height:blockobj.height,
            body:blockbody,
            time: blockobj.time,
            previousBlockHash:blockobj.previousBlockHash
          }
          // queryResult.push(block);
        resolve(h.response(block).type('application/json'));
        }
      });
    });
    return promise;
  }
});

function isASCII(str){
  return /^[\x00-\x7F]*$/.test(str);
}

server.route({
  method:'POST',
  path:'/block',
  handler:function(request,reply){

     var walletadd = request.payload.address;
    if(request.payload.star.story.length > 250){
      return "Sorry, Your story is too long , 250 words limited!";
    }else if(!isASCII(request.payload.star.story)){
      return "Sorry, Your story contain none ASCII characters!";
    }
    var decReg = /[-]?(\d+)°(\s+)(\d+)'(\s+)([\d.]*)\"/;
    var decstr = request.payload.star.dec;

    console.log(decReg.test(decstr));
    if(!decReg.test(decstr)){
      console.log(decstr.match(decReg));
      return "Sorry, Your star dec's format is not right,please check! eg:-26° 29' 24.9\""+" yours: "+request.payload.star.dec;
    }
    var raReg = /(\d+)h(\s+)(\d+)m(\s+)([\d.]*)s/;
    var rastr = request.payload.star.ra;
    console.log(raReg.test(rastr));
    if(!raReg.test(rastr)){
      return "Sorry, Your star ra's format is not right,please check! eg:-26h 29m 24.9s";
    }
// using address + timestamp + starRegistry  msg to determine weather a validate window registed

var msg_address_timestamp_star_registed = "";
var queryRegistedPromise = new Promise((resolve,reject)=>{
  blockchain.getTimestampByWA(walletadd,resolve);

}).then(function(data){
  //check is address Validated and not timeout
  var validateMsg = walletadd+':'+data+':starRegistry';
  msg_address_timestamp_star_registed = walletadd + ':' +data +':starRegistry Registed:true';
  return new Promise((resolve,reject)=>{
    blockchain.getTimeLeftwithAdd_time_start(validateMsg,resolve);
  });

  // msg_address_timestamp_star_registed = msgRegisted;
  // return Promise.resolve(msgRegisted);
}).then(data =>{
    if(data == -1){
      return Promise.reject({
        addressNotValidate : true,
      });
    }else{
      if(data > 0){
        return new Promise((resolve,reject)=>{
          blockchain.qureyAddressValidateWindowRegisted(msg_address_timestamp_star_registed,resolve);});
      }else{
        return Promise.reject({
          validateWindowExpired : true,
        });
      }
    }
}).then(data =>{
  console.log('line 156');
  if(data == 'NotRegisted'){
    //not registry, add now!
  return  new Promise((resolve,reject)=>{
    var story = request.payload.star.story;
    var encodeStory = Buffer.from(story,'utf8').toString('hex');
      var newblock = {
        address:request.payload.address,
        star:{
          dec:request.payload.star.dec,
          ra:request.payload.star.ra,
          story:encodeStory,
        }
      }
      blockchain.addBlockbody(newblock,resolve);

      //after add current address+timestamp to db ,delete address , allow new validate.
      blockchain.delWalletAddressTimestamp(request.payload.address);

      //record current address+timestamp as registed, avoid multi registers.
      blockchain.addKVData2LevelDB(msg_address_timestamp_star_registed,"true");
    });
  }else if(data == 'Registed'){
    return Promise.reject({
      alreadyRegisted:true,
    });
  }
}).then(data=>{
  return new Promise((resolve,reject)=>{
    resolve(reply.response(data).type('application/json'));
  });
}).catch(ex =>{
  console.log('ex: ',ex);
  if(ex.addressNotValidate){
    return {msg:"Address not validate!"};
  }
  if(ex.validateWindowExpired){
    return {msg:'Validate Window Expired!'};
  }
  if(ex.alreadyRegisted){
    return {
      msg:"This Address already registed in a validate window, please request a new Validata !"
    };
  }
  return false;
});

    // var promise =
    //
    // var np = new Promise((resolve,reject)=>{
    //   promise.then(function(data){
    //     resolve(reply.response(data).type('application/json'));
    //   });
    // });
    return queryRegistedPromise;
  }
});

server.route({
  method:'POST',
  path:'/message-signature/validate',
  handler:function(request,reply){
    var walletAdd = request.payload.address;
    var msgSigned = request.payload.signature;
    if(walletAdd.length < 26 || walletAdd.length > 35){
      return("wallet address invalid");
    }else if(msgSigned.length < 58){
      return("Signature failed");
    }else{
      var msg = "";
      //using wallet address to get timestamp and generate the msg
      var promise = new Promise((reslove,reject)=>{
        blockchain.getTimestampByWA(walletAdd,reslove);
      });

      var newPro = new Promise((resolve,reject)=>{
        promise.then(function(data){
          console.log('line 219 validate: '+data);
          if(data == -1){
            resolve('something wrong when get timestamp');
            console.log('something wrong when get timestamp');
          }else{
            var timps = data;
            msg = walletAdd+':'+data+':starRegistry';
            verifySignature(msg,walletAdd,msgSigned).then(function(data){
              console.log('response: '+data);
              var responseJson = '';

              if(data==true){
                var timeleft = 300 - Math.floor((Date.now()-timps)/1000);
                 responseJson = {
                  registerStar : true,
                  status:{
                    address : walletAdd,
                    requestTimeStamp: timps,
                    message: msg,
                    validateWindow: timeleft,
                    messageSignature:"valid"
                  }
                };

                //add (walletAddress + timestamp + startRegistry) as key timeleft as value to db
               blockchain.addKVData2LevelDB(msg,timeleft);

              }else{
                responseJson = {
                 registerStar : false,
                 status:{
                   address : walletAdd,
                   requestTimeStamp: timps,
                   message: msg,
                   validateWindow: 300 - Math.floor((Date.now()-timps)/1000),
                   messageSignature:"invalid"
                 }
               }
              }
              resolve(responseJson);
            });
          }
        });
      });
      return newPro;
    }
  }

});

function verifyAddressSignature(msg,address,signature){
  return bitcoinMessage.verify(msg,address,signature);
}

async function verifySignature(msg,address,signature){
  let result;
  try{
    result = await verifyAddressSignature(msg,address,signature);
  }catch(e){
    result = e.message;
  }finally{
    return result;
  }
}

server.route({
   method:'POST',
   path:'/requestValidation',
   handler:function(request,reply){

     var walletAddress = request.payload.address;

     if(walletAddress.length < 26 || walletAddress.length > 35){//validate the data
        return("wallet address invalid");
     }else{
       var receivedTime = Date.now();
       var promise = new Promise((resolve,reject)=>{
         blockchain.addAddrTimestamp(walletAddress,receivedTime,resolve);
       });
       var responseData ='';
       var newp = new Promise((resolve,reject)=>{
         promise.then(function(data){
           var timeleft = -1;
           var messagetimestamp = "";
           if(data == null){ //first add to db
             timeleft = 300;
             messagetimestamp = walletAddress+':'+receivedTime+':starRegistry';
              responseData = {
               address:walletAddress,
               requestTimeStamp:receivedTime,
               message : messagetimestamp,
               validateWindow:timeleft
             };
           }else{
             timeleft = Math.floor(300-(receivedTime - data)/1000);
             messagetimestamp = walletAddress+':'+data+':starRegistry';
              responseData = {
               address:walletAddress,
               requestTimeStamp:data,
               message:messagetimestamp,
               validateWindow:timeleft
             }
           }

          resolve(responseData);
         });
       });
      return newp;
     }
   }
}
);


// Start the server
async function start() {

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Server running at:', server.info.uri);
};

start();
