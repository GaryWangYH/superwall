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



                db.query(`SELECT * FROM view_trade_ddos where trade_id='${trade_id}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            for (var i = 0; i < data.length; i++) {
                                data[i].order_begin = moment(data[i].order_begin).format('YYYY-MM-DD HH:mm:ss');
                            }
                            db.query(`SELECT * FROM view_admin where admin_id='${admin_id}'`, (err, data1) => {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');
                            // res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/admin_center.ejs', { data,data1, nav, menu, content: "trade_ddos_detail", menuClick: 1, itemClick: 1 }); 
                            }
                            });
                            
                        } else {
                            res.redirect('/error');
                        }
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
        db.query(`SELECT order_id,order_ddosname,order_ip,\
                    order_buyername,order_begin,order_duration\
                    FROM view_order_ddos WHERE order_tradeid='${trade_id}' and order_buyerid='${user_id}'`, (err, data) => {
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
                        name:data[i].order_ddosname,
                        ip: data[i].order_ip,
                        buyer: data[i].order_buyername,
                        duration: data[i].order_duration+"个月",
                        buildTime: moment(data[i].order_begin).format('YYYY-MM-DD HH:mm:ss')
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