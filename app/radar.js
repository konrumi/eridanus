const $ = require('jquery');
const ejs = require('ejs');

const dateFormat = require('./modules/dateFormat');
const ProgressBar = require('./modules/progressBar');

const imgLoad = {
    reset: function() {
        pageData.loadedDataAmount = 0;
        pageEle.loadBg.fadeIn(200);
        pageEle.loadIcon.fadeIn(200);
    },

    done: function() {
        pageData.loadedDataAmount++;

        pageProgressBar.setProgress(pageData.loadedDataAmount / pageData.radarData.length);

        if (pageData.loadedDataAmount > 1) {
            pageEle.loadBg.fadeOut(200);
        }

        if (pageData.loadedDataAmount === pageData.radarData.length) {
            pageEle.loadIcon.fadeOut(200);

            // start page clock
            pageProgressBar.setType('count');
            pageProgressBar.setProgress(0);
            pageClock.start();
        }
    }
};

const pageClock = {
    clockId: 0,

    start: function() {
        pageClock.stop();
        this.clockId = setTimeout(() => {
            pageParams.currentTime++;
            pageProgressBar.setProgress(pageParams.currentTime / pageParams.refreshTime);

            if (pageParams.currentTime >= pageParams.refreshTime) {
                renderPage();
            }
            pageClock.start();
        }, 1000);
    },

    stop: function() {
        clearTimeout(this.clockId);
    }
};

let $body = $('body');

let pageParams = {
    currentTime: 0,
    refreshTime: 60,
    stationName: 'daxing',
    clockId: 0,
    mode: 'move' // Mode: 'move' or 'draw'
};

let pageTpl = {
    imgItem: ejs.compile($('#imgItem').html(), null),
    layerItem: ejs.compile($('#layerItem').html(), null),
    referImg: ejs.compile($('#referImg').html(), null),
    mask: ejs.compile($('#mask').html(), null)
};

let pageEle = {
    progressBar: $('#progressBar'),
    imgList: $('#imgList'),
    layerList: $('#layerList'),
    imgRefer: $('#imgRefer'),
    imgCanvas: $('#imgCanvas'),
    loadBg: $('#loadBg'),
    loadIcon: $('#loadIcon'),
    menuBtn: $('#menuBtn'),
    refreshBtn: $('#refreshBtn'),
    modeBtn: $('[data-func="mode-btn"]'),
    clearBtn: $('#clearBtn'),
    activeTime: $('#activeTime'),
    referTime: $('#referTime'),
    durationTime: $('#durationTime'),
    sidebar: $('#sidebar')
};

let pageData = {
    radarData: [],
    activeTime: null,
    referTime: null,
    loadedDataAmount: 0,
    pointList: []
};

let pageProgressBar = new ProgressBar({
    ele: pageEle.progressBar,
    type: 'load'
});

function getPageData() {
    return new Promise((resolve) => {
        $.ajax({
            url: 'http://www.nmc.cn/publish/radar/' + pageParams.stationName + '.html',
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
            targetTimeNode.text('');
        } else {
            targetTimeNode.text(dateFormat(date, 'yyyy-MM-dd hh:mm'))
        }
    }

    // write duration
    if (pageData.activeTime !== null && pageData.referTime !== null) {
        let durationTime = pageData.activeTime - pageData.referTime;
        let direction = (durationTime >= 0) ? '+' : '-';
        pageEle.durationTime.text(direction + Math.abs(durationTime) / 1000 / 60 + 'm');
    } else {
        pageEle.durationTime.text('');
    }
}

function renderPage() {
    // reset top time
    renderTopTime(null, 'activeTime');
    renderTopTime(null, 'referTime');

    // reset progress bar
    pageParams.currentTime = 0;
    imgLoad.reset();
    pageClock.stop();
    pageProgressBar.setType('load');
    pageProgressBar.setProgress(0);

    getPageData().then(() => {
        // render image list
        pageEle.imgList.html('');
        pageData.radarData.forEach((data) => {
            let targetElement = $(pageTpl.imgItem({
                index: data.index,
                time: dateFormat(data.time, 'yyyy-MM-dd hh:mm'),
                img: data.img
            }));

            targetElement.find('img')
                .on('load', function() {
                    imgLoad.done();
                });
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

        // render top time
        renderTopTime(pageData.radarData[0].time, 'activeTime');
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

    //- refresh btn
    pageEle.refreshBtn.on('click', function() {
        renderPage();
    });

    //- mode btn
    pageEle.modeBtn.on('click', function() {
        let $this = $(this);
        if (pageParams.mode !== $this.attr('data-mode')) {
            pageEle.imgCanvas.removeClass(pageParams.mode);
            pageParams.mode = $this.attr('data-mode');
            pageEle.imgCanvas.addClass(pageParams.mode);

            $('[data-func="mode-btn"].active').removeClass('active');
            $this.addClass('active');
        }
    });

    //- img canvas
    pageEle.imgCanvas.on('click', function(e) {
        e.preventDefault();

        switch (pageParams.mode) {
            case 'move' :
                break;

            case 'draw' :
                // draw point
                console.log(e.offsetX, e.offsetY);
                break;
        }
    });

    pageEle.imgCanvas.on('dblclick', function(e) {
        switch (pageParams.mode) {
            case 'draw' :
                // draw point
                console.log('miao');
                break;
        }
    });

    // render page data
    renderPage();
}

initPage();
