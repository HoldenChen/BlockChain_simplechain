/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const level = require('level');
const chainDB = './chaindata1';
const db = level(chainDB);
const chainHeightKey = 'blockchain_height';
var errorLog = [];
function addKVData2LevelDB(key,value){
	db.put(key,value,function(err){
		if(err) {
			return console.log('key '+key+' submission failed',err);
		}else{
			console.log('db put the '+key+ 'with value: '+value);
		}
	})
}

function getValueByKeyFromLevelDB(key){
	db.get(key,function(err,value){
		if(err) return console.console.log('Not found !',err);
		let obj = JSON.parse(value);
		console.log('property: body: '+obj.body);
		return value;
	})
}

function getTimeLeftwithAdd_time_start(key,resolve){
	db.get(key,function(err,value){
		if(err){
			console.log('no record found by key: '+key);
			resolve(-1);
		}else{
			console.log(key+' found record with '+value+' time left');
			resolve(value);
		}
	})
}

function qureyAddressValidateWindowRegisted(msg,resolve){
	db.get(msg,function(err,value){
		if(err){
			console.log("not registed: "+err);
			resolve('NotRegisted')
		}else{
			console.log('registed: '+value);
			resolve('Registed');
		}
	});
}

function getTimestampByWA(address,reslove){
	db.get(address,function(err,value){
		if(err){
      reslove(-1);
		}else{
			reslove(value);
		}
	});
}

function delWalletAddressTimestamp(address){
	db.del(address,function(err){
		if(!err){
			console.log('old address&timestamp delete successfully');
		}else{
			console.log('something wrong happend when delete address: '+address);
		}
	});
}

//add wallet address with the timestamp to the levelDB for validateWindow.
function addAddrTimestamp(address,timestamp,resolve){
	 //first try to get this address from db, if exist,check  timeout
	 db.get(address,function(err,value){

		 if(err){
			 // not exist in the db ,just add it to the db
			 db.put(address,timestamp,function(err){
				 if(err){
					 console.log('something wrong when add address: '+address+ ' to db with error info: '+error);
           resolve(-1);
				 }else{
					 console.log('add address: '+address +'  successfully!');
					 resolve(timestamp);
				 }
			 })
		 }else{
      //current address already exist in the levelDB ,check timeout
			var currenttime = Date.now();
			if(currenttime - value > 300*1000){ //time expired
				//delete old record ,and add new one.
				db.del(address,function(err){
					if(err){
						console.log('something wrong when delete address: '+address+" with error:"+err);
						resolve(-1);
					}else{
						db.put(address,timestamp,function(err){
		 				 if(err){
		 					 console.log('something wrong when add address: '+address+ ' to db with error info: '+error);
               resolve(-1);
						 }else{
		 					 console.log('add address: '+address +'  successfully!');
							 resolve(timestamp);
		 				 }
		 			 })
					}
				});
			}else{ //current address exist in the db and time not expired,just return the timestamp
				resolve(value) ;
			}
		 }
	 })
}

function addBlock(newBlock){
		// Block height
		db.get(chainHeightKey,function(err,value){
			if(err){
				console.log('something wrong ,get blockheight failed!');
			}else{
				newBlock.height = +value + 1;
				// // UTC timestamp
				newBlock.time = new Date().getTime().toString().slice(0,-3);
				db.get(value,function(err,res){
					if(err){
						return console.log('get '+value+'th block failed');
					}else{
                        let value2 = JSON.parse(res);
						newBlock.previousBlockHash = value2.hash;
						newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
						addKVData2LevelDB(+newBlock.height,JSON.stringify(newBlock));
						console.log('previousBlockHash : '+value2.hash+"   current hash: "+newBlock.hash);
						db.del(chainHeightKey,function(err){
							if(!err){
								console.log("1 del old success, add new now!");
								addKVData2LevelDB(chainHeightKey,+newBlock.height);
							}
						});
						return;
					}
				});
			}
		});
	}

	function addBlockbody(newBlockbody,resolve){
			// Block height
			db.get(chainHeightKey,function(err,value){
				if(err){
					console.log('something wrong ,get blockheight failed!');
				}else{
					var newBlock = new Block(newBlockbody);
					newBlock.height = +value + 1;
					// // UTC timestamp
					newBlock.time = new Date().getTime().toString().slice(0,-3);
					db.get(value,function(err,res){
						if(err){
							return console.log('get '+value+'th block failed');
						}else{
	                        let value2 = JSON.parse(res);
							newBlock.previousBlockHash = value2.hash;
							newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
							addKVData2LevelDB(+newBlock.height,JSON.stringify(newBlock));
							resolve(JSON.stringify(newBlock));
							console.log('previousBlockHash : '+value2.hash+"   current hash: "+newBlock.hash);
							db.del(chainHeightKey,function(err){
								if(!err){
									console.log("1 del old success, add new now!");
									addKVData2LevelDB(chainHeightKey,+newBlock.height);
								}
							});
							return;
						}
					});
				}
			});
		}

	function getBlockHeight(){
		db.get(chainHeightKey,function(err,value){
			if(err){
				console.log('get blockheight failed!');
			}else{
				console.log(value);
				return value;
			}
		});
	}


//return a block obj;
	function getBlock(blockHeight){
		db.get(blockHeight,function(err,value){
			if(!err){
               let block = JSON.parse(value);
               console.log('block: '+block);
               return block;
			}else{
                console.log('something wrong when get Block');
			}
		});
	}


  function  validateBlock(blockHeight){
      // get block object
      db.get(blockHeight,function(err,value){
      	if(!err){
            console.log('getBlock success in the validateBlock! ');
            var block = JSON.parse(value);
            let blockHash = block.hash;
            console.log('blockHeight '+blockHeight);
            console.log('blockHash '+block.previousBlockHash);
            console.log('blockHash: '+blockHash);
            console.log('blockBody: '+block.body);
      		// remove block hash to test block integrity
      		block.hash = '';
      		// generate block hash
      		let validBlockHash = SHA256(JSON.stringify(block)).toString();
      		// Compare
      		if (blockHash===validBlockHash) {
      			console.log('block validated!');
          		return true;
        	} else {
          		console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          		errorLog.push(blockHeight);
          		return false;
        	}
      	}else{
            console.log('something wrong when get block');
      	}
      });
    }



// Validate blockchain
    function   validateChain(){

	    db.get(chainHeightKey,function(err,value){
				if(!err){
					console.log("line 130 :validateChain chain height "+value);
					for (var i = 0; i < value; i++) {
		        // validate block
		        // compare blocks hash link
							db.get(i,function(err,res1){
								if(!err){
									let value1 = JSON.parse(res1);
									let block_hash = value1.hash;
									db.get(i+1,function(err,res2){
										if(!err){
											let value2 = JSON.parse(res2);
											let pre_blockhash = value2.previousBlockHash;
											if (block_hash!==pre_blockhash) {
							          			errorLog.push(i);
							        		}
							      		}
								      	if (errorLog.length>0) {
								        	console.log('Block errors = ' + errorLog.length);
								        	console.log('Blocks: '+errorLog);
								      	} else {
								        	console.log('No errors detected');
								      	}
									});
								}
							});
					}
				}else{
					console.log("get chainHeight failed in validateChain!");
				}

			});
    }


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    // this.chain = [];
		db.get(chainHeightKey,function(err,value){
			if(err){//
				addKVData2LevelDB(chainHeightKey,0);
				let block = new Block("First block in the chain - Genesis block");
				block.height = 0;
				block.time = new Date().getTime().toString().slice(0,-3);
				block.hash = SHA256(JSON.stringify(block)).toString();
				console.log('blockchain constructor block.hash: '+block.hash);
				addKVData2LevelDB(block.height,JSON.stringify(block));
			}
		});

  }



	// Get block height
    getBlockHeight(){
    getBlockHeight();
    }

//add block to leveldb
    addBlock(block){
    	addBlock(block);
    }

//get block height
    getBlock(blockHeight){
    	getBlock(blockHeight);
    }

	 //
    // validate block
   validateBlock(height){
   	validateBlock(height);
   }


  validateChain(){
  	validateChain();
  }

}

//test function
var blockchain = new Blockchain();
setTimeout(function(){
	db.get(chainHeightKey).then(function(height){
		console.log("blockchian height: "+height);
		if(height<2){
			(function theLoop (i) {
			  setTimeout(function () {
					var body = {
						address :"142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
						star:{
							ra :"16h 29m 1.0s" ,
							dec :"-26° 29' 24.9" ,
							story :"466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
							storyDecoded:"Found star using https://www.google.com/sky/"
						}
					}
			    addBlock(new Block(body));
			    if (--i) theLoop(i);
			  }, 100);
			});
		}
	});
},1000);

// Dear reviewer , I Don't know how to export functions that inside the class which in a file with many classes, any suggestions or guideline link?
module.exports = {delWalletAddressTimestamp,getBlock,addBlock,getBlockHeight,addBlockbody,addAddrTimestamp,getTimestampByWA,qureyAddressValidateWindowRegisted,addKVData2LevelDB,getTimeLeftwithAdd_time_start};
module.exports.db = db;
var blockchain = new Blockchain();
