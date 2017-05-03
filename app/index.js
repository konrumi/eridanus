const $ = require('jquery');
const demo = require('./modules/demo');

console.log(demo.test('nyan'));

$.ajax({
    url: 'http://www.nmc.cn/publish/radar/daxing.html'
}).done((res) => {
    let imgElementHtml = res.match(/<img id="imgpath" alt="" src="(.+?)" .*/g)[0];
    let imgUrl = '';

    if (imgElementHtml) {
        imgUrl = imgElementHtml.replace(/^.*src="(.+?)".*$/g, '$1');
        $('#img').attr({'src': imgUrl});
    }

});