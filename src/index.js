const express=require('express')
const path=require('path')
const bodyParser=require('body-parser')
const api = require('binance');
const hbs=require('hbs')
const stock_api=require('./utils/api')
const cors=require('cors')
const socket = require('socket.io');


homepage=path.join(__dirname,'../public')
viewpage=path.join(__dirname,'../templates/views')

const app =express()
const port=process.env.PORT||5000

app.use(express.static(homepage))
app.set('view engine','hbs')
app.set('views',viewpage)
app.use(bodyParser.json({limit: '50mb'}));



const server=app.listen(port,()=>{
  console.log('server started'+ port)
})

const io = socket(server);
const bRest = new api.BinanceRest({
  key: "", // Get this from your account on binance.com
  secret: "", // Same for this
  timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
  recvWindow: 20000, // Optional, defaults to 5000, increase if you're getting timestamp errors
  disableBeautification: false,
  handleDrift: true
});

const binanceWS = new api.BinanceWS(true);
  io.on('connection', function(socket) {
    const bws = binanceWS.onKline(socket.handshake.query['symbol'],socket.handshake.query['time'], (data) => {
      io.sockets.emit('KLINE',{name:socket.handshake.query['symbol'],time:(data.kline.startTime/1000),open:parseFloat(data.kline.open),high:parseFloat(data.kline.high),low:parseFloat(data.kline.low),close:parseFloat(data.kline.close)});
      });  
   
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
      console.log('parameter change')
    });
   });

app.get('/',cors(),(req,res)=>{
  res.render('home')
})


app.get('/api/linear',cors(),(req,res)=>{ 
    stock_api(req.query.symbol,req.query.time,(error,{body}={})=>{
      if (error) {
        return res.send({error})
      }
      res.send({body})
    })
  })