/**
	Copyright (c) 2012 Grigory Ponomar

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
		'text_userinput' : 'User input',
		'text_step_no' : 'Step no.',
		'text_goto_step_no' : 'Goto step no.',
		'text_case_yes' : 'Yes',
		'text_case_no' : 'No',
		'text_varname' : 'Put answer to variable',
		'text_type_question' : 'Type question here',
		'text_type_instructions' : 'Type instructions here',
		'text_type_situation' : 'Describe situation here',
		'text_type_variant' : 'Type variant here',
		'text_type_expression' : 'Type expression here',
		'text_delete' : 'Delete',
		'text_hide_if' : 'Hide if',
		'text_confirm_delete_step' : 'Are you sure you want to delete this step?',
		'text_confirm_delete_variant' : 'Are you sure you want to delete this variant?',
		'text_add_variant' : 'Add variant',
		'text_delay' : 'Delay',
		'text_seconds' : 'seconds',
	};
	this.types = {
		'simple': this.options.text_simple,
		'yesno': this.options.text_yesno,
		'multichoise': this.options.text_multichoise,
		'timer': this.options.text_timer,
		'goto': this.options.text_goto,
		'setvar': this.options.text_setvar,
		'checkvar': this.options.text_checkvar,
		'userinput': this.options.text_userinput,
	};
	$.extend(this.options, options);
	this.target = $(target);
	this.initiate();
}

jdiConstructor.prototype = 
{
	initiate : function ()
	{
		this.stepNo = 1;
		this.target.empty();
		this.target.append('<div class="jdi-constructor-mainbox"></div>');
		return this.addThread(this.target.children().first());
	},
	addThread : function (target) 
	{
		var t = this.createThreadContainer();
		target.append(t);
		this.controlAdd(t.children('.jdi-control-add'));
		return t;
	},
	createThreadContainer : function()
	{
		return $('<div class="jdi-thread"><div class="jdi-thread-container"></div><div class="jdi-control-add"></div><div class="jdi-clear"></div></div>');
	},
	getStepsContainer : function(t)
	{
		return t.children('.jdi-thread-container');
	},
	getParentThread : function(obj)
	{
		return $(obj).parents('.jdi-thread').eq(0);
	},
	controlAdd : function (target)
	{
		var $T = this, t, k, c = $('<div class="jdi-add-type-container jr5"></div>');
		target.append(c);
		for(k in this.types) {
			this.addControlButton(c, k, this.types[k]);
		}
		c.children(':not(:first)').hide();
		c.mouseenter(function() {
			c.children().fadeIn();
			clearTimeout(t);
		}).mouseleave(function() {
			t = setTimeout(function() {
				c.children(':not(:first)').fadeOut();
			}, 1000);
		});
		c.droppable({
			'activeClass' : 'jdi-can-drop',
			'hoverClass' : 'jdi-drop-now',
			'tolerance' : 'pointer',
			'drop' : function(e, u) {
				var d = u.draggable.detach();
				$T.getStepsContainer($T.getParentThread(target)).append(d);
				d.css({'left':0, 'top':0});
			}
		});
	},
	addControlButton : function (c, role, title)
	{
		var $T = this;
		var a = $('<a href="javascript:;" class="jdi-add-type jdi-btn jr5 jg30"><span></span></a>');
		a.attr('title', title).attr('rel', role).addClass(role);
		c.append(a);
		a.click(function() {
			$T.onInsert(this);
		});
		return a;
	},
	onInsert : function (obj)
	{
		var target = this.getStepsContainer(this.getParentThread(obj));
		var type = $(obj).attr('rel');
		switch (type) {
			case 'simple': this.insertSimple(target); break;
			case 'yesno': this.insertYesno(target); break;
			case 'multichoise': this.insertMulti(target); break;
			case 'timer': this.insertTimer(target); break;
			case 'goto': this.insertGoto(target); break;
			case 'setvar': this.insertSetvar(target); break;
			case 'checkvar': this.insertCheckvar(target); break;
			case 'userinput': this.insertUserinput(target); break;
		}
	},
	insertSimple : function (target)
	{
		var w = this.addStepWrapper(target);
		var s = this.addStep(w, 'simple');
		var b = this.addStepBody(s);
		this.addStepHeader(b);
		this.addStepDescription(b, this.options.text_type_instructions);
		return s;
	},
	insertYesno : function (target)
	{
		var w = this.addStepWrapper(target);
		var s = this.addStep(w, 'yesno');
		var b = this.addStepBody(s);
		this.addStaticCase(s, 'yes', this.options.text_case_yes);
		this.addStaticCase(s, 'no', this.options.text_case_no);
		this.addStepHeader(b);
		this.addStepDescription(b, this.options.text_type_question);
		return s;
	},
	insertMulti : function (target, count)
	{
		count = count || 2;
		var w = this.addStepWrapper(target);
		var s = this.addStep(w, 'multichoise');
		var b = this.addStepBody(s);
		this.addCaseAdder(s, false);
		for (var i = 0; i < count; i++) {
			this.addMultiCase(s, i != 0, false);
		}
		this.addStepHeader(b);
		this.addStepDescription(b, this.options.text_type_question);
		return s;
	},
	insertTimer : function (target)
	{
		var w = this.addStepWrapper(target);
		var s = this.addStep(w, 'timer');
		var b = this.addStepBody(s);
		this.addStepHeader(b);
		this.addStepDescription(b, this.options.text_type_instructions);
		this.addTimer(b);
		return s;
	},
	insertGoto : function (target)
	{
		var w = this.addStepWrapper(target);
		var s = this.addStep(w, 'goto');
		var b = this.addStepBody(s);
		this.addStepHeader(b);
		this.addGotoInput(b);
		return s;
	},
	insertSetvar : function (target)
	{
		var w = this.addStepWrapper(target);
		var s = this.addStep(w, 'setvar');
		var b = this.addStepBody(s);
		this.addStepHeader(b);
		this.addExprInput(b);
		return s;
	},
	insertCheckvar : function (target, count)
	{
		count = count || 2;
		var w = this.addStepWrapper(target);
		var s = this.addStep(w, 'checkvar');
		var b = this.addStepBody(s);
		this.addCaseAdder(s, true);
		for (var i = 0; i < count; i++) {
			this.addMultiCase(s, i != 0, true);
		}
		this.addStepHeader(b);
		return s;
	},
	insertUserinput : function (target)
	{
		var w = this.addStepWrapper(target);
		var s = this.addStep(w, 'userinput');
		var b = this.addStepBody(s);
		this.addStepHeader(b);
		this.addStepDescription(b, this.options.text_type_question);
		this.addVarnameInput(b);
		return s;
	},
	addStepWrapper : function (t)
	{
		var w = $('<div class="jdi-step-wrapper"></div>');
		t.append(w);
		w.draggable({
			'revert' : 'invalid',
		});
		return w;
	},
	addStep : function (t, type)
	{
		var s = $('<div class="jdi-step"></div>');
		s.addClass('jdi-step-' + type).attr('rel', type);
		t.append(s);
		return s;
	},
	addStaticCase : function (t, variant, labelText)
	{
		var w = this.addCaseWrapper(t, true);
		var c = $('<div class="jdi-case"></div>');
		var l = this.addCaseLabel(c);
		l.text(labelText).addClass('jdi-static-label');
		w.addClass('jdi-case-wrapper-' + variant);
		c.addClass('jdi-case-' + variant);
		this.addThread(c);
		w.append(c);
		return c;
	},
	addMultiCase : function (t, deleteable, expr)
	{
		var w = this.addCaseWrapper(t);
		var c = $('<div class="jdi-case"></div>');
		var l = this.addCaseLabel(c);
		var i = $('<input class="jdi-thread-input jdi-input jdi-case-variant" />');
		l.append(i);
		l.addClass('jdi-dinamic-label');
		if (deleteable) {
			this.addCaseRemover(l, w);
		}
		this.addThread(c);
		w.append(c);
		if (expr) {
			this.setPlaceholder(i, this.options.text_type_expression);
			this.addExprValidator(i);
		} else {
			var l2 = $('<div class="jdi-inbody-label"></div>');
			var i2 = $('<input class="jdi-thread-input jdi-input jdi-case-visibility" />');
			l2.append($('<span class="prefix"></span>').text(this.options.text_hide_if));
			l2.append(i2);
			l.append(l2);
			this.setPlaceholder(i, this.options.text_type_variant);
			this.setPlaceholder(i2, this.options.text_type_expression);
			this.addExprValidator(i2);
		}
		return c;
	},
	addCaseRemover : function (t, s)
	{
		var $T = this;
		var a = $('<a class="close jr5 jdi-btn-small jg15" href="#"></a>');
		t.append(a);
		a.click(function() {
			if (confirm($T.options.text_confirm_delete_variant)) {
				s.remove();
			}
		});
	},
	addCaseWrapper : function (t, append)
	{
		var w = $('<div class="jdi-case-wrapper"></div>');
		if (append) {
			t.append(w);
		} else {
			t.children('.jdi-add-case-wrapper').before(w);
		}
		return w;
	},
	addCaseLabel : function (t)
	{
		var l = $('<div class="jdi-case-label-wrapper"><div class="jdi-case-label jr5"></div></div>');
		t.append(l);
		return l.children();
	},
	addCaseAdder : function(t, expr) 
	{
		var $T = this;
		var c = $('<div class="jdi-add-case-wrapper"><div class="jdi-add-case jr5"></div></div>');
		t.append(c);
		var a = $('<a href="javascript:;" class="jdi-add-case-btn jdi-btn jr5 jg30"><span></span></a>');
		a.attr('title', this.options.text_add_variant);
		c.children('.jdi-add-case').append(a);
		a.click(function() {
			$T.addMultiCase(t, true, expr);
		})
		c.children('.jdi-add-case').droppable({
			'activeClass' : 'jdi-can-drop',
			'hoverClass' : 'jdi-drop-now',
			'tolerance' : 'pointer',
			'drop' : function(e, u) {
				var d = u.draggable.detach();
				$T.addMultiCase(t, true, expr).find('.jdi-thread-container').append(d);
				d.css({'left':0, 'top':0});
			}
		});
	},
	addStepBody : function (t)
	{
		var b = $('<div class="jdi-step-body jr5"></div>');
		var p;
		t.append(b);
		b.droppable({
			'over' : function(e, u) {
				p = $('<div class="drop-placeholder"></div>');
				p.width(b.width());
				b.before(p);
			},
			'out' : function(e, u) {
				p.remove();
			},
			'drop' : function(e, u) {
				p.remove();
				var d = u.draggable.detach();
				b.parents('.jdi-step-wrapper').eq(0).before(d);
				d.css({'left':0, 'top':0});
			},
			'tolerance' : 'pointer'
		});
		return b;
	},
	addStepHeader : function (target)
	{
		var $T = this;
		var h = $('<div class="jdi-step-header"></div>');
		target.append(h);
		h.append('<div class="jdi-step-no">' + this.suggestStepNumber() + '</div>');
		h.append('<a class="close jr5 jdi-btn-small jg15" href="#"></a>');
		h.append('<div class="jdi-clear"></div>');
		h.children('.close').click(function() {
			if (confirm($T.options.text_confirm_delete_step)) {
				$T.removeStep(target.parents('.jdi-step-wrapper').eq(0));
			}
		});
	},
	addStepDescription : function (target, ph)
	{
		var t = $('<textarea class="jdi-input jdi-input-step-description"></textarea>');
		target.append(t);
		t.height(60);
		t.focus(function() {
			$(this).animate({
				'height': '200px',
			});
		}).blur(function() {
			$(this).animate({
				'height': '60px',
			});
		});
		if (ph) {
			this.setPlaceholder(t, ph);
		}
	},
	addTimer : function (target)
	{
		var l = $('<div class="jdi-inbody-label"></div>');
		l.append($('<span class="prefix"></span>').text(this.options.text_delay));
		l.append('<input class="jdi-input jdi-input-timer" />');
		l.append($('<span class="suffix"></span>').text(this.options.text_seconds));
		target.append(l);
		this.forbidNonNumeric(l.children('.jdi-input-timer'));
		return l;
	},
	addVarnameInput : function (target)
	{
		var l = $('<div class="jdi-inbody-label"></div>');
		l.append($('<span class="prefix"></span>').text(this.options.text_varname));
		l.append('<input class="jdi-input jdi-input-userinput" />');
		target.append(l);
		this.forbidNonAlphanumeric(l.children('.jdi-input-userinput'));
		return l;
	},
	addGotoInput : function (target)
	{
		var l = $('<div class="jdi-inbody-label"></div>');
		l.append($('<span class="prefix"></span>').text(this.options.text_goto_step_no));
		l.append('<input class="jdi-input jdi-input-goto-step-no" />');
		target.append(l);
		this.forbidNonNumeric(l.children('.jdi-input-goto-step-no'));
		return l;
	},
	forbidNonNumeric : function (i)
	{
		i.keypress(function(e) {
			if (e.keyCode < 48 || e.keyCode > 57) {
				return false;
			}
		});
	},
	forbidNonAlphanumeric : function (i)
	{
		i.keypress(function(e) {
			if (!(e.keyCode >= 97 && e.keyCode <= 122 || 
				 e.keyCode >= 65 && e.keyCode <= 90 || 
				 e.keyCode == 95)) 
			{
				if (e.keyCode >= 48 && e.keyCode <= 57) {
					if (this.value.length == 0) {
						return false;
					}
				} else {
					return false;
				}
			}
		});
	},
	addExprInput : function (target)
	{
		var i = $('<input class="jdi-input jdi-input-expression" />');
		target.append(i);
		this.setPlaceholder(i, this.options.text_type_expression);
		this.addExprValidator(i);
		return i;
	},
	suggestStepNumber : function ()
	{
		return this.stepNo++;
	},
	removeStep : function (target)
	{
		target.remove();
	},
	setPlaceholder : function(el, text)
	{
		if (el.val() == '') {
			el.addClass('jdi-empty').val(text).bind('focus.placehold', function() {
				el.val('').removeClass('jdi-empty').unbind('focus.placehold');
			});
		}
	},
	addExprValidator : function (input)
	{
		input.blur(function() {
			if ($.trim(this.value) != '') {
				var e = new Expression(this.value);
				if (e.lastError != '') {
					alert(e.lastError);
					$(this).addClass('jdi-invalid');
					$(this).bind('focus.validate', function() {
						$(this).removeClass('jdi-invalid');
						$(this).unbind('focus.validate');
					});
				}
			}
		});
	},
	saveHtml : function (cssClass, id)
	{
		cssClass = cssClass || 'just-do-it';
		id = id || 'just-do-it';
		var root = this.getRootThread();
		var saver = new jdiSaver(this, root, cssClass, id);
		return saver.getResult();
	},
	loadHtml : function (html)
	{
		var loader = new jdiLoader(this, html);
		loader.parse();
	},
	getRootThread : function()
	{
		return this.target.children('.jdi-constructor-mainbox').children('.jdi-thread');
	},
	enumerateSteps : function(thread, callback)
	{
		thread.children('.jdi-thread-container').children().each(function() {
			callback($(this).children('.jdi-step'));
		});
	},
	getStepBody : function (step)
	{
		return step.children('.jdi-step-body');
	},
	getStepNumber : function (step)
	{
		return this.getStepBody(step).children('.jdi-step-header').children('.jdi-step-no').text();
	},
	setStepNumber : function (step, num)
	{
		this.getStepBody(step).children('.jdi-step-header').children('.jdi-step-no').text(num);
		if (num >= this.stepNo) {
			this.stepNo = parseInt(num) + 1;
		}
	},
	getStepType : function (step)
	{
		return step.attr('rel');
	},
	getStepText : function (step)
	{
		var textarea = this.getStepBody(step).children('textarea.jdi-input');
		return this.getInputValue(textarea);
	},
	getStepCaseYes : function (step)
	{
		return step.children('.jdi-case-wrapper-yes').children('.jdi-case-yes').children('.jdi-thread');
	},
	getStepCaseNo : function (step)
	{
		return step.children('.jdi-case-wrapper-no').children('.jdi-case-no').children('.jdi-thread');
	},
	enumerateCases : function (step, callback)
	{
		var $T = this;
		step.children('.jdi-case-wrapper').each(function(n) {
			var l = $(this).children('.jdi-case').children('.jdi-case-label-wrapper').children('.jdi-case-label');
			var i1 = l.children('.jdi-input');
			var i2 = l.children('.jdi-inbody-label').children('.jdi-input');
			var t = $(this).children('.jdi-case').children('.jdi-thread');
			callback($T.getInputValue(i1), $T.getInputValue(i2), t, i1, i2, n);
		});
	},
	getExtraValue : function (step)
	{
		var input = this.getStepBody(step).children('.jdi-inbody-label').children('.jdi-input');
		return this.getInputValue(input);
	},
	setExtraValue : function (step, val)
	{
		var input = this.getStepBody(step).children('.jdi-inbody-label').children('.jdi-input');
		this.setInputValue(input, val);
	},
	getTimerValue : function (step)
	{
		return this.getExtraValue(step);
	},
	setTimerValue : function (step, val)
	{
		this.setExtraValue(step, val);
	},
	getGotoValue : function (step)
	{
		return this.getExtraValue(step);
	},
	setGotoValue : function (step, val)
	{
		this.setExtraValue(step, val);
	},
	getVarnameValue : function (step)
	{
		return this.getExtraValue(step);
	},
	setVarnameValue : function (step, val)
	{
		this.setExtraValue(step, val);
	},
	getExprValue : function (step)
	{
		var input = this.getStepBody(step).children('.jdi-input');
		return this.getInputValue(input);
	}, 
	setExprValue : function (step, val)
	{
		var input = this.getStepBody(step).children('.jdi-input');
		this.setInputValue(input, val);
	}, 
	getInputValue : function(i, defval)
	{
		return i.is('.jdi-empty') ? (defval || ''): i.val();
	},
	setInputValue : function(i, val)
	{
		if ('' != val && typeof val != 'undefined') {
			i.removeClass('jdi-empty').unbind('focus.placehold').val(val);
		}
	},
	setStepText : function (s, t)
	{
		var textarea = this.getStepBody(s).children('textarea.jdi-input');
		this.setInputValue(textarea, t);
	}
}

jdiTextSanitaizer = function()
{
}

jdiTextSanitaizer.prototype =
{
	filter : function (text)
	{
		var i, line, lines = this.escape(text).replace(/\r/g, '').split("\n");
		for (i = 0; i < lines.length; i++) {
			line = this.parseLi(lines[i]);
			line = this.parseA(line);
			line = this.parseImg(line);
			line = this.parseI(line);
			line = this.parseB(line);
			line = this.parseVar(line);
			lines[i] = line;
		}
		// finalize list items
		return this.finalize(lines.join("\n"));
	},
	parseLi : function (line)
	{
		if (m = line.match(/^\s*[*-]\s+/)) {
			return '[li]' + line.substr(m[0].length) + '[!li]';
		}
		return line;
	},
	parseA : function (line) 
	{
		return line.replace(/\[link\s+[^\]]+\]/g, function(m) {
			var p = m.substr(1, m.length - 2).split(/\s+/);
			p.shift();
			var url = p.shift();
			var text = p.length ? p.join(' ') : url;
			return '<a href="' + url + '">' + text + '</a>';
		});
	},
	parseImg : function (line) 
	{
		return line.replace(/\[image(:(left|right|center))?\s+[^\]]+\]/g, function(m) {
			var p = m.substr(1, m.length - 2).split(/\s+/);
			var t = p.shift().split(':');
			var url = p.shift();
			var text = p.length ? p.join(' ') : '';
			var css = 'jim' + (t.length > 1 ? (' align-' + t[1]) : '');
			return '<span class=\"' + css + '\"><img src="' + url + '" alt="' + text + '" /></span>';
		});
	},
	parseI : function (line)
	{
		return line.replace(/[*]{2}([^*]+)[*]{2}/g, function(m) {
			return '<i>' + m.substr(2, m.length - 4) + '</i>';
		});
	},
	parseB : function (line)
	{
		return line.replace(/[*]([^*]+)[*]/g, function(m) {
			return '<b>' + m.substr(1, m.length - 2) + '</b>';
		});
	},
	parseVar : function (line)
	{
		return line.replace(/\$[{][^}]+[}]/g, function(m) {
			return '<span class="jex" data-expr="' + m.substr(2, m.length - 3) + '"></span>';
		});
	},
	finalize : function (text)
	{
		return text
			.replace(/\[!li\]\s*\[li\]/g, '</li><li>')
			.replace(/\[li\]/g, '<ul><li>')
			.replace(/\[!li\]/g, '</li></ul>')
			.replace(/\n<ul>/g, '<ul>')
			.replace(/<\/ul>\n/g, '</ul>')
			.replace(/\n{1,}/g, '<br />');
	},
	escape : function (text)
	{
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	},
	unfilter : function(node) 
	{
		var tmp = $('<div></div>');
		var $T = this;
		tmp.html($(node).html());
		tmp.find('a').each(function() {
			$(this).replaceWith('[link ' + this.href + ' ' + $(this).text() + ']');
		});
		tmp.find('span.jex').each(function() {
			$(this).replaceWith('${' + $(this).attr('data-expr') + '}');
		});
		tmp.find('img').each(function() {
			var align = '';
			var m = $(this).parent().attr('class').match(/align-(left|center|right)/);
			if (m) {
				align = ':' + m[1];
			}
			$(this).replaceWith('[image' + align +' ' + this.src + ' ' + $(this).attr('alt') + ']');
		});
		tmp.find('i').each(function() {
			$(this).replaceWith('**' + $T.unfilter(this) + '**');
		});
		tmp.find('b').each(function() {
			$(this).replaceWith('*' + $T.unfilter(this) + '*');
		});
		tmp.find('li').each(function() {
			$(this).replaceWith("\n- " + $T.unfilter(this));
		});
		tmp.find('br').each(function() {
			$(this).replaceWith("\n");
		});
		tmp.find('ul').each(function() {
			$(this).replaceWith($(this).text());
		});
		return tmp.text();
	}
};

jdiSaver = function (context, thread, cssClass, id) 
{
	this.context = context;
	this.container = $('<div></div>');
	this.sanitizer = new jdiTextSanitaizer();
	var root = $('<div></div>');
	root.attr('id', id).attr('class', cssClass);
	this.container.append(root);
	this.saveThread(root, thread);
}

jdiSaver.prototype =
{
	getResult : function()
	{
		return this.container.html();
	},
	saveThread : function(cont, thread, condition)
	{
		var $T = this;
		var t_cont = $('<div class="jtc"></div>');
		cont.append(t_cont);
		if (condition) {
			for (var k in condition) {
				t_cont.attr(k, condition[k]);
			}
		}
		this.context.enumerateSteps(thread, function(step) {
			$T.appendStep(t_cont, step);
		});
	},
	appendStep : function (cont, step)
	{
		var no = this.context.getStepNumber(step);
		var type = this.context.getStepType(step);
		var s = $('<div class="jst"></div>');
		s.attr('data-step-no', no);
		s.attr('data-type', type);
		switch (type) {
			case 'simple': 
				this.configureSimple(s, step); 
				break;
			case 'yesno': 
				this.configureYesno(s, step); 
				break;
			case 'multichoise':
				this.configureMulti(s, step);
				break;
			case 'timer':
				this.configureTimer(s, step);
				break;
			case 'goto':
				this.configureGoto(s, step);
				break;
			case 'setvar':
				this.configureSetvar(s, step);
				break;
			case 'checkvar':
				this.configureCheckvar(s, step);
				break;
			case 'userinput':
				this.configureUserinput(s, step);
				break;
		}
		cont.append(s);
	},
	configureSimple : function (target, step)
	{
		this.appendText(target, step);
	},
	configureYesno : function (target, step)
	{
		this.appendText(target, step);
		var y = this.context.getStepCaseYes(step);
		var n = this.context.getStepCaseNo(step);
		this.saveThread(target, y, {'data-case': 'yes'});
		this.saveThread(target, n, {'data-case': 'no'});
	},
	configureMulti : function (target, step)
	{
		var $T = this, i = 1;
		this.appendText(target, step);
		this.context.enumerateCases(step, function(label, expr, thread) {
			$T.saveThread(target, thread, {
				'data-case': i++, 
				'data-label' : label,
				'data-expr' : expr,
			});
		});
	},
	configureTimer : function (target, step)
	{
		this.appendText(target, step);
		target.attr('data-timer', this.context.getTimerValue(step));
	},
	configureGoto : function (target, step)
	{
		target.attr('data-goto', this.context.getGotoValue(step));
	},
	configureSetvar : function (target, step)
	{
		target.attr('data-expr', this.context.getExprValue(step));
	},
	configureCheckvar : function (target, step)
	{
		var $T = this, i = 1;
		this.context.enumerateCases(step, function(expr, nil, thread) {
			$T.saveThread(target, thread, {
				'data-case': i++, 
				'data-expr' : expr
			});
		});
	},
	configureUserinput : function (target, step)
	{
		this.appendText(target, step);
		target.attr('data-varname', this.context.getVarnameValue(step));
	},
	appendText : function (target, step)
	{
		var b = $('<div class="jsb"></div>');
		b.html(this.sanitizer.filter(this.context.getStepText(step)));
		target.append(b);
	},
};

jdiLoader = function(context, html)
{
	this.context = context;
	this.data = $(html);
	this.sanitizer = new jdiTextSanitaizer();
}

jdiLoader.prototype = 
{
	parse : function ()
	{
		var t = this.context.initiate();
		this.addSteps(this.data.children('.jtc'), this.context.getStepsContainer(t));
	},
	addSteps : function (src, trg)
	{
		var $T = this;
		src.children('.jst').each(function() {
			$T.addStep($(this), trg);
		});
	},
	addStep : function (src, trg)
	{
		var s, c;
		switch (src.attr('data-type')) {
			case 'simple':
				s = this.context.insertSimple(trg);
				this.setStepText(src.children('.jsb'), s);
				this.context.setStepNumber(s, src.attr('data-step-no'));
				break;
			case 'yesno':
				c = src.children('[data-case]');
				s = this.context.insertYesno(trg);
				this.setStepText(src.children('.jsb'), s);
				this.addCases(c, s);
				this.context.setStepNumber(s, src.attr('data-step-no'));
				break;
			case 'multichoise':
				c = src.children('[data-case]');
				s = this.context.insertMulti(trg, c.length);
				this.setStepText(src.children('.jsb'), s);
				this.addCases(c, s, true);
				this.context.setStepNumber(s, src.attr('data-step-no'));
				break;
			case 'timer':
				s = this.context.insertTimer(trg);
				this.setStepText(src.children('.jsb'), s);
				this.context.setTimerValue(s, src.attr('data-timer'));
				this.context.setStepNumber(s, src.attr('data-step-no'));
				break;
			case 'goto':
				s = this.context.insertGoto(trg);
				this.context.setGotoValue(s, src.attr('data-goto'));
				this.context.setStepNumber(s, src.attr('data-step-no'));
				break;
			case 'setvar':
				s = this.context.insertSetvar(trg);
				this.context.setExprValue(s, src.attr('data-expr'));
				this.context.setStepNumber(s, src.attr('data-step-no'));
				break;
			case 'checkvar':
				c = src.children('[data-case]');
				s = this.context.insertCheckvar(trg, c.length);
				this.addCases(c, s, false);
				this.context.setStepNumber(s, src.attr('data-step-no'));
				break;
			case 'userinput':
				s = this.context.insertUserinput(trg);
				this.setStepText(src.children('.jsb'), s);
				this.context.setVarnameValue(s, src.attr('data-varname'));
				this.context.setStepNumber(s, src.attr('data-step-no'));
				break;
		}
	},
	addCases : function (cases, step, multi)
	{
		var $T = this;
		this.context.enumerateCases(step, function(v1, v2, t, i1, i2, n) {
			var c = cases.eq(n);
			if (multi) {
				$T.context.setInputValue(i1, c.attr('data-label'));
				$T.context.setInputValue(i2, c.attr('data-expr'));
			} else {
				$T.context.setInputValue(i1, c.attr('data-expr'));
			}
			$T.addSteps(c, $T.context.getStepsContainer(t));
		});
	},
	setStepText : function (node, s)
	{
		var t = this.sanitizer.unfilter(node);
		this.context.setStepText(s, t);
	}
};
