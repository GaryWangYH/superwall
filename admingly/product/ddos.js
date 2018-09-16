const express = require('express');
const common = require('../../../libs/common');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');

const db = common.db();

module.exports = function() {
    var router = express.Router();

    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    var menu = {};

    fs.readFile('./static/txt/admin_center_product_menu.txt', function(err, data) {
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "product_ddos", menuClick: 0, itemClick: 1 })
            });
            router.get('/detail', (req, res) => {
                var ddos_id = req.query.id;
                db.query(`SELECT * FROM ddos WHERE ddos_id = '${ddos_id}'`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            res.render('admingly/web/admin_center.ejs', { data: data[0], nav, menu, content: "product_ddos_detail", menuClick: 0, itemClick: 1 })
                        } else {
                            res.redirect('/error');
                        }
                    }
                })
            });
            router.get('/new', (req, res) => {
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "product_ddos_new", menuClick: 0, itemClick: 1 })
            });
        }
    });

    router.get('/data', (req, res) => {
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT * FROM ddos`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send("database error").end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {};
                    item = {
                        index: i + 1,
                        ddos_id: data[i].ddos_id,
                        name: data[i].name,
                        price: data[i].price+'元',
                        bandwidth: data[i].bandwidth,
                        describe: data[i].describe
                    }
                    array.push(item);
                }
                var arraySlice = array.slice(start, end);
                var out = {
                    code: 0,
                    msg: "",
                    count: data.length,
                    data: arraySlice
                }
                res.status(200).send(JSON.stringify(out)).end();
            }
        })
    })

    router.post("/update",urlencodedParser, (req, res) => {
        var data = JSON.parse(req.body.data);
        var ddos_id = data.ddos_id;
        var name = data.name;
        var price = data.price;
        var bandwidth = data.bandwidth;
        var describe = data.describe;
        var change_price = data.change_price;
        var change_bandwidth = data.change_bandwidth;
        db.query(`UPDATE ddos SET name = '${name}',\
            price = '${price}',\
            bandwidth = '${bandwidth}',\
            ddos.describe = '${describe}' 
            WHERE ddos_id = '${ddos_id}'`, (err, data1) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send("database error").end();
            } else {

                //** 添加日志 **
                var detail='修改DDoS高防产品信息'+change_price+change_bandwidth;
                common.log_admin(req.session['admin_id'],"修改DDoS高防产品信息",detail);

                res.status(200).send({ msg: "修改成功" }).end();
            }
        })
    })

    router.post("/delete",urlencodedParser, (req, res) => {
        var ddos_id = req.body.ddos_id;
        db.query(`DELETE FROM ddos WHERE ddos_id = '${ddos_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send("database error").end();
            } else {

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"删除DDoS高防",
                    `删除一个DDoS高防产品`)

                res.status(200).send({ msg: "删除成功" }).end();
            }
        })
    })

    router.post("/new/submit",urlencodedParser, (req, res) => {
        var data = JSON.parse(req.body.data);
        var name = data.name;
        var price = data.price;
        var bandwidth = data.bandwidth;
        var describe = data.describe;
        db.query(`INSERT INTO ddos VALUES (replace(UUID(),'-',''),\
            '${name}',\
            ${price},\
            '${bandwidth}',\
            '${describe}')`, (err, data1) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send("database error").end();
            } else {

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"新增DDoS高防产品",
                    `新增DDoS高防产品，带宽为${bandwidth}，价格为${price}元`);

                res.status(200).send({ msg: "添加成功" }).end();
            }
        })
    })


    return router;
}