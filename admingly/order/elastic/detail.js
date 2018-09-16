const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const moment = require('moment');
const async = require('async');
const db = common.db();
const bodyParser = require('body-parser');

module.exports = function() {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });
    var menu = {};
    var nav = {};

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
        router.get("/", (req, res) => {
        var order_id = req.query.id;
        var sqlstring = `SELECT id,duration,buildTime,deliveryTime,endTime,admin_qq,user_phone,user_name,user_id,\ 
                    admin_name,status_name,status_id,ip,charge_id,os,account,password FROM view_order_elastic WHERE id='${order_id}'`;

        async.waterfall([
            function(callback){
               db.query(sqlstring, (err, data) => {
                if (err) {
                callback(err, null);
                } else {
                if (common.debugData(data)) {
                    data[0].buildTime = moment(data[0].buildTime).format('YYYY-MM-DD HH:mm:ss');
                    if (data[0].deliveryTime == null) {
                        data[0].deliveryTime = ""
                    } else {
                        data[0].deliveryTime = moment(data[0].deliveryTime).format('YYYY-MM-DD HH:mm:ss')
                    }
                    if (data[0].endTime == null) {
                        data[0].endTime = ""
                    } else {
                        data[0].endTime = moment(data[0].endTime).format('YYYY-MM-DD HH:mm:ss')
                    } 
                    callback(null,data);
                    } else {
                    res.redirect('/error');return;
                    }
                    }
                });
            },
            function(data,callback){
                db.query(`SELECT * FROM elastic_charge WHERE status = 1 AND id='${data[0].charge_id}'`, (err, data1) => {
                        if (err) {
                           callback(err, null);
                        } else {
                            if (common.debugData(data1)) {
                        var item = {};
                            item = {
                                id: data1[0].id,
                                basic_price: data1[0].basic_price,
                                item_ids: data1[0].item_ids,
                                lastMod: moment(data1[0].lastMod).format("YYYY年MM月DD日")
                            }
                            var item_ids = data1[0].item_ids.split(',');
                            query = 'SELECT * FROM elastic_charge_item ';
                            for (var i = 0; i < item_ids.length; i++) {
                                if (i == 0) {
                                    query += "WHERE item_id = '" + item_ids[i] + "'";
                                } else {
                                    query += " OR item_id = '" + item_ids[i] + "'";
                                }
                            }
                            query += ' ORDER BY min ASC';
                            callback(null,item,data);
                            }else {res.redirect('/error');return;}
                    }
                });
            },
            function(item,data,callback){
                db.query(query, (err, data2) => {
                                if (err) {
                                    console.log(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {
                                    var array = []
                                    for (var i = 0; i < data2.length; i++) {
                                        var item1 = {}
                                        item1 = {
                                            item_id: data2[i].item_id,
                                            max: data2[i].max,
                                            min: data2[i].min,
                                            price: data2[i].price
                                        }
                                        array.push(item1);
                                    }
                                    item.items = array;
                                    callback(null, item,data);
                                    }
                            })
            }
            ],function(err, item,data) {                               
                if (err) {
                    console.log(err);
                    res.redirect('/error');
                }else{
                    // console.log(item);
                    //console.log(data);
                    res.render('admingly/web/admin_center.ejs', {id:order_id, charge: item, data, nav, menu, content: "order_elastic_detail", menuClick: 0, itemClick: 2 });
                }
            });
    	})
    	}
	});

	router.get('/data10', (req, res) => {
        var order_id = req.query.id;
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT renew_id,order_id,duration,amount,ip,status,admin_id FROM view_renew_elastic\
            WHERE order_id='${order_id}' `, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {}
                    item = {
                        id:data[i].renew_id,
                        index: i + 1,
                        ip:data[i].ip,
                        duration1: data[i].duration+"个月",
                        amount: data[i].amount+"元",
                        duration:data[i].duration,
                        buildtime: moment(data[i].buildtime).format('YYYY-MM-DD HH:mm'),
                        status:data[i].status,
                        order_id:data[i].order_id,
                        clerk_id:data[i].admin_id
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

        router.post('/renewal', urlencodedParser, function(req, res) {
            var renew_id = req.query.id;
            var order_id = req.body.order_id;
            var duration = req.body.duration;
            var clerk_id = req.session['admin_id'];
            
            db.query(`SELECT * from view_order_elastic where id='${order_id}'`, (err, data) => {
                if (common.debugData(data)) {

                    var schedule = data[0].schedule;
                    var endtime=data[0].endTime;
                    if(schedule==1){endtime=moment(endtime).add(duration*30,'days').format('YYYY-MM-DD HH:mm:ss');}
                    else if(schedule==0){endtime=moment().add(duration*30,'days').format('YYYY-MM-DD HH:mm:ss');}
                    duration=parseInt(duration)+parseInt(data[0].duration);

                    var message = '续费成功，弹性防护的时间延长'+duration+'个月';
                
                db.query(`CALL proc_renew_elastic_success ('${renew_id}','${order_id}','${data[0].user_id}',${duration},'${endtime}','/admingly/order/elastic/detail?id=${order_id}','${message}','${moment().format("YYYY-MM-DD HH:mm:ss")}',@status);`, function(err, rows, fields) {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');//res.status(500).send('database error').end();
                        } else {
                        status = rows[0][0].result;
                          if (status == 1) {

                        var detail=`处理弹性防护续费，延长ip地址${ip}的防护时间${duration}个月`;
                        common.log_admin(req.session['admin_id'],'处理弹性防护续费',detail);
                        
                                // var info = {
                                //             type: "user_renew_success",
                                //             telephone: telephone,
                                //             content:{
                                //                 message: message
                                //             }
                                //         }
                                //common.info(info);
                                res.status(200).send({ msg: "操作成功" }).end();
                            } 
                            else { res.status(200).send({ msg: "操作失败" }).end(); }  
                        }
                    });
                }else {res.redirect('/error');}
            });
        });  

        return router;

}