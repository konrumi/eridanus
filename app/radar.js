const $ = require('jquery');
const ejs = require('ejs');

const dateFormat = require('./modules/dateFormat');

let $body = $('body');

let pageTpl = {
    imgItem: ejs.compile($('#imgItem').html(), null),
    layerItem: ejs.compile($('#layerItem').html(), null),
    referImg: ejs.compile($('#referImg').html(), null),
    mask: ejs.compile($('#mask').html(), null)
};

let pageEle = {
    imgList: $('#imgList'),
    layerList: $('#layerList'),
    imgRefer: $('#imgRefer'),
    menuBtn: $('#menuBtn'),
    activeTime: $('#activeTime'),
    referTime: $('#referTime'),
    durationTime: $('#durationTime'),
    sidebar: $('#sidebar')
};

let pageData = {
    radarData: [],
    activeTime: null,
    referTime: null
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
                    let timeStr = $ele.find('.time').text();
                    result.push({
                        index: list.length - idx,
                        time: new Date(timeStr.replace(/(.{4})(.{2})(.{2})/g, '$1-$2-$3')),
                        img: $ele.find('img').attr('data-original').replace(/small/g, 'medium')
                    });
                });
                return result;
            })();

            resolve();
        });
    });
}

function renderTopTime(date, key) {
    // set date
    if (typeof pageData[key] !== 'undefined') {
        pageData[key] = date;
    }

    // write time
    let targetTimeNode = pageEle[key];
    if (targetTimeNode) {
        if (date === null) {
            targetTimeNode.html('');
        } else {
            targetTimeNode.html(dateFormat(date, 'yyyy-MM-dd hh:mm'))
        }
    }

    // write duration
    if (pageData.activeTime !== null && pageData.referTime !== null) {
        let durationTime = pageData.referTime - pageData.activeTime;
        pageEle.durationTime.text(durationTime / 1000 / 60 + 'm');
    }
}

function renderPage() {
    getPageData().then(() => {
        // render image list
        pageEle.imgList.html('');
        pageData.radarData.forEach((data) => {
            let targetElement = $(pageTpl.imgItem({
                index: data.index,
                time: dateFormat(data.time, 'yyyy-MM-dd hh:mm'),
                img: data.img
            }));

            targetElement.data({data: data});
            pageEle.imgList.append(targetElement);
        });

        // render layer list
        pageEle.layerList.html('');
        pageData.radarData.forEach((data) => {
            let targetElement = $(pageTpl.layerItem({
                index: data.index,
                time: dateFormat(data.time, 'yyyy-MM-dd hh:mm'),
                img: data.img
            }));

            targetElement.data({data: data});
            pageEle.layerList.append(targetElement);
        });
    });
}

function initPage() {
    // event handler init

    //- layer interactive
    pageEle.layerList
        .on('mouseenter', '.mainwrap-layeritem', function() {
            let $ele = $(this);

            // active layer
            pageEle.layerList.find('.active').removeClass('active');
            $ele.addClass('active');

            // active image
            pageEle.imgList.find('.active').removeClass('active');
            pageEle.imgList.find('[data-index="' + $ele.data('data').index + '"]').addClass('active');

            // set active time
            renderTopTime($ele.data('data').time, 'activeTime');
        })
        .on('click', '.mainwrap-layeritem', function() {
            let $ele = $(this);
            let hasMarked = $ele.hasClass('marked');

            // mark layer
            pageEle.layerList.find('.marked').removeClass('marked');

            // set refer image
            if (!hasMarked) {
                let targetImgElement = pageEle.imgList.find('[data-index="' + $ele.data('data').index + '"]');

                $ele.addClass('marked');

                pageEle.imgRefer.html(pageTpl.referImg({
                    img: targetImgElement.data('data').img,
                    time: dateFormat(targetImgElement.data('data').time, 'yyyy-MM-dd hh:mm')
                }));

                pageEle.imgList.css({'opacity': '.5'});

                renderTopTime($ele.data('data').time, 'referTime');
            } else {
                pageEle.imgRefer.html('');

                pageEle.imgList.css({'opacity': '1'});

                renderTopTime(null, 'referTime');
            }
        });

    //- sidebar menu
    pageEle.menuBtn.on('click', function() {
        pageEle.sidebar.addClass('show');
        $body.find('[data-role="mask"]').remove();
        $body.append(pageTpl.mask());
    });

    //- mask click
    $body.on('click', '[data-role="mask"]', function() {
        pageEle.sidebar.removeClass('show');
        $body.find('[data-role="mask"]').remove();
    });

    // render page data
    renderPage();
}

initPage();
