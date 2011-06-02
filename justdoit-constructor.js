/**
	Copyright (c) 2011 Grigory Ponomar

	This program is free software; you can redistribute it and/or
	modify it under the terms of the GNU General Public License
	as published by the Free Software Foundation; either version 2
	of the License, or (at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details (http://www.gnu.org).
*/

jdiConstructor = function (target, options)
{
	options = options || {};
	if (typeof target == 'string') target = document.getElementById(target);
	this.options = {
		'text_simple' : 'Simple',
		'text_yesno' : '`Yes` or `No`',
		'text_timer' : 'Timer',
		'text_goto' : 'Go to',
		'text_multichoise' : 'Multiple choise',
		'text_setvar' : 'Set variable',
		'text_checkvar' : 'Check variable',
		'text_add' : 'Add',
		'text_step_no' : 'Step no.',
		'text_goto_step_no' : 'Goto step no.',
		'text_case_yes' : 'If `Yes` choosed',
		'text_case_no' : 'If `No` choosed',
		'text_type_question' : 'Type question here',
		'text_type_instructions' : 'Type instructions here',
		'text_type_situation' : 'Describe situation here',
		'text_type_variant' : 'Type variant here',
		'text_type_expression' : 'Type expression here',
		'text_delete' : 'Delete',
		'text_confirm_delete_step' : 'Are you sure you want to delete this step?',
		'text_confirm_delete_variant' : 'Are you sure you want to delete this variant?',
		'text_add_variant' : 'Add variant',
		'text_up' : 'Move up',
		'text_down' : 'Move down',
		'text_delay' : 'Delay',
		'text_seconds' : 'seconds',
	}
	$.extend(this.options, options);
	this.target = $(target);
	this.target.empty();
	this.target.append('<div class="jdi-constructor-mainbox"></div>');
	this.addThread(this.target.children().first());
	this.stepNo = 0;
}

jdiConstructor.prototype = 
{
	addThread : function (target) 
	{
		target.append('<div class="jdi-thread"><div class="jdi-thread-header-container"></div><div class="jdi-thread-container"></div><div class="jdi-control-label">' + this.options.text_add + '</div><div class="jdi-control-add"></div><div class="jdi-clear"></div></div>');
		if (target.children().length == 1) {
			target.children().addClass('jdi-first-block');
		}
		this.controlAdd(target.children().last().children('.jdi-control-add'));
	},
	controlAdd : function (target)
	{
		var $T = this;
		target.append('<div class="jdi-select jdi-select-hover"><div class="jdi-options-container"></div></div>');
		target.children().last()
			.mouseenter(function() {$(this).addClass('hover');})
			.mouseleave(function() {$(this).removeClass('hover');});
		target.children().last().children().last()
			.append('<a href="javascript:;" rel="simple" class="jdi-option jdi-option-first">' + this.options.text_simple + '</a>')
			.append('<a href="javascript:;" rel="yesno" class="jdi-option">' + this.options.text_yesno + '</a>')
			.append('<a href="javascript:;" rel="multichoise" class="jdi-option">' + this.options.text_multichoise + '</a>')
			.append('<a href="javascript:;" rel="timer" class="jdi-option">' + this.options.text_timer + '</a>')
			.append('<a href="javascript:;" rel="goto" class="jdi-option">' + this.options.text_goto + '</a>')
			.append('<a href="javascript:;" rel="setvar" class="jdi-option">' + this.options.text_setvar + '</a>')
			.append('<a href="javascript:;" rel="checkvar" class="jdi-option jdi-option-last">' + this.options.text_checkvar + '</a>');
		target.children().last().find('a').click(function() {
			$T.onInsert(this);
		})
	},
	onInsert : function (obj)
	{
		var target = $(obj.parentNode.parentNode.parentNode.parentNode).children('.jdi-thread-container');
		var type = $(obj).attr('rel');
		switch (type) {
			case 'simple': this.insertSimple(target); break;
			case 'yesno': this.insertYesno(target); break;
			case 'multichoise': this.insertMulti(target); break;
			case 'timer': this.insertTimer(target); break;
			case 'goto': this.insertGoto(target); break;
			case 'setvar': this.insertSetvar(target); break;
			case 'checkvar': this.insertCheckvar(target); break;
		}
		target.children().last().attr('rel', type);
		if (target.children().length == 1) {
			target.children().addClass('jdi-first-block');
		}
	},
	insertSimple : function (target)
	{
		var s = target.append('<div class="jdi-step jdi-step-simple"></div>').children().last();
		this.addStepHeader(s);
		this.addStepBody(s);
		s.find('textarea').addClass('jdi-fresh').val(this.options.text_type_instructions).focus(function() {
			$(this).val('').removeClass('jdi-fresh').unbind('focus');
		});
	},
	insertYesno : function (target)
	{
		var s = target.append('<div class="jdi-step jdi-step-yesno"></div>').children().last();
		this.addStepHeader(s);
		this.addStepBody(s);
		var c = s.children('.jdi-step-body');
		c.children('textarea').addClass('jdi-fresh').val(this.options.text_type_question).focus(function() {
			$(this).val('').removeClass('jdi-fresh').unbind('focus');
		});
		this.addThread(c);
		c.children().last().children('.jdi-thread-header-container')
			.append('<div class="jdi-thread-text">' + this.options.text_case_yes + '</div>');
		this.addThread(c);
		c.children().last().children('.jdi-thread-header-container')
			.append('<div class="jdi-thread-text">' + this.options.text_case_no + '</div>');
	},
	insertMulti : function (target)
	{
		var s = target.append('<div class="jdi-step jdi-step-multi"></div>').children().last();
		this.addStepHeader(s);
		var a = s.find('.jdi-control-step');
		var $T = this;
		$('<a href="javascript:;" rel="addvariant" class="jdi-addvariant">' + this.options.text_add_variant + '</a>')
			.insertBefore(a.children().first())
			.click(function() {
				$T.onStepAction(this);
			});
		this.addStepBody(s);
		var c = s.children('.jdi-step-body');
		c.children('textarea').addClass('jdi-fresh').val(this.options.text_type_situation).focus(function() {
			$(this).val('').removeClass('jdi-fresh').unbind('focus');
		});
		this.addMultiVariant(c);
		this.addMultiVariant(c);
	},
	insertTimer : function (target)
	{
		var s = target.append('<div class="jdi-step jdi-step-timer"></div>').children().last();
		this.addStepHeader(s);
		this.addStepBody(s);
		s.find('textarea').addClass('jdi-fresh').val(this.options.text_type_instructions).focus(function() {
			$(this).val('').removeClass('jdi-fresh').unbind('focus');
		});
		s.children('.jdi-step-body').append('<div class="jdi-timer-label">' + this.options.text_delay + ' <input class="jdi-input jdi-input-timer" /> ' + this.options.text_seconds + '</div>');
	},
	insertGoto : function (target)
	{
		var s = target.append('<div class="jdi-step jdi-step-goto"></div>').children().last();
		s.append('<div class="jdi-step-header">' + this.options.text_goto_step_no + ' <input class="jdi-input jdi-input-goto-step-no" /></div>');
		this.addStepControl(s);
		s.append('<div class="jdi-clear"></div>');
	},
	insertSetvar : function (target)
	{
		var s = target.append('<div class="jdi-step jdi-step-setvar"></div>').children().last();
		this.addStepHeader(s);
		s.append('<div class="jdi-step-body"><input class="jdi-input jdi-input-expression" /></div>');
		s.find('.jdi-input-expression').addClass('jdi-fresh').val(this.options.text_type_expression).focus(function() {
			$(this).val('').removeClass('jdi-fresh').unbind('focus');
		});
	},
	insertCheckvar : function (target)
	{
		var s = target.append('<div class="jdi-step jdi-step-checkvar"></div>').children().last();
		this.addStepHeader(s);
		var a = s.find('.jdi-control-step');
		var $T = this;
		$('<a href="javascript:;" rel="addvariantexpr" class="jdi-addvariant">' + this.options.text_add_variant + '</a>')
			.insertBefore(a.children().first())
			.click(function() {
				$T.onStepAction(this);
			});
		s.append('<div class="jdi-step-body"></div>');
		var c = s.children().last();
		this.addMultiVariant(c, true);
		this.addMultiVariant(c, true);
	},
	addMultiVariant : function (target, isexrp)
	{
		this.addThread(target);
		var c = target.children().last().children('.jdi-thread-header-container');
		if (isexrp) c.append('<input class="jdi-input-expression jdi-thread-input jdi-input" />');
		else c.append('<input class="jdi-thread-input jdi-input" />');
		c.children().last().addClass('jdi-fresh')
			.val(isexrp ? this.options.text_type_expression : this.options.text_type_variant)
			.focus(function() {
				$(this).val('').removeClass('jdi-fresh').unbind('focus');
			});
		$T = this;
		$('<a href="javascript:;" class="jdi-variant-delete">' + this.options.text_delete + '</a>')
			.insertAfter(target.children().last().find('.jdi-control-add'))
			.click(function() {
				$T.removeMultiVariant($(this.parentNode));
			});
	},
	removeMultiVariant : function (obj)
	{
		if (confirm(this.options.text_confirm_delete_variant)) {
			obj.remove();
		}
	},
	addStepHeader : function (target)
	{
		target.append('<div class="jdi-step-header">' + this.options.text_step_no + ' <input class="jdi-input jdi-input-step-no" value="' + this.suggestStepNumber() + '" /></div>');
		this.addStepControl(target);
		target.append('<div class="jdi-clear"></div>');
	},
	addStepControl : function (target)
	{
		var $T = this;
		target.append('<div class="jdi-control-step"></div>');
		target.children().last()
			.append('<a href="javascript:;" rel="up">' + this.options.text_up + '</a>')
			.append('<a href="javascript:;" rel="down">' + this.options.text_down + '</a>')
			.append('<a href="javascript:;" rel="delete" class="jdi-delete jdi-button-last">' + this.options.text_delete + '</a>');
		target.children().last().children().click(function() {
			$T.onStepAction(this);
		});
	},
	onStepAction : function (obj) 
	{
		var target = $(obj.parentNode.parentNode), targ2;
		var type = $(obj).attr('rel');
		switch (type) {
			case 'up' : 
				targ2 = target.prev();
				if (targ2.hasClass('jdi-step')) {
					target.detach().insertBefore(targ2);
					if (targ2.hasClass('jdi-first-block')) {
						target.addClass('jdi-first-block');
						targ2.removeClass('jdi-first-block');
					}
				}
				break;
			case 'down' : 
				targ2 = target.next();
				if (targ2.hasClass('jdi-step')) {
					target.detach().insertAfter(targ2);
					if (target.hasClass('jdi-first-block')) {
						targ2.addClass('jdi-first-block');
						target.removeClass('jdi-first-block');
					}
				}
				break;
			case 'delete' : 
				if (confirm(this.options.text_confirm_delete_step)) {
					if (target.hasClass('jdi-first-block')) {
						target.next().addClass('jdi-first-block');
					}
					target.remove(); 
				}
				break;
			case 'addvariant' : 
				this.addMultiVariant($(obj.parentNode.parentNode).children('.jdi-step-body')); 
				break;
			case 'addvariantexpr' : 
				this.addMultiVariant($(obj.parentNode.parentNode).children('.jdi-step-body'), true); 
				break;
		}
	},
	addStepBody : function (target)
	{
		target.append('<div class="jdi-step-body"><textarea class="jdi-input jdi-input-step-description"></textarea></div>');
	},
	suggestStepNumber : function ()
	{
		var step = 1;
		this.target.find('input.jdi-input-step-no').each(function() {
			if ($(this).val() >= step) {
				step = parseInt($(this).val()) + 1;
			}
		});
		return step;
	},
	buildHtml : function (cssClass, id)
	{
		cssClass = cssClass || 'just-do-it';
		id = id || 'just-do-it';
		this.stepNo = this.suggestStepNumber();
		return '<div id="' + id + '" class="' + cssClass + '"><div>' + this.handleThread(this.target.children().eq(0).children().eq(0)) + '</div></div>';
	},
	handleThread : function (obj)
	{
		var $T = this, html = '';
		var variant = obj.children('.jdi-thread-header-container').children('input');
		if (variant.length > 0) {
			if (variant.hasClass('jdi-input-expression')) {
				html += '<div expr="' + this.escapeText(variant.val()) + '">';
			} else {
				html += '<div case="' + this.escapeText(variant.val()) + '">';
			}
		} else {
			html += '<div>';
		}
		obj.children('.jdi-thread-container').children()
			.each(function() {
				html += $T.handleStep($(this));
			});
		return html + "</div>\n";
	},
	handleStep : function (obj) 
	{
		switch (obj.attr('rel')) {
			case 'simple': return this.handleSimple(obj);
			case 'yesno': return this.handleYesno(obj);
			case 'multichoise': return this.handleMulti(obj);
			case 'timer': return this.handleTimer(obj);
			case 'goto': return this.handleGoto(obj);
			case 'setvar': return this.handleSetvar(obj);
			case 'checkvar': return this.handleCheckvar(obj);
		}
	},
	handleSimple : function (obj)
	{
		var step = parseInt(obj.children('.jdi-step-header').children('input').val()) || this.stepNo++;
		var cont = this.sanitizeText(obj.children('.jdi-step-body').children('textarea').val());
		return '<div rel="simple" step="' + step + '"><div>' + cont + "</div></div>\n";
	},
	handleYesno : function (obj)
	{
		var step = parseInt(obj.children('.jdi-step-header').children('input').val()) || this.stepNo++;
		var cont = this.sanitizeText(obj.children('.jdi-step-body').children('textarea').val());
		var res = '<div rel="yesno" step="' + step + '"><div>' + cont + "</div>\n<div>";
		var $T = this;
		obj.children('.jdi-step-body').children('.jdi-thread').each(function() {
			res += $T.handleThread($(this));
		});
		res += "</div></div>\n";
		return res;
	},
	handleMulti : function (obj)
	{
		var step = parseInt(obj.children('.jdi-step-header').children('input').val()) || this.stepNo++;
		var cont = this.sanitizeText(obj.children('.jdi-step-body').children('textarea').val());
		var res = '<div rel="multi" step="' + step + '"><div>' + cont + "</div>\n<div>";
		var $T = this;
		obj.children('.jdi-step-body').children('.jdi-thread').each(function() {
			res += $T.handleThread($(this));
		});
		res += "</div></div>\n";
		return res;
	},
	handleTimer : function (obj)
	{
		var step = parseInt(obj.children('.jdi-step-header').children('input').val()) || this.stepNo++;
		var cont = this.sanitizeText(obj.children('.jdi-step-body').children('textarea').val());
		var delay = parseInt(obj.children('.jdi-step-body').find('.jdi-input-timer').val()) || 1;
		return '<div rel="timer" delay="' + delay + '" step="' + step + '"><div>' + cont + "</div></div>\n";
	},
	handleGoto : function (obj)
	{
		var step = parseInt(obj.children('.jdi-step-header').children('input').val()) || 'end';
		return '<div rel="goto" step="' + (this.stepNo++) + '" goto="' + step + '"></div>' + "\n";
	},
	handleSetvar : function (obj)
	{
		var step = parseInt(obj.children('.jdi-step-header').children('input').val()) || this.stepNo++;
		var cont = this.escapeText(obj.children('.jdi-step-body').children('input').val());
		return '<div rel="setvar" step="' + step + '" expr="' + cont + '"></div>' + "\n";
	},
	handleCheckvar : function (obj)
	{
		var step = parseInt(obj.children('.jdi-step-header').children('input').val()) || this.stepNo++;
		var res = '<div rel="checkvar" step="' + step + '">' + "\n<div>";
		var $T = this;
		obj.children('.jdi-step-body').children('.jdi-thread').each(function() {
			res += $T.handleThread($(this));
		});
		res += "</div></div>\n";
		return res;
	},
	escapeText : function (text)
	{
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	},
	sanitizeText : function (text)
	{
		var i, lines = this.escapeText(text).replace(/\r/g, '').split("\n");
		for (i = 0; i < lines.length; i++) {
			lines[i] = lines[i]
				// prepare list items
				.replace(/^\s*(\-|\*)\s+(.+)$/, "[li]$2[!li]")
				// links
				.replace(/\[link\s+([^\s]+)\s+([^\]]+)\]/g, "<a href=\"$1\">$2</a>")
				.replace(/\[link\s+([^\s\]]+)\s*\]/g, "<a href=\"$1\">$1</a>")
				// images
				.replace(/\[image(:(left|right|center))?\s+([^\s]+)\s+([^\]]+)\]/g, "<img src=\"$3\" alt=\"$4\" /></span>")
				.replace(/\[image(:(left|right|center))?\s+([^\s\]]+)\s*\]/g, "<span class=\"jdiv-image$2\"><img src=\"$3\" alt=\"\" /></span>")
				// italic
				.replace(/(\*\*)([^\*]+)(\*\*)/, "<em>$2</em>")
				// bold
				.replace(/(\*)([^\*]+)(\*)/, "<strong>$2</strong>");
		}
		text = lines.join("\n");
		// finalize list items
		return text
			.replace(/\[!li\]\s*\[li\]/g, '</li><li>')
			.replace(/\[li\]/g, '<ul><li>')
			.replace(/\[!li\]/g, '</li></ul>')
			.replace(/\n<ul>/g, '<ul>')
			.replace(/<\/ul>\n/g, '</ul>')
			.replace(/\n{1,}/g, '<br />');
	},
}
