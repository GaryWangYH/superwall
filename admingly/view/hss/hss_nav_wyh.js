const express = require('express');
const fs = require('fs');
const mysql = require('mysql');
const common = require('../../../../libs/common');
const bodyParser = require('body-parser');

var db = common.db();

module.exports = function() {
    var router = express.Router();
    var jsonParser = bodyParser.json();

    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    var menu = {};
    var nav = {};
    fs.readFile('./static/txt/admin_center_view_menu.txt', function(err, data) {
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
                db.query(`SELECT * FROM view_nav_hss_type1`, (err, type1) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                        db.query(`SELECT * FROM view_nav_hss_type2`, (err, type2) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                db.query(`SELECT * FROM view_hss_type_and_product`, (err, items) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {
                                        console.log(items);
                                        res.render('admingly/web/admin_center.ejs', { nav, menu, content: "hss_nav", type1, type2, items, menuClick: 2 ,itemClick:0 });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    });





    router.get("/edit", (req, res) => {
        var product_id = req.query.product_id;
        var product_nav_title = req.query.product_nav_title;
        db.query(`UPDATE data_product SET product_nav_title = '${product_nav_title}' \
            WHERE product_id = '${product_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                res.status(200).send({ msg: "修改成功" }).end();
            }
        })
    })
    router.get("/hide", (req, res) => {
        var product_id = req.query.product_id;
        db.query(`UPDATE data_product SET on_nav = 0 \
            WHERE product_id = '${product_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                res.status(200).send({ msg: "修改成功" }).end();
            }
        })
    })
    router.get("/show", (req, res) => {
        var product_id = req.query.product_id;
        db.query(`UPDATE data_product SET on_nav = 1 \
            WHERE product_id = '${product_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                res.status(200).send({ msg: "修改成功" }).end();
            }
        })
    })
    router.get("/newItem", (req, res) => {
        var type2_id = req.query.type2_id;
        var product_nav_title = "";
        res.render('admingly/web/admin_center.ejs', {
            product_nav_title: product_nav_title,
            type: "newItem",
            nav,
            menu,
            content: "hss_nav_detail",
            type2_id: type2_id,
            menuClick: 2,
            itemClick: 0
        });
    })
    router.get("/changeHss", (req, res) => {
        var type2_id = req.query.type2_id;
        var product_id = req.query.product_id;
        var product_nav_title = req.query.product_nav_title;
        res.render('admingly/web/admin_center.ejs', {
            type: "changeHss",
            nav,
            menu,
            content: "hss_nav_detail",
            product_id: product_id,
            product_nav_title: product_nav_title,
            menuClick: 2,
            itemClick: 0
        });
    })

    router.get("/allItems", (req, res) => {
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT * FROM data_product, view_nav_hss_type2 WHERE data_product.subtype_id = view_nav_hss_type2.ID`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {};
                    item = {
                        i: i,
                        product_id: data[i].product_id,
                        product_title: data[i].product_title,
                        product_cpu: data[i].product_cpu,
                        product_memory: data[i].product_memory,
                       
                        product_ddos: data[i].product_ddos,
                        product_describe: data[i].product_describe,
                        product_defensemode: data[i].product_defensemode,
                        product_ipaddress: data[i].product_ipaddress,
                        product_flowdefense: data[i].product_flowdefense,
                        product_price: data[i].product_price,
                        product_config: data[i].product_config,
                        product_bandwidth: data[i].product_bandwidth,
                        product_circuit: data[i].product_circuit,
                        product_manage: data[i].product_manage,
                        product_washmode: data[i].product_washmode,
                        product_netstructure: data[i].product_netstructure,
                        product_techsupport: data[i].product_techsupport,
                        product_chargemode: data[i].product_chargemode,
                        product_attacksource: data[i].product_attacksource,
                        product_applyto: data[i].product_applyto,
                        product_netstructure: data[i].product_netstructure,
                        subtype_id: data[i].subtype_id,
                        subtype_name: data[i].type2
                    }
                    array.push(item);
                }
                arraySlice = array.slice(start, end);
                var allItems = {
                    code: 0,
                    msg: "",
                    count: array.length,
                    data: arraySlice
                }

                res.status(200).send(JSON.stringify(allItems)).end();
            }
        })
    })
    return router;
}