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
                db.query(`SELECT * FROM view_trade_hss where trade_id='${trade_id}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            for (var i = 0; i < data.length; i++) {
                                data[i].order_begin = moment(data[i].order_begin).format('YYYY-MM-DD HH:mm:ss');
                            }

                            db.query(`SELECT * FROM view_admin where admin_id='${req.session['admin_id']}'`, (err, data1) => {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');
                            // res.status(500).send('database error').end();
                            } else {
                                 res.render('admingly/web/admin_center.ejs', { data, data1,nav, menu, content: "trade_hss_detail", menuClick: 1, itemClick: 0 }); 
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
    

            
        router.get('/data', (req, res) => {
        var user_id = req.query.buyer;
        var trade_id = req.query.id;
        var ipsum = req.query.ipsum;
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT order_id,order_ip,order_deploy,order_end,order_time\
                    FROM view_order_server WHERE order_tradeid='${trade_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {}
                    item = {
                        index: i + 1,
                        id: data[i].order_id,
                        ip: data[i].order_ip,
                        duration: data[i].order_time+"个月",
                        deploytime: moment(data[i].order_deploy).format('YYYY-MM-DD HH:mm'),
                        endtime: moment(data[i].order_end).format('YYYY-MM-DD HH:mm')
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

        router.get('/data1', (req, res) => {
        var trade_id = req.query.id;
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT old_price,new_price,apply_time,note FROM trade_hss_apply \
            WHERE trade_id='${trade_id}' `, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {}
                    item = {
                        index: i + 1,
                        oldprice: data[i].old_price+"元",
                        newprice: data[i].new_price+"元",
                        applytime: moment(data[i].apply_time).format('YYYY-MM-DD HH:mm'),
                        note:data[i].note
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

            router.post('/changePrice', urlencodedParser, function(req, res) {
                var trade_id = req.body.trade_id;
                var price = req.body.price;
                var oldprice = req.body.oldprice;
                var clerk = req.session['admin_id'];
                var note = req.body.note;

                async.series({
                one: function(callback){
                    db.query(`INSERT INTO trade_hss_apply \
                   (id,trade_id,old_price,new_price,apply_time,note,operate)\
                   VALUES(replace(uuid(),'-',''),'${trade_id}',${oldprice},${price},\
                   '${moment().format("YYYY-MM-DD HH:mm:ss")}','${note}',0)`, (err, data) => {
                    callback(err, null);
                    });
                },
                two: function(callback){
                    db.query(`UPDATE trade_hss SET discount_status=1002\
                    WHERE trade_id='${trade_id}'`, (err, data) => {
                            callback(err, null);
                    }); 
                },
                three: function(callback){
                    db.query(`INSERT INTO info_admin VALUES(\
                        replace(UUID(),'-',''),\
                        '1009',\
                        null,\
                        '/admingly/trade/hss/discount',\
                        '业务员需要您审核高防服务器的订单价格修改',\
                        '1001',\
                        '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                        null\
                        )`, (err, data) => {
                            callback(err, null);
                    });
                    }
                },
                function(err, results) {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else{

            
                    var detail=`原价格${oldprice}元，申请价格${price}元，原因:${note}`;
                    common.log_admin(req.session['admin_id'],"申请修改高防服务器订单价格",detail);
            
                        //发短信
                        var info = 
                        {
                            type: "price_change",
                            //telephone: ,
                            content:{
                                type: "高防服务器",
                            }
                        }
                        //common.info(info);
                        console.log(info);
                        res.status(200).send({ msg: "申请已提交" }).end();
                    }
                });
            });
    return router;
}