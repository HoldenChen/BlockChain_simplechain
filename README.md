# NotaryBlockChain Server API

## Architecture
Local Server
- Node.js
- Hapi.js

## Starup
- Use `npm install` to install all dependencies this project needs:
```
npm install
```

## RESTful Web API
This project using hapi[https://hapijs.com/] as third part server.

### Launch the Server
```
npm start
```



## Endpoints

### GET Endpoints

#### Get Block
```
curl "http://localhost:8000/block/0"
```

#### Lookup stars by wallet ADDRESS
```
curl "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
```

#### Lookup stars by Block Hash
```
curl "http://localhost:8000/stars/hash:8325dbfdaa75a7be9d92648e22a60a03fa212e4199dc5463318c7fdfb0046916"
```

### POST Endpoints

#### Add Block
```
curl -X "POST" "http://localhost:8000/block" -H 'Content-Type: application/json' -d '{"body": "Testing block with test string data"}'
```

#### requestValidation
```
curl -X "POST" "http://localhost:8000/requestValidation" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}'
```

#### Validate signature
```
curl -X "POST" "http://localhost:8000/message-signature/validate" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
}'
```

#### Add star infos to the blockchain
```
curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}'
```

#### Lookup stars by wallet ADDRESS
```
curl "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
```

#### Lookup stars by Block Hash
```
curl "http://localhost:8000/stars/hash:8325dbfdaa75a7be9d92648e22a60a03fa212e4199dc5463318c7fdfb0046916"
```

#### Lookup stars by block height
```
curl "http://localhost:8000/block/1"
```
