const express = require('express');
const fs = require('fs');
const common = require('../../../libs/common');
const async =require('async');

var db = common.db();
module.exports = function() {
    var router = express.Router();

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
              
            async.parallel([
            function(callback){
                switch (req.query.act) {
                case 'mod':
                    db.query(`SELECT * FROM data_product WHERE product_id='${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.error(err);
                                callback('database error',null);
                            } else {
                                if (common.debugData(data)) {
                                    data[0].type = 'mod';
                                    //res.render('admingly/components/product/product_hss_view.ejs', { data });
                                   callback(null,data);
                                } else {
                                    callback('data not find',null);
                                }
                            }
                        });
                break;
                case 'new':
                    var data = [{
                            type: 'insert',
                            product_id: 0
                        }];
                    callback(null,data);
                break;
                default:callback(null,null);break;
                }
            }, 
            function(callback){
                db.query(`SELECT * FROM view_nav_hss_type2`, (err, data1) => {
                    if (err) {
                        console.error(err);
                        callback('database error',null);
                    } else {
                        
                        callback(null,data1);
                    }
                });
            },
            function(callback){
                db.query(`SELECT * FROM view_hss_type`, (err, data2) => {
                    if (err) {
                        console.error(err);
                        callback('database error',null);
                    } else {
                        callback(null,data2);
                    }
                });
            },
            function(callback){
                db.query(`SELECT * FROM data_machineroom`, (err, data3) => {
                    if (err) {
                        console.error(err);
                        callback('database error',null);
                    } else {
                        callback(null,data3);
                    }
                });
            }],
            function(err, results){
                    
                if(err==null){
                    data=results[0];
                    data1=results[1];
                    data2=results[2];
                    data3=results[3];
                switch (req.query.act) {
                case 'mod':
                res.render('admingly/web/admin_center.ejs', { nav, menu, data, content: "product_hss_detail",menuClick: 0, itemClick: 0 });
                break;
                case 'new':
                res.render('admingly/web/admin_center.ejs', { nav, menu, data, content: "product_hss_new",menuClick: 0, itemClick: 0 });
                break;
                default:res.redirect('/error');break;    
                    }
                }   
                    else{res.redirect('/error');}
                    
                });
            });
        }
    });
    return router;
}