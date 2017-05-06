function ProgressBar(config) {
    this.wrap = config.ele;
    this.bar = config.ele.find('[data-role="bar"]');
    this.type = config.type;
}

ProgressBar.prototype = {
    construct: ProgressBar,

    setProgress: function(progress) {
        switch (this.type) {
            case 'load':
                this.bar.css({
                    left: (progress) * 100 + '%',
                    right: 0 + '%'
                });
                break;

            case 'count':
                this.bar.css({
                    left: 0 + '%',
                    right: (1 - progress) * 100 + '%'
                });
                break;
        }
    },

    setType: function(type) {
        this.type = type;

        switch (this.type) {
            case 'load':
                this.wrap.css({'background-color': '#9fc'});
                break;

            case 'count':
                this.wrap.css({'background-color': '#fff'});
                break;
        }
    }
};

module.exports = ProgressBar;