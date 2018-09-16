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
                var order_id = req.query.id;
                db.query(`SELECT * FROM view_order_server where order_id='${order_id}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            for (var i = 0; i < data.length; i++) {
                                data[i].order_begin = moment(data[i].order_begin).format('YYYY-MM-DD HH:mm:ss');
                                if (data[i].order_deploy != null) {
                                    data[i].order_deploy = moment(data[i].order_deploy).format('YYYY-MM-DD HH:mm:ss');
                                }
                                if (data[i].order_end != null) {
                                    data[i].order_end = moment(data[i].order_end).format('YYYY-MM-DD HH:mm:ss');
                                }
                            }
                            db.query(`SELECT * FROM order_states`, (err, data1) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    res.render('admingly/web/admin_center.ejs', {id:order_id, data, data1, nav, menu, content: "order_view", menuClick: 0, itemClick: 0 });
                                }
                            });
                        } else {
                            res.redirect('/error');
                        }
                    }
                });
            });

            router.post('/delivery', urlencodedParser, function(req, res) {
                var order_id = req.body.order_id;
                var buyer_phone = req.body.buyer_phone;
                var duration = req.body.duration;
                var buyer = req.body.buyerid;
                var ip = req.body.order_ip;
                var pork = req.body.order_pork;
                async.series({
                one: function(callback){
                    db.query(`UPDATE order_server SET order_state=1002,\
                    ip='${ip}',\
                    strAuthorityPork='${pork}',\
                    order_deploydate='${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                    order_enddate='${moment().add(duration, 'months').format('YYYY-MM-DD HH:mm:ss')}' \
                    WHERE order_id='${order_id}'`, (err, data) => {
                    callback(err, null);
                    });
                },
                two: function(callback){
                    db.query(`INSERT INTO info_user \
                    (info_user_id,\
                    user_id,\
                    info_url,\
                    info_describe,\
                    info_status,\
                    buildTime)VALUES(replace(uuid(),'-',''),\
                    '${buyer}',\
                    '/center/serverRental/detail?id=${order_id}',\
                    '您的高防服务器已部署',\
                    1001,'${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data) => {
                            callback(err, null);
                        });
                    }
                },
                function(err, results) {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else
                    {
                        var info = 
                        {
                            type: "user_deploy",
                            telephone: buyer_phone,
                            content:{
                                type: "高防服务器",
                                deliveryTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                                endTime: moment().add(duration, 'months').format('YYYY-MM-DD HH:mm:ss')
                            }
                        }
                        common.info(info);

                        //console.log("info");
                        res.status(200).send({ msg: "交付成功" }).end();
                    }
                });
            });
            router.post('/changePrice', urlencodedParser, function(req, res) {
                var order_id = req.body.order_id;
                var price = req.body.price;
                var reg = /^\+?[1-9][0-9]*$/; //正数
                if (reg.test(price)) {
                    db.query(`UPDATE order_server SET order_sum=${price}\
                   WHERE order_id='${order_id}'`, (err, data) => {
                        if (err) {
                            console.log(err);
                            res.redirect('/error');//res.status(500).send('database error').end();
                        } else {
                            res.status(200).send({ msg: "修改成功" }).end();
                        }
                    });
                } else {
                    res.status(200).send({ msg: "请输入正确的数" }).end();
                }
            });

        router.get('/data10', (req, res) => {
        var order_id = req.query.id;
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT renew_id,order_id,duration,amount,ip,status,admin_id FROM view_renew_hss\
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

            db.query(`SELECT * from view_order_server where order_id='${order_id}'`, (err, data) => {
                if (common.debugData(data)) {

                    var schedule = data[0].schedule;
                    var endtime=data[0].order_end;
                    if(schedule==1){endtime=moment(endtime).add(duration*30,'days').format('YYYY-MM-DD HH:mm:ss');}
                    else if(schedule==0){endtime=moment().add(duration*30,'days').format('YYYY-MM-DD HH:mm:ss');}
                    duration=parseInt(duration)+parseInt(data[0].order_time);

                    var message = '续费成功，高防服务器的时间延长'+duration+'个月';
                db.query(`CALL proc_renew_hss_success ('${renew_id}','${order_id}','${data[0].order_buyerid}',${duration},'${endtime}','/admingly/order/hss/detail?id=${order_id}','${message}','${moment().format("YYYY-MM-DD HH:mm:ss")}',@status);`, function(err, rows, fields) {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');//res.status(500).send('database error').end();
                        } else {
                        status = rows[0][0].result;

                          if (status == 1) {
                            
                        var detail=`处理高防服务器续费，延长ip地址${ip}的防护时间${duration}个月`;
                        common.log_admin(req.session['admin_id'],'处理高防服务器续费',detail);
                        
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

        }
    });

    return router;
}