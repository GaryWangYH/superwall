const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const mysql = require('mysql');
const bodyParser = require('body-parser');

var db = common.db();

module.exports = function(type, operation) {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    var menu = {};

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
            var nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                if (operation == "edit") {
                    db.query(`SELECT * FROM data_news WHERE news_id = '${req.query.news_id}'`, (err, data) => {
                        if (err) {
                            console.log(err);
                            res.redirect('/error');//res.status(500).send('database error').end();
                        } else {

                            if (common.debugData(data)) {
                       var detail = {};
                            detail = {
                                news_inHomePage: data[0].news_inHomePage,
                                news_title: data[0].news_title,
                                news_outline: data[0].news_outline,
                                news_main: data[0].news_main
                            }
                            res.render('admingly/web/admin_center.ejs', { news_id: req.query.news_id, operation: "edit", nav, menu, type, detail, content: "news_view", menuClick: 1, itemClick: 0 });
                        } else {
                        res.redirect('/error');
                    }
                   }
                    });
                } else {
                    var detail = {
                        type: "edit",
                        news_inHomePage: "",
                        news_title: "",
                        news_outline: "",
                        news_main: "",
                        news_inHomePage: 0,
                    }
                    res.render('admingly/web/admin_center.ejs', { news_id: 0, operation: "new", nav, menu, type, detail, content: "news_view", menuClick: 1, itemClick: 1 });
                }
            });
        }
    });

    return router;
}