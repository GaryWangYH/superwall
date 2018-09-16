const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const common = require('../../../../libs/common');
const moment = require("moment");

const db = common.db();

module.exports = function() {
    var router = express.Router();

    var menu = {};
    fs.readFile('./static/txt/admin_center_center_menu.txt', function(err, data) {
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "other_bill", menuClick: 0, itemClick: 0 })
            });
            router.get('/detail', (req, res) => {
                var bill_id = req.query.id;
                db.query(`SELECT * FROM view_bill_admin WHERE bill_id = '${bill_id}'`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            data[0].buildTime = moment(data[0].buildTime).format("YYYY-MM-DD HH:mm:ss");
                            if (data[0].deliveryTime) {
                                data[0].deliveryTime = moment(data[0].deliveryTime).format("YYYY-MM-DD HH:mm:ss");
                            }
                            res.render('admingly/web/admin_center.ejs', { data, nav, menu, content: "other_bill_detail", menuClick: 0, itemClick: 0 });
                        } else {
                            res.redirect('/error');
                        }
                    }
                })
            })
        }
    });

    router.get('/data', (req, res) => {
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT * FROM view_bill_admin`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {}
                    item = {
                        index: i + 1,
                        id: data[i].bill_id,
                        username: data[i].username,
                        money: data[i].money,
                        buildTime: moment(data[i].buildTime).format('YYYY-MM-DD HH:mm:ss'),
                        status: data[i].status,
                        statusCode: data[i].statusCode
                    }
                    if (data[i].deliveryTime == null) {
                        item.deliveryTime = ""
                    } else {
                        item.deliveryTime = moment(data[i].deliveryTime).format('YYYY-MM-DD HH:mm:ss')
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

    router.get("/delivery", (req, res) => {
        var bill_id = req.query.bill_id;
        var expressID = req.query.expressID;
        db.query(`UPDATE bill SET status = 1002, expressID = '${expressID}', \
            deliveryTime = '${moment().format("YYYY-MM-DD HH:mm:ss")}', \
            admin_id = '${req.session['admin_id']}' \
            WHERE bill_id = '${bill_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var detail=`交付发票，设置expressID为${expressID}`;
                common.log_admin(req.session['admin_id'],'交付发票',detail);
                res.status(200).send({ msg: "交付成功" });
            }
        })
    })
    router.get("/cancel", (req, res) => {
        var bill_id = req.query.bill_id;
        db.query(`UPDATE bill SET status = 1003 \
            WHERE bill_id = '${bill_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var detail=`取消发票`;
                common.log_admin(req.session['admin_id'],'取消发票',detail);
                
                res.status(200).send({ msg: "取消成功" });
            }
        })
    })
    router.get("/changeExpressID", (req, res) => {
        var bill_id = req.query.bill_id;
        var expressID = req.query.expressID;
        db.query(`UPDATE bill SET expressID = '${expressID}' \
            WHERE bill_id = '${bill_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var detail=`修改发票，修改expressID为${expressID}`;
                common.log_admin(req.session['admin_id'],'修改发票',detail);
                
                res.status(200).send({ msg: "修改成功" });
            }
        })
    })
    router.get("/finish", (req, res) => {
        var bill_id = req.query.bill_id;
        db.query(`UPDATE bill SET status = 1004 \
            WHERE bill_id = '${bill_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var detail=`完成发票`;
                common.log_admin(req.session['admin_id'],'完成发票',detail);
                
                res.status(200).send({ msg: "申请已完成" });
            }
        })
    })



    return router;
}