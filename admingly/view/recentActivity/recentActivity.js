const express = require('express');
const common = require('../../../../libs/common');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');
const pathLib = require('path');

const db = common.db();

module.exports = function() {
    var router = express.Router();

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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "recentActivity", menuClick: 3, itemClick: 0 });
            });

        }
    });

    router.post("/editBasic", urlencodedParser, (req, res) => {
        if (req.files[0] && req.files[1]) {
            var ext = pathLib.parse(req.files[0].originalname).ext;
            var oldPath = req.files[0].path;
            var newPath = "static/upload/recentActivity/" + req.files[0].filename + ext;
            var newFileName = "/upload/recentActivity/" + req.files[0].filename + ext;

            var ext_t = pathLib.parse(req.files[1].originalname).ext;
            var oldPath_t = req.files[1].path;
            var newPath_t = "static/upload/recentActivity/" + req.files[1].filename + ext;
            var newFileName_t = "/upload/recentActivity/" + req.files[1].filename + ext;

            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    console.error(err);
                    res.redirect('/error');//res.status(500).send('file operation error').end();
                } else {
                    fs.rename(oldPath_t, newPath_t, (err) => {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');//res.status(500).send('file operation error').end();
                        } else {
                            db.query(`UPDATE view_recentactivity_basicinfo SET topImg = '${newFileName}',\
                                        buttonRules = '${req.body.buttonRules}', \
                                        titleImg = '${newFileName_t}'`, (err, data) => {
                                if (err) {
                                    res.redirect('/error');//res.status(500).send("database error").end();
                                    console.log("err:" + err);
                                } else {
                                    res.status(200).send({ msg: "修改成功" }).end();
                                }
                            })
                        }
                    })
                }
            })
        } else {
            res.status(200).send({ msg: "修改失败" }).end();
        }
    })

    router.get("/basicInfo", (req, res) => {
        db.query(`SELECT * FROM view_recentactivity_basicinfo`, (err, data) => {
            if (err) {
                res.redirect('/error');//res.status(500).send("database error").end();
                console.log("err:" + err);
            } else {

            if (common.debugData(data)) {
                var item = {};
                item = {
                    topImg: data[0].topImg,
                    titleImg: data[0].titleImg,
                    buttonRules: data[0].buttonRules
                }
                res.status(200).send({ data: JSON.stringify(item) }).end();
                } else {
                        res.redirect('/error');
                    }
            }
            
        })
    });

    router.get("/nav", (req, res) => {
        db.query(`SELECT * FROM view_recentactivity_type`, (err, data) => {
            if (err) {
                res.redirect('/error');//res.status(500).send("database error").end();
                console.log("err:" + err);
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {};
                    item = {
                        recentActivity_type_id: data[i].recentActivity_type_id,
                        name: data[i].name
                    }
                    array.push(item);
                }
                res.status(200).send({ data: JSON.stringify(array) }).end();
            }
        })
    });

    router.get("/items", (req, res) => {
        console.log(req.query.recentActivity_type_id);
        db.query(`SELECT * FROM view_recentactivity,data_product \
            WHERE view_recentactivity.recentActivity_type_id = '${req.query.recentActivity_type_id}'\
             AND data_product.product_id = view_recentactivity.product_id`, (err, data) => {
            if (err) {
                res.redirect('/error');//res.status(500).send("database error").end();
                console.log("err:" + err);
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {};
                    if (data[i].showInPage != null) {
                        var showInPage = data[i].showInPage.split(",");
                        var showInPageName = [];

                        var names = ["cpu", "内存", "端口", "ddos防护", "描述", "防护模式",
                            "流量防护", "配置", "带宽", "线路", "产品管理", "清洗模式", "网络结构",
                            "技术支持", "收费模式", "攻击溯源", "适合"
                        ];

                        var values = ["product_cpu", "product_memory", "product_port",
                            "product_sddos", "product_sdescribe", "product_sdefensemode",
                            "product_flowdefense", "product_config", "product_bandwidth",
                            "product_circuit", "product_manage", "product_washmode",
                            "product_netstructure", "product_techsupport", "product_chargemode",
                            "product_attacksource", "product_applyto"
                        ];

                        for (var b = 0; b < values.length; b++) {
                            for (var a = 0; a < showInPage.length; a++) {
                                if (values[b] == showInPage[a]) {
                                    showInPageName.push(names[b]);
                                }
                            }
                        }
                    }else{
                        var showInPage = [];
                        var showInPageName = [];
                    }

                    item = {
                        recentActivity_id: data[i].recentActivity_id,
                        recentActivity_type_id: data[i].recentActivity_type_id,
                        product_id: data[i].product_id,
                        product_title: data[i].product_title,
                        name: data[i].name,
                        intro: data[i].intro,
                        price_1: data[i].price_1,
                        price_2: data[i].price_2,
                        price_3: data[i].price_3,
                        showInPage: showInPage,
                        showInPageName: showInPageName
                    }
                    array.push(item);
                }
                res.status(200).send({ data: JSON.stringify(array) }).end();
            }
        })
    });

    router.get("/delNav", (req, res) => {
        var recentActivity_type_id = req.query.recentActivity_type_id;
        db.query(`DELETE FROM view_recentactivity_type WHERE recentActivity_type_id = '${recentActivity_type_id}'`, (err, data) => {
            if (err) {
                res.redirect('/error');//res.status(500).send("database error").end();
                console.log("err:" + err);
            } else {
                res.status(200).send({ msg: "删除成功" }).end()
            }
        })
    })

    router.get("/delItem", (req, res) => {
        var recentActivity_id = req.query.recentActivity_id;
        db.query(`DELETE FROM view_recentactivity WHERE recentActivity_id = '${recentActivity_id}'`, (err, data) => {
            if (err) {
                res.redirect('/error');//res.status(500).send("database error").end();
                console.log("err:" + err);
            } else {
                res.status(200).send({ msg: "删除成功" }).end()
            }
        })
    })

    router.get("/editItem", (req, res) => {
        var recentActivity_id = req.query.recentActivity_id;
        var name = req.query.name;
        var intro = req.query.intro;
        var price_1 = req.query.price_1;
        var price_2 = req.query.price_2;
        var price_3 = req.query.price_3;
        var product_id = req.query.product;
        var showInPage = req.query.showInPage;
        //console.log(showInPage);
        db.query(`UPDATE view_recentactivity SET name = '${name}', intro = '${intro}', \
            product_id='${product_id}', price_1='${price_1}', \
            price_2='${price_2}', price_3='${price_3}', \
            showInPage='${showInPage}' WHERE recentActivity_id = '${recentActivity_id}'`, (err, data) => {
            if (err) {
                res.redirect('/error');//res.status(500).send("database error").end();
                console.log("err:" + err);
            } else {
                res.status(200).send({ msg: "修改成功" }).end()
            }
        })
    })

    router.get("/newItem", (req, res) => {
        var recentActivity_type_id = req.query.recentActivity_type_id;
        var name = req.query.title;
        var intro = req.query.intro;
        var price_1 = req.query.price_1;
        var price_2 = req.query.price_2;
        var price_3 = req.query.price_3;
        var product_id = req.query.product;
        db.query(`INSERT INTO view_recentactivity VALUES(replace(UUID(),'-',''),'${recentActivity_type_id}',\
            '${product_id}','${name}','${intro}','${price_1}','${price_2}','${price_3}',null)`, (err, data) => {
            if (err) {
                res.redirect('/error');//res.status(500).send("database error").end();
                console.log("err:" + err);
            } else {
                res.status(200).send({ msg: "修改成功" }).end()
            }
        })
    })

    router.get("/editNav", (req, res) => {
        var recentActivity_type_id = req.query.recentActivity_type_id;
        var name = req.query.name;
        db.query(`UPDATE view_recentactivity_type SET name = '${name}' \
            WHERE recentActivity_type_id = '${recentActivity_type_id}'`, (err, data) => {
            if (err) {
                res.redirect('/error');//res.status(500).send("database error").end();
                console.log("err:" + err);
            } else {
                res.status(200).send({ msg: "修改成功" }).end()
            }
        })
    })

    router.get("/newType", (req, res) => {
        var typeName = req.query.typeName;
        db.query(`INSERT INTO view_recentactivity_type \
            VALUES (replace(UUID(),'-',''),'${typeName}')`, (err, data) => {
            if (err) {
                res.redirect('/error');//res.status(500).send("database error").end();
                console.log("err:" + err);
            } else {
                res.status(200).send({ msg: "修改成功" }).end()
            }
        })
    })

    router.get("/getProductList", (req, res) => {
        var id = req.query.id;
        res.render('admingly/web/pop_getProductList.ejs', { id: id });
    })

    router.get("/showInPage", (req, res) => {
        var product_id = req.query.product_id;
        var showInPage = req.query.showInPage;
        var recentActivity_id = req.query.recentActivity_id;
        var array = showInPage.split(",");
        var showInPageName = [];

        var names = ["cpu", "内存", "ddos防护", "描述", "防护模式",
            "流量防护", "配置", "带宽", "线路", "产品管理", "清洗模式", "网络结构",
            "技术支持", "收费模式", "攻击溯源", "适合"
        ];

        var values = ["product_cpu", "product_memory", 
            "product_ddos", "product_describe", "product_defensemode",
            "product_flowdefense", "product_config", "product_bandwidth",
            "product_circuit", "product_manage", "product_washmode",
            "product_netstructure", "product_techsupport", "product_chargemode",
            "product_attacksource", "product_applyto"
        ];

        for (var i = 0; i < values.length; i++) {
            for (var a = 0; a < array.length; a++) {
                if (values[i] == array[a]) {
                    showInPageName.push(names[i]);
                }
            }
        }

        res.render('admingly/web/pop_showInPage.ejs', {
            recentActivity_id: recentActivity_id,
            product_id: product_id,
            showInPage: showInPageName
        });
    })

    router.get("/showList", (req, res) => {
        // var page = req.query.page;
        // var limit = req.query.limit;
        // var start = (page - 1) * limit;
        // var end = page * limit;
        var product_id = req.query.product_id;
        db.query(`SELECT * FROM data_product WHERE product_id = '${product_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {

                    if (common.debugData(data)) {
                        var array = [];
                var names = ["cpu", "内存", "端口", "ddos防护", "描述", "防护模式",
                    "流量防护", "配置", "带宽", "线路", "产品管理", "清洗模式", "网络结构",
                    "技术支持", "收费模式", "攻击溯源", "适合"
                ];
                var names_eng = ["product_cpu", "product_memory", "product_port",
                    "product_sddos", "product_sdescribe", "product_sdefensemode",
                    "product_flowdefense", "product_config", "product_bandwidth",
                    "product_circuit", "product_manage", "product_washmode",
                    "product_netstructure", "product_techsupport", "product_chargemode",
                    "product_attacksource", "product_applyto"
                ];
                var values = [data[0].product_cpu, data[0].product_memory, data[0].product_port,
                    data[0].product_sddos, data[0].product_sdescribe, data[0].product_sdefensemode,
                    data[0].product_flowdefense, data[0].product_config, data[0].product_bandwidth,
                    data[0].product_circuit, data[0].product_manage, data[0].product_washmode,
                    data[0].product_netstructure, data[0].product_techsupport, data[0].product_chargemode,
                    data[0].product_attacksource, data[0].product_applyto
                ];

                for (var i = 0; i < names.length; i++) {
                    var item = {
                        i: i + 1,
                        name: names[i],
                        name_eng: names_eng[i],
                        value: values[i]
                    }
                    array.push(item);
                }

                // arraySlice = array.slice(start, end);
                var showList = {
                    code: 0,
                    msg: "",
                    count: array.length,
                    data: array
                }
                res.status(200).send(JSON.stringify(showList)).end();
            } else {
                        res.redirect('/error');
                    }

                
            }
        })
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
                        i: i + 1,
                        product_id: data[i].product_id,
                        product_title: data[i].product_title,
                        product_cpu: data[i].product_cpu,
                        product_memory: data[i].product_memory,
                        product_ddos: data[i].product_ddos,
                        product_describe: data[i].product_describe,
                        product_defensemode: data[i].product_defensemode,
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