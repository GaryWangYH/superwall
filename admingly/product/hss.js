const express = require('express');
const fs = require('fs');
const common = require('../../../libs/common');
const bodyParser = require('body-parser');

var db = common.db();
module.exports = function() {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });
    var menu = {};
    var hss = {};

    fs.readFile('./static/demo/hss.txt', function(err, data) {
        if (err) {
            console.log('读取失败');
        } else {
            hss = JSON.parse(data.toString());
        }
    });

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
              res.render('admingly/web/admin_center.ejs', { nav, menu, content: "product_hss", menuClick: 0, itemClick: 0 });
            });
            router.use("/detail", require('./hss_detail.js')());
            }
    });
                
        router.get('/table', function(req, res) {
            var page = req.query.page;
            var limit = req.query.limit;
            var start = (page - 1) * limit;
            var end = page * limit;
            db.query(`SELECT * FROM view_data_product_details`, (err, data) => {
                if (err) {
                    console.error(err);
                    res.redirect('/error');//res.status(500).send('database error').end();
                } else {
                    for (var i = 0; i < data.length; i++) {
                        data[i].number = i + 1;
                        data[i].show_nav = (data[i].on_nav == 1) ? '是' : '否';
                        data[i].show_room = (data[i].on_room == 1) ? '是' : '否';
                        data[i].show_index = (data[i].on_index == 1) ? '是' : '否';
                        data[i].product_price = data[i].product_price+'元';
                    }
                    var arraySlice = data.slice(start, end);

                    var allItems = {
                        code: 0,
                        msg: "",
                        count: data.length,
                        data: arraySlice
                    }

                    res.status(200).send(JSON.stringify(allItems)).end();
                }
            });
        });

        router.post("/delete",urlencodedParser, (req, res) => {
          var product_id = req.body.product_id;
          db.query(`DELETE FROM data_product WHERE product_id='${product_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {

              //** 添加日志 **
                common.log_admin(req.session['admin_id'],"删除高防服务器",
                      `删除一个高防服务器产品`)
                 res.status(200).send({ msg: "删除成功" }).end();
                }
              });
          });

            router.post("/update",urlencodedParser, (req, res) => {
              var item = JSON.parse(req.body.data);

            

                    db.query(`UPDATE data_product SET \
                      on_nav='${item.onnav}', \
                      subtype_id='${item.subtypeid}', \
                      product_title='${item.title}', \
                      product_cpu='${item.cpu}', \
                      product_memory='${item.memory}', \
                      product_harddisk='${item.harddisk}', \
                      on_room='${item.onroom}', \
                      room_id='${item.roomid}', \
                      product_flowdefense='${item.flowdefense}', \
                      product_price='${item.price}', \
                      on_index='${item.onindex}', \
                      product_typeid='${item.typeid}', \
                      product_name='${item.name}', \
                      product_bandwidth='${item.bandwidth}', \
                      product_circuit='${item.circuit}', \
                      product_manage='${item.manage}', \
                      product_washmode='${item.washmode}', \
                      product_ddos='${item.ddos}', \
                      product_defensemode='${item.defensemode}', \
                      product_describe='${item.describe}', \
                      product_netstructure='${item.netstructure}', \
                      product_techsupport='${item.techsupport}', \
                      product_chargemode='${item.chargemode}', \
                      product_attacksource='${item.attacksource}', \                
                      product_applyto='${item.applyto}' \                    
                      WHERE product_id='${item.mod_id}'`, (err) => {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');//res.status(500).send('database error').end();
                        } else {
                //** 添加日志 **
                var detail='修改高防服务器产品信息'+item.change_price+item.change_bandwidth+item.change_flowdefense ;
                common.log_admin(req.session['admin_id'],"修改高防服务器产品信息",detail);

                res.status(200).send({ msg: "修改成功" }).end();
            }
        })
    })
                      
     router.post("/insert",urlencodedParser, (req, res) => {
      var item = JSON.parse(req.body.data);
            db.query(`INSERT INTO data_product \
                  (product_id,\
                  on_nav,\
                  subtype_id,\
                  product_title,\
                  product_cpu,\
                  product_memory,\
                  product_harddisk, \             
                  on_room,\
                  room_id,\
                  product_flowdefense,\
                  product_price,\
                  on_index,\
                  product_typeid,\
                  product_name,\
                  product_bandwidth,\
                  product_circuit,\
                  product_manage,\
                  product_washmode,\
                  product_ddos,\
                  product_defensemode,\
                  product_describe,\
                  product_netstructure,\
                  product_techsupport,\
                  product_chargemode,\
                  product_attacksource,\
                  product_applyto) \
                  VALUES(replace(uuid(),'-',''),
                  '${item.onnav}',\
                '${item.subtypeid}',\
                '${item.title}', \
                '${item.cpu}', \
                '${item.memory}', \
                '${item.harddisk}', \
                '${item.onroom}', \
                '${item.roomid}', \
                '${item.flowdefense}', \
                '${item.price}', \
                '${item.onindex}', \
                '${item.typeid}', \
                '${item.name}', \
                '${item.bandwidth}', \
                '${item.circuit}', \
                '${item.manage}', \
                '${item.washmode}', \
                '${item.ddos}', \
                '${item.defensemode}', \
                '${item.describe}', \
                '${item.netstructure}', \
                '${item.techsupport}', \
                '${item.chargemode}', \
                '${item.attacksource}', \                
                '${item.applyto}' )`, (err, data) => {
              if (err) {
                  console.error(err);
                  res.redirect('/error');//res.status(500).send('database error').end();
              } else {
                //** 添加日志 **
              var detail=`新增高防服务器产品信息，带宽为${item.bandwidth}，流量防御为${item.flowdefense}，价格为${item.price}`;      
              common.log_admin(req.session['admin_id'],"新增高防服务器产品");
               res.status(200).send({ msg: "添加成功" }).end();
              }             
          });
      })
        
    return router;
}