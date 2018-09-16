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
    
    fs.readFile('./static/demo/order.txt', function(err, data) {
        if (err) {
            console.log('读取失败');
        } else {
            order = JSON.parse(data.toString());
        }
    });

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
                var apply_id = req.query.id;
                db.query(`SELECT * FROM trade_hss_apply where id='${apply_id}'`, (err, data1) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data1)) {
                            data1[0].apply_time = moment(data1[0].apply_time).format('YYYY-MM-DD HH:mm');
                             db.query(`SELECT * FROM view_trade_hss where trade_id='${data1[0].trade_id}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            
                                data[0].order_begin = moment(data[0].order_begin).format('YYYY-MM-DD HH:mm');
                           
                            res.render('admingly/web/admin_center.ejs', { data,data1, nav, menu, content: "discount_hss_detail", menuClick: 2, itemClick: 0 }); 
                            } else {
                            res.redirect('/error');
                             }
                            }
                        });

                            } else {
                            res.redirect('/error');
                        }
                    }
                });
            });  
        }
        });

            router.post('/agree', urlencodedParser, function(req, res) {
                var trade_id = req.body.trade_id;
                var price = req.body.price;
                var note = req.body.note;
                var clerk = req.session['admin_id'];
                var apply_id = req.body.apply_id;
                var buyer_phone = req.body.buyer_phone;
                var buyer_name = req.body.buyer_name;
                var buyer = req.body.buyer;
            async.series({
                one: function(callback){
                  db.query(`UPDATE trade_hss_apply SET operate = 1\ 
                    WHERE id = '${apply_id}'`, (err, data) => {
                    callback(err, null);
                    });
                },
                two: function(callback){
                    db.query(`UPDATE trade_hss SET order_sum =${price},\
                     note='${note}',discount_status=1003\
                     WHERE trade_id = '${trade_id}'`, (err, data1) => {
                    callback(err, null);
                    });
                },
                three: function(callback){
                    db.query(`INSERT INTO info_user \
                    (info_user_id,\
                    user_id,\
                    info_url,\
                    info_describe,\
                    info_status,\
                    buildTime)VALUES(replace(uuid(),'-',''),\
                    '${buyer}',\
                    '/center/trade_hss/detail?id=${trade_id}',\
                    '您的高防服务器订单价格已修改',\
                    1001,'${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data2) => {
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

                    var detail=`原价格${oldprice}元，申请价格${price}元，原因:${note}`;
                    common.log_admin(req.session['admin_id'],"同意修改高防服务器订单价格",detail);
            
                        var info = 
                        {
                            type: "admin_discount",
                            telephone: buyer_phone,
                            content:{
                                type: "高防服务器",
                                price:price
                            }
                        }
                        //need  texting
                        //发短信需要高级管理员的电话
                        //common.info(info);
                        console.log(info);
                        res.status(200).send({ msg: "操作成功" }).end();
                    }
                });
            });



            router.post('/refuse', urlencodedParser, function(req, res) {
                var apply_id = req.body.apply_id;
                var trade_id = req.body.trade_id;
                db.query(`UPDATE trade_hss_apply SET operate = 1\ 
            WHERE id = '${apply_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send("database error").end();
            } else {
                db.query(`UPDATE trade_hss SET discount_status=1004\
                     WHERE trade_id = '${trade_id}'`, (err, data1) => {
                if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send("database error").end();
                } else {

               common.log_admin(req.session['admin_id'],"拒绝修改高防服务器订单价格","拒绝修改高防服务器订单价格");
                
                var info = 
                {
                    type: "admin_discount",
                    telephone: buyer_phone,
                    content:{
                        type: "高防服务器",
                        price:price
                    }
                }
                res.status(200).send({ msg: "操作成功" }).end();
                //need  texting
                //发短信需要高级管理员的电话
                //common.info(info);
                console.log(info);

                            }
                        }) 
                    }
                })   
            });

           

    return router;
}