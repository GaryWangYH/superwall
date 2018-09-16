const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const moment =  require('moment');
const async = require('async');
const db = common.db();
const bodyParser = require('body-parser');

module.exports = function() {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });
    router.use("/record", require('./record.js')());

    var menu = {};
    var nav = {};
    var limitend = 0; //窗口右,页数范围
    var limitbegin = 0; //窗口左,窗口大小最大为十
    var limitlength = 500; //数据库一次搜索长度,limit*5
    var storedata = new Array(); //存放千条数据,limit*10
    var count = 0;
	var oldtype=-2;
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
            router.get('/', (req, res) => {
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "order_elastic", menuClick: 0, itemClick: 2 })
            });
        }
    });

    router.get('/data', (req, res) => {
        var page = req.query.page;
        var limit = req.query.limit;

        var range = req.query.range;
        var array = range.split("~");
        var left = array[0].trim() + ' 00:00:00';
        var right = array[1].trim() + ' 23:59:59';
        var start; // 
        var end; // 
        var begin; //数据库开始位置
        var querystring;
        var type = req.query.type; //日期变更重新加载
        var admin_name = req.query.admin_name;
        var user_name = req.query.user_name;
        
        if(type!=oldtype)           //日期变更
        {   
            limitend=0;  
            limitbegin=0; 
            oldtype=type;
        }
        if(page==1&&type==-1)           //无换页
        {   
            limitend=0;  
            limitbegin=0; 
        }
        if (page > limitend) { //需要新增数据
            limitend = parseInt((page - 1) / 5) * 5 + 5; //窗口右移
            if (limitend <= limitbegin + 15) limitbegin = limitend - 10; //窗口右移 
            else limitbegin = limitend - 5; //窗口右移        
            begin = (limitend - 5) * limit;
        } else if (page <= limitbegin) {
            limitbegin = parseInt((page - 1) / 5) * 5; //窗口左移
            if (limitend <= limitbegin + 15) limitend = limitbegin + 10; //窗口左移 
            else limitend = limitbegin + 5; //窗口左移    
            begin = limitbegin * limit;
        } else {

            start = parseInt((page - 1) % 10 * limit);
            end = parseInt(start) + parseInt(limit);

            if (page * limit > count) end = start + count % limit;

            var arraySlice = storedata.slice(start, end);
            var allItems = {
                code: 0,
                msg: "",
                count: count,
                data: arraySlice
            }
            res.status(200).send(JSON.stringify(allItems)).end();
            return;
        }

        db.query(`SELECT permission_role_id FROM admin WHERE admin_id = '${req.session['admin_id']}'`, (err, data1) => {
            if (err) {
                console.log(err);
               res.redirect('/error');
                    // res.status(500).send('database error').end();
            } else {

                if (common.debugData(data1)) {
                        var isclerk = ' ';
                if (data1[0].permission_role_id == "1004") {
                    isclerk = `and admin_id= '${req.session['admin_id']}' `;
                    query = `SELECT id,ip,duration,buildTime,deliveryTime,endTime,user_qq,user_name,\ 
                    admin_name,status_name FROM view_order_elastic WHERE buildTime BETWEEN '${left}' AND '${right}' 
                    and admin_id='${req.session['admin_id']}'`;
                } else {
                    query = `SELECT id,ip,duration,buildTime,deliveryTime,endTime,user_qq,user_name,\ 
                    admin_name,status_name FROM view_order_elastic WHERE buildTime BETWEEN '${left}' AND '${right}' `;
                }
                if (req.query.admin_name ) {
                    query += ` AND (admin_name = '${admin_name}')`;
                    isclerk += ` AND (admin_name = '${admin_name}')`;
                }
                if (req.query.user_name ) {
                    query += ` AND ( user_name = '${user_name}')`;
                    isclerk += ` AND ( user_name = '${user_name}')`;
                }
                if (req.query.ip) {
                    query += ` AND (ip = '${req.query.ip}')`;
                    isclerk += ` AND (ip = '${req.query.ip}')`;
                }
                query += ` order by buildTime desc limit ${begin},${limitlength}`;
                db.query(`SELECT COUNT(1) as count FROM view_order_elastic where buildTime BETWEEN '${left}' AND '${right}' ${isclerk} `, (err, data3) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                        count = data3[0].count;
                        db.query(query, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                var flag = (page - 1) % 10 > 4 ? 5 * limit : 0; //改变数据的前五百十还是后五百十
                                for (var i = 0; i < data.length; i++) {
                                    data[i].index = i + 1 + begin;
                                    data[i].duration=data[i].duration+"个月";
                                    data[i].buildTime = moment(data[i].buildTime).format('YYYY-MM-DD HH:mm:ss');
                                    if (data[i].deliveryTime == null) {
                                        data[i].deliveryTime = ""
                                    } else {
                                        data[i].deliveryTime = moment(data[i].deliveryTime).format('YYYY-MM-DD HH:mm:ss')
                                    }
                                    if (data[i].endTime == null) {
                                        data[i].endTime = ""
                                    } else {
                                        data[i].endTime = moment(data[i].endTime).format('YYYY-MM-DD HH:mm:ss')
                                    }
                                    storedata[i + flag] = data[i];
                                }
                                start = parseInt((page - 1) % 10 * limit);
                                end = parseInt(start) + parseInt(limit);
                                if (page * limit > count) end = start + count % limit;
                                var arraySlice = storedata.slice(start, end);
                                var allItems = {
                                    code: 0,
                                    msg: "",
                                    count: count,
                                    data: arraySlice
                                }

                                res.status(200).send(JSON.stringify(allItems)).end();
                            }
                        })
                    }
                });
            } else {
                        res.redirect('/error');
                    }
            }
        })
    });

    router.post("/delivery", urlencodedParser,(req, res) => {
        var order_elastic_id = req.body.order_elastic_id;
        var user_id = req.body.user_id;
        var duration = req.body.duration;
        var telephone=req.body.phone;
        var ip = req.body.ip;
        var strAuthorityPork = req.body.strAuthorityPork;
            duration = parseInt(duration);
                db.query(`UPDATE order_elastic SET status = 1002,\
                    deliveryTime = '${moment().format('YYYY-MM-DD HH:mm:ss')}',\
                    endTime = '${moment().add(duration, 'months').format('YYYY-MM-DD HH:mm:ss')}',\
                    ip = '${ip}',\
                    strAuthorityPork = '${strAuthorityPork}' WHERE order_elastic_id = '${order_elastic_id}'`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                        db.query(`INSERT INTO info_user VALUES(\
                                replace(UUID(),'-',''),\
                                '${user_id}',\
                                '/center/elastic/detail?id=${order_elastic_id}',\
                                '您有一个弹性防护服务器已交付',\
                                '1001',\
                                '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                                null\
                                )`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');
                            }
                            else{
                                var info = {
                                    type: "user_deploy",
                                    telephone: telephone,
                                    content:{
                                        type: "弹性防护",
                                        deliveryTime: moment().format("YYYY-MM-DD HH:mm:ss"),
                                        endTime: moment().add(duration, 'months').format('YYYY-MM-DD HH:mm:ss')
                                        }
                                    }
                                common.info(info);
                                res.status(200).send({ msg: "交付成功" }).end();
                            }
                        });    
                    }
                })         
            })

    router.post("/cancel", urlencodedParser, (req, res) => {
        var order_elastic_id = req.body.order_elastic_id;
        var total = req.body.total;
        var user_id = req.body.user_id;

        db.query(`CALL proc_refund_elastic_cancel ('${order_elastic_id}','${user_id}',${total},'${moment().format("YYYY-MM-DD HH:mm:ss")}',@status);`, function(err, rows, fields) {
            if (err) {
                console.error(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var status = rows[1][0].result;
                if (status == 1) {
                    res.status(200).send({ msg: "退款成功" }).end();
                } else { res.status(200).send({ msg: "退款失败" }).end(); }
            }

        });
    })

    

    return router;
}