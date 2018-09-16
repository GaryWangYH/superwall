const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const moment = require('moment');
var db = common.db();
const bodyParser = require('body-parser');

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
                var refund_id = req.query.id;
                db.query(`SELECT * FROM view_refund_hssapply where refund_id='${refund_id}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            var nowdate=(new Date()).getTime();
                            var enddate= data[0].refund_endtime.getTime();
                            data[0].unuseddays =parseInt((enddate-nowdate)/(1000*60*60*24));
                            data[0].amountrefund =parseInt(data[0].refund_price*data[0].unuseddays/data[0].refund_buytime/30);
                            data[0].refund_time = moment(data[0].refund_time).format('YYYY-MM-DD HH:mm');
                            db.query(`SELECT * FROM data_product where product_id='${data[0].refund_productid}'`, (err, data1) => {
                                if (err) {
                                    console.error(err);
                                   res.redirect('/error');// res.status(500).send('database error').end();
                                } else {

                                    res.render('admingly/web/admin_center.ejs', { data, data1, nav, menu, content: "hssapply_view", menuClick: 1, itemClick: 0 });
                                }
                            });
                        } else {
                            res.redirect('/error');
                        }
                    }
                });
            });
            router.post('/refund', urlencodedParser, function(req, res) {
                var order_id = req.body.mod_order;
                var user_id = req.body.mod_user;
                var price = req.body.mod_sum;
                var clerk = req.body.mod_clerk;
                var act = req.body.mod_act;
                var telephone= req.body.mod_phone;
                var status;
                var message;      
                db.query(`CALL proc_refund_hss ('${act}','${order_id}','${user_id}',${price},'${clerk}','${moment().format("YYYY-MM-DD HH:mm:ss")}','ddos高防ip退款',@status);`, function(err, rows, fields) {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');//res.status(500).send('database error').end();
                        } else {
                        status = rows[1][0].result;
                          if (status == 1) {
                                message = '业务员同意了您的高防服务器退款申请';
                                var info = {
                                            type: "user_refund_success",
                                            telephone: telephone,
                                            content:{
                                                money: price
                                            }
                                        }
                                common.info(info);
                                res.status(200).send({ msg: "操作成功" }).end();
                            } 
                            else if(status == 2)
                            {
                            message = '业务员拒绝了您的高防服务器退款申请';
                            var info = {
                                        type: "user_refund_fail",
                                        telephone: telephone,
                                        content:{}
                                    }
                            common.info(info);
                            res.status(200).send({ msg: "操作成功" }).end();
                            }
                            else { res.status(200).send({ msg: "操作失败" }).end(); }  
                        }
                    });
            });
        }
    });
    return router;
}