const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const moment = require('moment');
var db = common.db();
const bodyParser = require('body-parser');
const async =require('async');
const uuid = require('node-uuid');

module.exports = function() {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });
    var menu = {};
    var nav;
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
            nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                var trade_id = req.query.id;
                db.query(`SELECT * FROM view_trade_elastic where trade_id='${trade_id}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                                data[0].order_begin = moment(data[0].order_begin).format('YYYY-MM-DD HH:mm:ss');
                            db.query(`SELECT COUNT(1) as count FROM order_elastic WHERE trade_id ='${trade_id}'`, (err, data1) => {
                              
                                data[0].deployedsum=data1[0].count;
                                data[0].undeployedsum=data[0].order_ipsum-data1[0].count;
                                res.render('admingly/web/admin_center.ejs', { data, nav, menu, content: "trade_elastic_delivery", menuClick: 1, itemClick: 2 }); 
                            });
                        } else {
                            res.redirect('/error');
                        }
                    }
                });
            });
        }
        });
    
   
    router.get('/data', (req, res) => {
        var trade_id = req.query.id;
        var ipsum = req.query.ipsum;
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT id,ip,account,password,endTime,duration\
                    FROM view_order_elastic WHERE trade_id='${trade_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i <ipsum; i++) {
                    var item = {}
                    
                    if(i<data.length){
                      item = {
                        id: data[i].id,
                        ip: data[i].ip,
                        duration: data[i].duration+"个月",
                        order_end: moment(data[i].endTime).format('YYYY-MM-DD'),
                        account:data[i].account,
                        password:data[i].password
                        ,status:"deployed"
                        } 
                    }
                    else {
                        item = {
                        ip: "",
                        duration: "",
                        account:"",
                        password:""
                        ,status:"none"
                        } 

                    }
                    item.index=i + 1;
                    array.push(item);
                }
                var out = {
                            code: 0,
                            msg: "",
                            count: array.length,
                            data: array
                        }
                res.status(200).send(JSON.stringify(out)).end();
            }
        })
    });

    router.post('/deployone', urlencodedParser, function(req, res) {
        var order_id = req.body.id;
        var ip = req.body.ip;
        var account = req.body.account;
        var password = req.body.password;

        var trade_id = req.body.trade_id;
        var buyer_phone = req.body.buyer_phone;
        var duration = req.body.duration;
        var os = req.body.os;
        var buyer = req.body.buyer;
        var product = req.body.product;
        var clerk = req.session['admin_id'];
        var remain = req.body.remain;
        var ipsum = req.body.ipsum; 
        console.log(remain);
        console.log(ipsum);
        console.log(trade_id);
        var begindate=moment().format("YYYY-MM-DD HH:mm:ss");
        var enddate=moment().add(duration*30, 'days').format('YYYY-MM-DD HH:mm:ss');
        if(order_id){
        }else{
           
         order_id = uuid.v1().toString().replace(/-/g, '')

            async.series({
            one: function(callback){
                 db.query(`INSERT INTO order_elastic \
                   (order_elastic_id,user_id,admin_id,elastic_charge_id,\
                   trade_id,os,account,password,\
                   duration,ip,buildTime,deliveryTime,endTime,\
                   status,isSchedule)VALUES(\
                  '${order_id}',\
                  '${buyer}',\
                  '${clerk}',\
                  '${product}',\
                  '${trade_id}',\
                  '${os}',\
                  '${account}',\
                  '${password}',\
                  '${duration}',\
                  '${ip}',\
                  '${begindate}',\
                  '${begindate}',\  
                  '${enddate}',\    
                  1002,1)`, (err, data10) => {
                    callback(err, null);})
            },
            two: function(callback){
                var status=1;
                if(remain==1) status=1002;
                else if(remain==ipsum) status=1005;
            if(status==1){
                callback(null, null);    
            }else {
                
                db.query(`UPDATE trade_elastic SET status=${status}\
                WHERE trade_id='${trade_id}'`, (err, data) => {
                callback(err, null);
                });
                }
            },
            three:function(callback){
            var detail=`IP地址为${ip}，时长为${duration}个月，布署后从${begindate}开始到${enddate}结束`;
            common.log_admin(req.session['admin_id'],"布署弹性防护服务器IP",detail);
             
                callback(null, null);
            },
            four:function(callback){
                db.query(`INSERT INTO info_user \
                (info_user_id,\
                user_id,\
                info_url,\
                info_describe,\
                info_status,\
                buildTime)VALUES(replace(uuid(),'-',''),\
                '${buyer}',\
                '/center/elastic/detail?id=${order_id}',\
                '您的弹性防护服务器已部署',\
                1001,'${begindate}')`, (err, data) => {
                        callback(err, null);
                });
            }
            },
            function(err, results) {
                if (err) {
                    console.log(err);
                    res.redirect('/error');//res.status(500).send('database error').end();
                } else
                {
                    if(remain==1){
                    var info = 
                    {
                        type: "user_deploy",
                        telephone: buyer_phone,
                        content:{
                            type: "弹性防护",
                            deliveryTime: begindate,
                            endTime: enddate
                        }
                    }
                    //common.info(info);
                    //console.log(info);
                    }
                    //else console.log("布署成功");
                    res.status(200).send({ msg: "布署成功" }).end();
                }
            });
        }
    });

    return router;
}