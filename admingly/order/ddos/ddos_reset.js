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
                db.query(`SELECT * FROM view_order_ddos where order_id='${order_id}'`, (err, data) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');
                        
                    } else {
                        if (common.debugData(data)) {
                            
                                
                                if (data[0].order_end != null) {
                                    data[0].order_end = moment(data[0].order_end).format('YYYY-MM-DD');
                                }
                            
                            res.render('admingly/web/admin_center.ejs', {data, nav, menu, content: "ddos_ip_reset", menuClick: 0, itemClick: 1 });
                        } else {
                            res.redirect('/error');
                        }
                    }
                });
            });

            router.post('/update', urlencodedParser, function(req, res) {
                var data = JSON.parse(req.body.data);
                var order_id=data.order_id;
                var ip = data.order_ip;
                var source = data.source;
                var endtime = data.endtime;             
                var buyer_phone = data.buyer_phone;
                var buyer = data.buyer_id;
                var change_time = data.change_time;             
                var change_ip = data.change_ip;
                var change_source = data.change_source;
                endtime+=" 23:59:59";

                async.series({
                one: function(callback){
                    db.query(`UPDATE order_ddos SET ip='${ip}',\
                    endtime='${endtime}',\
                    source='${source}'\
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
                    '/center/ddos/detail?id=${order_id}',\
                    '您的DDos高防IP布署情况已修改',\
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

                        var detail='修改DDos高防IP布署情况'+change_ip+change_source+change_time;
                        common.log_admin(req.session['admin_id'],'修改DDos高防IP布署情况',detail);
                        
                        res.status(200).send({ msg: "修改成功" }).end();
                        // var info = 
                        // {
                        //     type: "user_deploy",
                        //     telephone: buyer_phone,
                        //     content:{
                        //         type: "高防服务器", 
                        //     }
                        // }
                        //common.info(info);

                        //console.log("info");
                        
                    }
                });
             });
            
        


        }
    });

    return router;
}