const express = require('express');
const common = require('../../../../libs/common');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');
const uuid = require('node-uuid');

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
                db.query(`SELECT * FROM elastic_charge WHERE status = 1`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {

                        if (common.debugData(data)) {
                        var item = {};
                        item = {
                            id: data[0].id,
                            basic_price: data[0].basic_price,
                            item_ids: data[0].item_ids,
                            lastMod: moment(data[0].lastMod).format("YYYY年MM月DD日")
                        }
                        var item_ids = data[0].item_ids.split(',');
                        query = 'SELECT * FROM elastic_charge_item '
                        for (var i = 0; i < item_ids.length; i++) {
                            if (i == 0) {
                                query += "WHERE item_id = '" + item_ids[i] + "'";
                            } else {
                                query += " OR item_id = '" + item_ids[i] + "'";
                            }
                        }
                        query += ' ORDER BY min ASC'
                        db.query(query, (err, data1) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                var array = []
                                for (var i = 0; i < data1.length; i++) {
                                    var item1 = {}
                                    item1 = {
                                        item_id: data1[i].item_id,
                                        max: data1[i].max,
                                        min: data1[i].min,
                                        price: data1[i].price
                                    }
                                    array.push(item1);
                                }
                                item.items = array;
                                res.render('admingly/web/admin_center.ejs', { data: item, nav, menu, content: "product_elastic", menuClick: 0, itemClick: 2 })
                            }
                        })
                    } else {
                        res.redirect('/error');
                    }

                        
                    }
                })
            });
        }
    });

    router.post('/new',urlencodedParser, (req, res) => {
        var min = req.body.min;
        var max = req.body.max;
        var price = req.body.price;
        var id = req.body.id;
        var item_ids = req.body.item_ids;
        var item_id = uuid.v1().toString().replace(/-/g, '')
        item_ids += "," + item_id;
        db.query(`INSERT INTO elastic_charge_item VALUES('${item_id}',${max},${min},${price})`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                db.query(`UPDATE elastic_charge SET item_ids = '${item_ids}',lastMod = '${moment().format('YYYY-MM-DD HH:mm:ss')}' WHERE id = '${id}'`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {

                        //** 添加日志 **
                        common.log_admin(req.session['admin_id'],"新增一条弹性防护收费标准",
                            `新增弹性防护收费标准,流量上限${max}G,下限${min}G,收费${price}元)`);

                        res.status(200).send({ msg: '新建成功' }).end();
                    }
                })
            }
        })
    })

    router.post('/editBasicPrice',urlencodedParser, (req, res) => {
        var price = req.body.price;
        var id = req.body.id;
        var change = req.body.change;
        db.query(`UPDATE elastic_charge SET basic_price = '${price}',lastMod = '${moment().format('YYYY-MM-DD HH:mm:ss')}' WHERE id = '${id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"修改弹性防护基本信息",
                    `修改弹性防护基本信息`);

                res.status(200).send({ msg: '修改成功' }).end();
            }
        })
    })

    router.post('/deleteItem',urlencodedParser, (req, res) => {
        var id = req.body.id;
        var item_id = req.body.item_id;
        var item_ids = req.body.item_ids;
        item_ids_arr = item_ids.split(',');
        var item_ids_mod = '';
        for (var i = 0; i < item_ids_arr.length; i++) {
            if (item_ids_arr[i] != item_id) {
                if (i == 0) {
                    item_ids_mod += item_ids_arr[i];
                }else{
                    item_ids_mod += ',' + item_ids_arr[i];
                }
            }
        }
        db.query(`UPDATE elastic_charge SET item_ids = '${item_ids_mod}',lastMod = '${moment().format('YYYY-MM-DD HH:mm:ss')}' WHERE id = '${id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"删除一条弹性防护收费标准",
                    `删除一条弹性防护收费标准`)

                res.status(200).send({ msg: '删除成功' }).end();
            }
        })
    })

    return router;
}