!function ($) {
    'use strict';
    var MMPaginator = function (element, options) {
        this.$el = $(element);
        this.opts = options;
    };

    MMPaginator.prototype = {
        _initLayout: function () {
            var that = this,
                $el = this.$el,
                opts = this.opts;

            $el.addClass('mmPaginator');
            var pgHtmls = [
                '<div class="totalCountLabel"></div>',
                '<ul class="pageList"></ul>',
                '<div class="limit"><select></select></div>'
            ];
            $el.append(pgHtmls.join(''));

            that.$totalCountLabel = $el.find('.totalCountLabel');
            that.$pageList = $el.find('.pageList');
            that.$limitList = $el.find('.limit select');

            var $limitList = this.$limitList,
                optionHtml = [];
            $.each(opts.limitList, function () {
                optionHtml.push('<option value="' + this + '">' + that.formatString(opts.limitLabel, [this]) + '</option>');
            });
            $limitList.html(optionHtml.join('')).on('change', function () {
                $el.data('page', 1);
                that.$mmGrid.load();
            });
        },
        _plain: function (page, totalCount, limit) {
            var that = this,
                $el = that.$el,
                $pageList = that.$pageList;

            var totalPage = totalCount % limit === 0 ? parseInt(totalCount / limit) : parseInt(totalCount / limit) + 1;
            totalPage = totalPage ? totalPage : 0;
            if (totalPage === 0) {
                page = 1;
            } else if (page > totalPage) {
                page = totalPage;
            } else if (page < 1 && totalPage !== 0) {
                page = 1;
            }

            var $prev = $('<li class="prev"><a>«</a></li>');
            if (page <= 1) {
                $prev.addClass('disable');
            } else {
                $prev.find('a').on('click', function () {
                    $el.data('page', page - 1);
                    that.$mmGrid.load();
                });
            }
            $pageList.append($prev);

            var list = [1];
            if (page > 4) {
                list.push('...');
            }
            for (var i = 0; i < 5; i++) {
                var no = page - 2 + i;
                if (no > 1 && no <= totalPage - 1) {
                    list.push(no);
                }
            }
            if (page + 1 < totalPage - 1) {
                list.push('...');
            }
            if (totalPage > 1) {
                list.push(totalPage);
            }
            $.each(list, function (index, item) {
                var $li = $('<li><a></a></li>');
                if (item === '...') {
                    $li.addClass('').html('...');
                } else if (item === page) {
                    $li.addClass('active').find('a').text(item);
                } else {
                    $li.find('a').text(item).prop('title', '第' + item + '页').on('click', function () {
                        $el.data('page', item);
                        that.$mmGrid.load();
                    });
                }
                $pageList.append($li);
            });

            var $next = $('<li class="next"><a title="下一页">»</a></li>');
            if (page >= totalPage) {
                $next.addClass('disable');
            } else {
                $next.find('a').on('click', function () {
                    $el.data('page', page + 1);
                    that.$mmGrid.load();
                });
            }
            $pageList.append($next);
        },
        load: function (params) {
            var that = this,
                $el = that.$el,
                $limitList = that.$limitList,
                opts = that.opts;

            if (!params) {
                params = {};
            }

            var page = params[opts.pageParamName];
            if (page === undefined || page === null) {
                page = $el.data('page');
            }
            $el.data('page', page);

            var totalCount = params[opts.totalCountName];
            if (totalCount === undefined) {
                totalCount = 0;
            }
            $el.data('totalCount', totalCount);

            var limit = params[opts.limitParamName];
            if (!limit) {
                limit = $limitList.val();
            }
            that.$limitList.val(limit);

            that.$totalCountLabel.html(that.formatString(opts.totalCountLabel, [totalCount]));
            that.$pageList.empty();

            that._plain(page, totalCount, that.$limitList.val());
        },
        formatString: function (text, args) {
            return text.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        },
        params: function () {
            var that = this,
                opts = that.opts,
                $el = that.$el,
                $limitList = that.$limitList;

            var params = {};
            params[opts.pageParamName] = $el.data('page');
            params[opts.limitParamName] = $limitList.val();
            return params;
        },
        init: function ($grid) {
            var that = this,
                opts = that.opts;

            that.$mmGrid = $grid;
            that._initLayout();
            that.$mmGrid.on('loadSuccess', function (e, data) {
                that.load(data);
            });

            var params = {};
            params[opts.totalCountName] = 0;
            params[opts.pageParamName] = opts.page;
            params[opts.limitParamName] = opts.limit;
            that.load(params);

            if ($grid.opts.indexCol) {
                var indexCol = $grid.opts.cols[0];
                indexCol.renderer = function (val, item, rowIndex) {
                    var params = that.params();
                    return '<label class="mmg-index">' +
                        (rowIndex + 1 + ((params[opts.pageParamName] - 1) * params[opts.limitParamName])) +
                        '</label>';
                };
            }
        }
    };

    $.fn.mmPaginator = function () {
        var data;
        if (arguments.length === 0 || typeof arguments[0] === 'object') {
            var option = arguments[0],
                options = $.extend(true, {}, $.fn.mmPaginator.defaults, option);
            data = this.data('mmPaginator');
            if (!data) {
                data = new MMPaginator(this[0], options);
                this.data('mmPaginator', data);
            }
            return $.extend(true, this, data);
        }

        if (typeof arguments[0] === 'string') {
            data = this.data('mmPaginator');
            var fn = data[arguments[0]];
            if (fn) {
                var args = Array.prototype.slice.call(arguments);
                return fn.apply(data, args.slice(1));
            }
        }
    };

    $.fn.mmPaginator.defaults = {
        style: 'plain',
        totalCountName: 'totalRow',
        page: 1,
        pageParamName: 'pageNumber',
        limitParamName: 'pageSize',
        limitLabel: '每页{0}条',
        totalCountLabel: '共<span>{0}</span>条记录',
        limit: undefined,
        limitList: [10, 20, 50]
    };

    $.fn.mmPaginator.Constructor = MMPaginator;

}(window.jQuery);
