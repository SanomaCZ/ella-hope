(function ($, undefined) {
    /**
     * return carret position in element
     * @return {[type]} [description]
     */
    $.fn.getCursorPosition = function() {
        var el = $(this).get(0);
        var pos = 0;
        if('selectionStart' in el) {
            pos = el.selectionStart;
        } else if('selection' in document) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    };

    /**
     * select (highlight) text in element based on start and end offset
     * @param {[type]} startOffset [description]
     * @param {[type]} endOffset   [description]
     */
    $.fn.setInputSelection = function(startOffset, endOffset) {
        var el = $(this).get(0);

        function offsetToRangeCharacterMove(el, offset) {
            return offset - (el.value.slice(0, offset).split("\r\n").length - 1);
        }


        el.focus();
        if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
            el.selectionStart = startOffset;
            el.selectionEnd = endOffset;
        } else {
            var range = el.createTextRange();
            var startCharMove = offsetToRangeCharacterMove(el, startOffset);
            range.collapse(true);
            if (startOffset == endOffset) {
                range.move("character", startCharMove);
            } else {
                range.moveEnd("character", offsetToRangeCharacterMove(el, endOffset));
                range.moveStart("character", startCharMove);
            }
            range.select();
        }
    };

})(jQuery);