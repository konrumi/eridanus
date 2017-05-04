const $ = require('jquery');
const ejs = require('ejs');

let pageTpl = {
    imgItem: ejs.compile($('#imgItem').html(), null),
    layerItem: ejs.compile($('#layerItem').html(), null)
};

let pageEle = {
    imgList: $('#imgList'),
    layerList: $('#layerList')
};

let pageData = {
    radarData: []
};

function getPageData() {
    return new Promise((resolve) => {
        $.ajax({
            url: 'http://www.nmc.cn/publish/radar/daxing.html',
            data: {
                _t: (new Date()).getTime()
            }
        }).done((res) => {
            let docHtml = res.match(/<body>[\s\S\t\r\n]*<\/body>/g)[0].replace(/<body>|<\/body>/g, '');
            let docEle = document.createElement('div');
            let docFrag = new DocumentFragment();

            docEle.innerHTML = docHtml;
            docFrag.appendChild(docEle);
            docFrag = $(docFrag);

            // write radar data
            pageData.radarData = (() => {
                let result = [];
                let list = docFrag.find('#mycarousel').find('li');
                $.each(list, (idx, ele) => {
                    let $ele = $(ele);
                    result.push({
                        index: list.length - idx,
                        time: $ele.find('.time').text(),
                        img: $ele.find('img').attr('data-original').replace(/small/g, 'medium')
                    });
                });
                return result;
            })();

            resolve();
        });
    });
}

function renderPage() {
    getPageData().then(() => {
        // render image list
        pageEle.imgList.html(
            (() => {
                let result = '';
                pageData.radarData.forEach((data) => {
                    result += pageTpl.imgItem(data);
                });
                return result;
            })()
        );

        // render layer list
        pageEle.layerList.html(
            (() => {
                let result = '';
                pageData.radarData.forEach((data) => {
                    result += pageTpl.layerItem(data);
                });
                return result;
            })()
        );
    });
}

function initPage() {
    // event handler init

    //- layer interactive
    pageEle.layerList.on('mouseenter', '.mainwrap-layeritem', function() {
        let $ele = $(this);

        // active layer
        pageEle.layerList.find('.active').removeClass('active');
        $ele.addClass('active');

        // active image
        pageEle.imgList.find('.active').removeClass('active');
        pageEle.imgList.find('[data-index="' + $ele.attr('data-index') + '"]').addClass('active');
    });

    // render page data
    renderPage();
}

initPage();

