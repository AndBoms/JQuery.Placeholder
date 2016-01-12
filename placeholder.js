/**
 * 本插件兼容IE 8及以上版本，IE 8以下不保证兼容，也有可能兼容;
 * 用法:
 *   $(document).ready(function(){
 *     $("input[placeholder]").placeholder({crossMode: true,focusClear:true});
 *   });
 *   
 * 特点:
 *   1.如果浏览器原生支持placeholder属性，就用原生；否则用本方法；
 *   2.样式定义可以传参数，也可以直接定义.placehoder及.placeholder-focus
 * 
 * bug:
 *   oninput 和 onpropertychange 这两个事件在 IE9 中都有个小BUG，
 *   那就是通过backspace / delete / ctrl+x , cut and delete command 的时候不会触发，
 *   而 IE 其他版本都是正常的，目前还没有很好的解决方案。
 *   参见：http://help.dottoro.com/ljhxklln.php
 * 
 * 参数：
 * {
 *   crossMode: false,
 *   focusClear: false, //仅在crossMode=true状态下有效，其它由浏览器默认，IE下支持，Chrome,Firefox不支持。
 *   style: {
 *     color: #fff;
 *     ...
 *   }
 * }
 * 
 * changelog:
 *   2016.1.8 17:33
 *     1.修复在重复调用本函数的情况下（可能是重置placeholder位置），无效果的bug.
 *     2.修复options没定义时出错。
 */

;
(function($, undefined) {
  $.fn.placeholder = function(options) {
    // 没有选择到任何对象，及早退出。
    if (!this.length) {
      return;
    }

    var opt = options || {};
    var cross = opt.crossMode ? true : false;
    var clear = opt.focusClear ? true : false;

    /**
     * 浏览器是否支持placeholder属性, IE 9以下都不支持,或早期的chrome , firefox。
     * @type {Boolean}
     */
    var isSupportPlaceholder = "placeholder" in document.createElement("input");

    /**
     * 判断浏览器是否原生支持placeholder属性。
     * 如果支持并且不是在调试模式下，直接返回即placeholder是个空函数。
     */
    if (isSupportPlaceholder && !cross) {
      return this;
    }

    var defaultStyle = $.extend({
      position: "absolute",
      cursor: "text",
      overflow: "hidden"
    }, opt.style || {});

    var supportTags = ['text', 'password', 'email', 'datetime', 'number', 'search', 'tel', 'url'];


    /**
     * 切换holder对象(label标签)是否显示。
     * @param  {Object} target input对象
     * @param  {Object} holder label对象
     */
    var switchHolder = function(target, holder) {
      if (target.val() === "") {
        holder.show();
      } else {
        holder.hide();
      }
    };

    /**
     * 获取placeholder属性的值
     * @param  {Object} target input对象
     * @return {String}        值
     */
    var getPlaceholderText = function(target) {
      return $(target).attr("placeholder");
    };
    /**
     * 如果nan是NAN则转换为0；
     * @param {Object} nan [description]
     */
    var Nan2Zero = function(nan) {
      return (isNaN(nan) ? 0 : nan);
    };
    /**
     * 获取每一个Input对象的位置
     *
     * 注意： margin属性在IE中如果没有重置为0的情况下，会返回NAN，此时会有问题
     *       但这个问题在CSS重置后，就没有了，故不在此再判断marginLeft及marginTop
     *       是否是数字了。
     *       * {
     *         margin:0;
     *         padding:0;
     *       }
     * 
     * @param  {Object} target input对象
     * @return {Object}        包含left,top值
     */
    var getHolderRectByTarget = function(target) {
      var tMarginLeft = Nan2Zero(parseInt(target.css('marginLeft'))),
        tMarginTop = Nan2Zero(parseInt(target.css('marginTop'))),
        tPaddingTop = Nan2Zero(parseInt(target.css('paddingTop'))),
        tPaddingLeft = Nan2Zero(parseInt(target.css('paddingLeft'))),
        tBorderTopWidth = Nan2Zero(parseInt(target.css('borderTopWidth'))),
        tBorderLeftWidth = Nan2Zero(parseInt(target.css('borderLeftWidth'))),
        tPosition = target.position(),
        tWidth = target.width(),
        tHeight = target.height(),
        tLeft = tPosition.left + tMarginLeft + tPaddingLeft + tBorderLeftWidth,
        tTop = tPosition.top + tMarginTop + tPaddingTop + tBorderTopWidth;

      return {
        left: tLeft,
        top: tTop,
        width: tWidth,
        height: tHeight
      };
    };

    var resetPlaceholder = function(target, holder) {
      var targetPos = getHolderRectByTarget(target);
      holder.css({
        width: targetPos.width,
        height: targetPos.height,
        left: targetPos.left,
        top: targetPos.top
      });

      if (target.val() === '') {
        holder.addClass('placeholder').show();
      } else {
        holder.hide();
      }
    };


    $(this).each(function() {
      var target = $(this);

      // 在此保证在重复调用本函数的情况下，重复添加label标签。
      if ($.inArray(target.prop('type'), supportTags) === -1) {
        return;
      }

      // 
      // 判断input对象是否有id, 如果没有创建一个id号.
      // 
      var targetId = target.attr('id');
      var holder = null;
      if (targetId) {
        holder = $('[data-x-placeholder=' + targetId);
        if (holder.length > 0) {
          // 已经创建了label模拟的placeholder对象，
          // 重置模拟对象并直接返回，后续内容不再需要。
          resetPlaceholder(target, holder);
          return;
        }
      } else {
        targetId = 'placeholder' + new Date().getTime();
        target.attr('id', targetId);
      }

      var holderText = getPlaceholderText(this);
      // 保存初始化的placeholder的值,因为后面会修改dom结构，去掉placeholder属性
      // 便于其它程序使用。
      target.data('placeholder', holderText);

      var targetPos = getHolderRectByTarget(target);
      // 
      // 创建label标签模拟placeholder
      // 
      holder = $('<label data-x-placeholder="' + targetId + '" for="' + targetId + '" class="placeholder"></label>');
      holder.css($.extend(defaultStyle, {
        margin: 0,
        padding: 0,
        lineHeight: target.css('lineHeight'),
        fontSize: target.css('fontSize'),
        top: targetPos.top,
        left: targetPos.left,
        width: targetPos.width,
        height: targetPos.height
      })).insertBefore(target);

      // 
      // 绑定事件
      // 注意input事件和onpropertychange事件，为何不用onchange事件呢？
      // 不用onchange事件原因如下：
      //  1. 只有触发对象失去焦点时，才会触发onchange事件
      //  2. 如果用js改变触发对象的属性时，不会触发onchange事件，当然oninput也有此问题
      //     但本插件只在不支持placeholder的IE 6~8才会起作用，不考虑老版本的chrome,firefox的情况下，
      //     input事件其实是多余的，暂留起..
      // 
      target.on({
        "focus": function() {
          if (!clear) {
            holder.removeClass('placeholder')
              .addClass('placeholder-focus');
            switchHolder($(this), holder);
          } else {
            holder.hide();
          }
        },
        // TODO: oninput 事件的兼容问题。oninput只是在改变input的value值时才触发
        "input": function() {
          switchHolder($(this), holder);
        },
        "blur": function() {
          holder.removeClass('placeholder-focus')
            .addClass('placeholder');
          // 注意这里的this相当于target.get(0)
          if (this.value === '') {
            holder.show();
          }
        }
      });
      // IE 8 不支持oninput事件，用IE专有的onpropertychange事件模拟绑定
      // onpropertychange 事件是在改变任何属性值的情况下，都会触发，所以要过滤。
      // 在此判断是否是 IE浏览器，因为只有IE不支持window.screenX
      // 参见：http://www.runoob.com/jsref/prop-win-screenx.html
      if (!window.screenX) {
        this.onpropertychange = function(event) {
          event = event || window.event;
          if (event.propertyName === 'value') {
            switchHolder($(this), holder);
          }
        };
      }

      // 右键点击input时与左键效果一样
      holder.get(0).oncontextmenu = function() {
        target.trigger('focus');
        return false;
      };

      //
      // 开始初始化内容了，累死个人哟。。。狗日的IE浏览器。。。
      // 

      // 跨浏览器状态下，移除placeholder属性，以免混淆
      target.removeAttr('placeholder');
      holder.html(holderText);

      if (target.val() !== '') {
        holder.hide();
      }
    });

    return this;
  };
})(jQuery);
