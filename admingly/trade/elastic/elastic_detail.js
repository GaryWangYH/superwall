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
                var admin_id = req.session['admin_id'];
                db.query(`SELECT * FROM view_trade_elastic where trade_id='${trade_id}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            
                                data[0].order_begin = moment(data[0].order_begin).format('YYYY-MM-DD HH:mm');
                            db.query(`SELECT * FROM elastic_charge WHERE status = 1 AND id='${data[0].charge_id}'`, (err, data1) => {
                        if (err) {
                            console.log(err);
                            res.redirect('/error');//res.status(500).send('database error').end();
                        } else {

                            if (common.debugData(data1)) {
                        var item = {};
                            item = {
                                id: data1[0].id,
                                basic_price: data1[0].basic_price,
                                item_ids: data1[0].item_ids,
                                lastMod: moment(data1[0].lastMod).format("YYYY年MM月DD日")
                            }
                            var item_ids = data1[0].item_ids.split(',');
                            var query = 'SELECT * FROM elastic_charge_item '
                            for (var i = 0; i < item_ids.length; i++) {
                                if (i == 0) {
                                    query += "WHERE item_id = '" + item_ids[i] + "'";
                                } else {
                                    query += " OR item_id = '" + item_ids[i] + "'";
                                }
                            }
                            query += ' ORDER BY min ASC'
                            db.query(query, (err, data2) => {
                                if (err) {
                                    console.log(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {
                                    var array = []
                                    for (var i = 0; i < data2.length; i++) {
                                        var item1 = {}
                                        item1 = {
                                            item_id: data2[i].item_id,
                                            max: data2[i].max,
                                            min: data2[i].min,
                                            price: data2[i].price
                                        }
                                        array.push(item1);
                                    }
                                    item.items = array;
                                    db.query(`SELECT * FROM view_admin where admin_id='${admin_id}'`, (err, data0) => {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');
                            // res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/admin_center.ejs', { charge: item, data, data0, nav, menu, content: "trade_elastic_detail", menuClick: 1, itemClick: 2 }); 
                            }
                            });
                                  
                                }
                            })
                        } else {
                        res.redirect('/error');
                    }
                        }
                    })

                          
                        } else {
                            res.redirect('/error');
                        }
                    }
                });
            });

            router.post('/delivery', urlencodedParser, function(req, res) {
                var trade_id = req.body.trade_id;
                var buyer_phone = req.body.buyer_phone;
                var duration = req.body.duration;
                var os = req.body.os;
                var buyer = req.body.buyer;
                var product = req.body.product;
                var clerk = req.body.clerk;
                var ipsum = req.body.ipsum;
                var json=req.body;
                var begindate=moment().format("YYYY-MM-DD HH:mm:ss");
                var enddate=moment().add(duration*30, 'days').format('YYYY-MM-DD HH:mm');
                         
                async.series({
                one: function(callback){
                    // db.query(`UPDATE order_server SET order_state=1002,\
                    // ip='${ip}',\
                    // strAuthorityPork='${pork}',\
                    // order_deploydate='${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                    // order_enddate='${moment().add(duration, 'months').format('YYYY-MM-DD HH:mm')}' \
                    // WHERE order_id='${order_id}'`, (err, data) => {
                    // callback(err, null);
                    // });
                    db.query(`UPDATE trade_elastic SET status=1002\
                    WHERE trade_id='${trade_id}'`, (err, data) => {
                    callback(err, null);
                    });
                },
                two: function(callback){
                    db.query(`INSERT INTO info_user \
                    (info_user_id,\
                    user_id,\
                    info_url,\
                    info_describe,\
                    info_status,\
                    buildTime)VALUES(replace(uuid(),'-',''),\
                    '${buyer}',\
                    '/center/trade_elastic/detail?id=${trade_id}',\
                    '您的弹性防护服务器已部署',\
                    1001,'${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data) => {
                            callback(err, null);
                    });
                },
                three: function(callback){
                    var ip;
                    var account;
                    var password;
                    var source;
                   for(var j=0;j<ipsum;j++){
                 ip="ip"+j;
                 account="account"+j;
                 password="password"+j;
                 source="source"+j;
                 ip=json[ip];
                 account=json[account];
                 password=json[password];
                 source=json[source];
                db.query(`INSERT INTO order_elastic \
                   (order_elastic_id,user_id,admin_id,elastic_charge_id,\
                   trade_id,os,account,password,\
                   duration,ip,buildTime,deliveryTime,endTime,\
                   status,isSchedule)VALUES(replace(uuid(),'-',''),\
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
                        if (err) {
                                    console.log(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                    return;
                                }
                            });
                        }
                    callback(err, null);
                    }
                },
                function(err, results) {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else
                    {
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
                        res.redirect('/admingly/trade/elastic/detail?id='+trade_id); 
                    }
                });
            });
            
        router.get('/data', (req, res) => {
        var user_id = req.query.buyer;
        var trade_id = req.query.id;
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT id,ip,user_name,buildTime,duration\
                    FROM view_order_elastic WHERE trade_id='${trade_id}' and user_id='${user_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {}
                    item = {
                        index: i + 1,
                        id: data[i].id,
                        ip: data[i].ip,
                        buyer: data[i].user_name,
                        duration: data[i].duration+"个月",
                        buildTime: moment(data[i].buildTime).format('YYYY-MM-DD HH:mm')
                    }
                    array.push(item);
                }

                var arraySlice = array.slice(start, end);
                var out = {
                    code: 0,
                    msg: "",
                    count: array.length,
                    data: arraySlice
                }

                res.status(200).send(JSON.stringify(out)).end();
            }
        })
    });

        }
    });

    return router;
}