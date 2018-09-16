const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const moment = require('moment');
var db = common.db();
const bodyParser = require('body-parser');
const async =require('async');

module.exports = function() {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });
    var menu = {};

    fs.readFile('./static/txt/admin_center_order_menu.txt', function(err, data) {
        if (err) {
            console.log('读取失败');
        } else {
            menu = JSON.parse(data.toString());
        }
    });

    fs.readFile('./static/txt/admin_center_nav.txt', function(err, data) {
        if (err) {
            console.log('读取失败');
        } else {
            var nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                var trade_id = req.query.id;

                async.parallel([
            function(callback){
                
                    db.query(`SELECT * FROM view_trade_elastic where trade_id='${trade_id}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        callback('database error',null);
                    } else {
                        if (common.debugData(data)) {
                            for (var i = 0; i < data.length; i++) {
                                data[i].order_begin = moment(data[i].order_begin).format('YYYY-MM-DD HH:mm:ss');
                            }
                            callback(null,data);
                        } else {
                            callback('no database error',null);
                        }
                    }
                });
               
            }, 
            function(callback){
                //修改业务员
                db.query(`SELECT * FROM view_data_clerk `, (err, data1) => {
                    if (err) {
                        console.error(err);
                        callback('database error',null);
                    } else {
                        
                        callback(null,data1);
                    }
                });
            },
            function(callback){
                //修改操作系统
                db.query(`SELECT * FROM data_os`, (err, data2) => {
                    if (err) {
                        console.error(err);
                        callback('database error',null);
                    } else {
                        callback(null,data2);
                    }
                });
            },
            function(callback){
                //支付方式
                db.query(`SELECT * FROM pay_type_status`, (err, data3) => {
                    if (err) {
                        console.error(err);
                        callback('database error',null);
                    } else {
                        callback(null,data3);
                    }
                });
                   
            }],
            function(err, results){
                    
                if(err==null){
                    data=results[0];
                    data1=results[1];
                    data2=results[2];
                    data3=results[3];

                res.render('admingly/web/admin_center.ejs', { data,data1,data2,data3, nav, menu, content: "trade_elastic_control", menuClick: 1, itemClick: 2 }); 
                }else{res.redirect('/error');} 
            });

            });
        }
    });

    router.post('/update', urlencodedParser, function(req, res) {
        var data = JSON.parse(req.body.data);

        var admin_id=req.session['admin_id'];
        var trade_id=data.trade_id; 
        var trade_id1= trade_id+'1';          
        var buyer_phone = data.buyer_phone;
        var buyer = data.buyer_id;
        var os_name = data.os_name;
        var duration = data.duration;
        var ip_sum = data.ipsum; 
        var pay_type = data.pay_type; 
        

        var price = data.price;
        var paystatus = data.paystatus;
        var clerk_id = data.clerk_id;
        var note = data.note; 

        var change = req.body.change;
        var record = req.body.record;
        var pay_typename = req.body.pay_typename; 
         
        async.series([
            function(callback){
                db.query(`UPDATE trade_elastic SET \
                clerk_id='${clerk_id}',\
                os='${os_name}',\
                duration=${duration},\
                ip_sum=${ip_sum},\
                order_sum=${price},\
                status=${paystatus},\
                pay_type=${pay_type}\
                WHERE trade_id='${trade_id}'`, (err, data) => { 
                    callback(err, data);
                });  
            },
            function(callback){
                db.query(`INSERT INTO info_user VALUES(\
                    replace(UUID(),'-',''),\
                    '${buyer}',\
                    '/center/trade/detail?id=${trade_id}',\
                    '您的修改弹性防护订单状态已修改',\
                    '1001',\
                    '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                    null\
                    )`, (err, data1) => {
                    callback(err, data1);
                });  
            },
            function(callback){
                if(record==1){
                    db.query(`INSERT INTO record_trade_elastic (pay_id,trade_id,clerk_id,user_id,amount,\
                        pay_time,pay_type,_describe)VALUES('${trade_id1}', '${trade_id}', '${admin_id}',
                         \'${buyer}', ${price}, '${moment().format("YYYY-MM-DD HH:mm:ss")}', ${pay_type}, '${pay_typename}')`, (err, data2) => {
                    callback(err, data2);
                });  
                   
                }
                 else  callback(null, null);
            }
            ], function (err, result) {  
                if(err){
                    console.log(err);
                    res.redirect('/error');//res.status(500).send('database error').end();
                }
                else{

                common.log_admin(admin_id,'修改弹性防护订单状态','修改弹性防护订单状态'+change);
                res.status(200).send({msg:"修改成功"}).end();
                //短信

                //common.info();    
                    }
             });
    });


    return router;
}