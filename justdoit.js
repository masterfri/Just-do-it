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


jdiView = function (target, options)
{
	options = options || {};
	if (typeof target == 'string') target = document.getElementById(target);
	this.options = {
		'text_next' : 'Next',
		'text_end' : 'End',
		'text_yes' : 'Yes',
		'text_no' : 'No',
		'text_reset' : 'Reset',
	}
	$.extend(this.options, options);
	this.target = $(target);
	this.target.children().css('display', 'none');
	this.currentStep = null;
	this.mainThread = this.target.children().eq(0);
	this.mainThread.attr('main-thread', 'main-thread');
	this.target.append('<div class="jdiv-main-container"><div class="jdiv-view"></div><div class="jdiv-control"></div></div>');
	this.view = this.target.children().last().children().eq(0);
	this.control = this.target.children().last().children().eq(1);
	this.control.append('<div class="jdiv-timer"></div>');
	this.timerContainer = this.control.children().last();
	this.timer = null;
	this.timerValue = 0;
	this.timerGoto = 'end';
	this.control.append(this.createButton(this.options.text_next, 'end', 'jdiv-next', true));
	this.control.append(this.createButton(this.options.text_yes, 'end', 'jdiv-yes', true));
	this.control.append(this.createButton(this.options.text_no, 'end', 'jdiv-no', true));
	this.control.append(this.createButton(this.options.text_reset, false, 'jdiv-reset', true));
	this.vars = {};
	this.expr = {};
	var $T = this;
	this.mainThread.find('div[rel=setvar]').each(function() {
		$T.addExpr($(this).attr('expr'));
	});
	this.mainThread.find('div[rel=checkvar]').children().first().children().each(function() {
		$T.addExpr($(this).attr('expr'));
	});
	this.start();
}

jdiView.prototype = 
{
	addExpr : function (expr)
	{
		if ('' == expr) return;
		if (expr in this.expr) return;
		this.expr[expr] = new jdiExpression(expr);
	},
	evalExpr : function (expr)
	{
		if ('' == expr) return 0;
		if (expr in this.expr) 
			return this.expr[expr].evaluate(this.vars);
		throw 'missing expression';
	},
	start : function ()
	{
		this.vars = {};
		this.currentStep = this.mainThread.children().eq(0).children().first();
		this.displayStep();
	},
	displayStep : function ()
	{
		var next, ch, $T = this;
		this.control.children('.jdiv-case').remove();
		this.control.children('.jdiv-visible').removeClass('jdiv-visible');
		switch (this.currentStep.attr('rel')) {
			case 'simple':
				this.view.html(this.currentStep.children().eq(0).html());
				next = this.getNextStep();
				this.control.children('.jdiv-next')
					.addClass('jdiv-visible')
					.attr('goto', next);
				break;
				
			case 'yesno':
				this.view.html(this.currentStep.children().eq(0).html());
				ch = this.currentStep.children().eq(1).children().eq(0).children().first();
				if (ch.length > 0) next = ch.attr('step');
				else next = this.getNextStep();
				this.control.children('.jdiv-yes')
					.addClass('jdiv-visible')
					.attr('goto', next);
				ch = this.currentStep.children().eq(1).children().eq(1).children().first();
				if (ch.length > 0) next = ch.attr('step');
				else next = this.getNextStep();
				this.control.children('.jdiv-no')
					.addClass('jdiv-visible')
					.attr('goto', next);
				break;
				
			case 'multi':
				this.view.html(this.currentStep.children().eq(0).html());
				this.currentStep.children().eq(1).children().each(function () {
					$T.createCase($(this));
				});
				this.control.children('.jdiv-case').first().addClass('jdiv-first');
				break;
				
			case 'timer':
				this.view.html(this.currentStep.children().eq(0).html());
				next = this.getNextStep();
				this.control.children('.jdiv-next')
					.addClass('jdiv-visible')
					.attr('goto', next);
				this.timerGoto = next;
				this.timerValue = parseInt(this.currentStep.attr('delay'));
				this.timerValue = isNaN(this.timerValue) ? 1 : this.timerValue;
				this.timerSetTextValue(this.timerValue);
				this.timer = setInterval(function() {$T.doTimer();}, 1000);
				this.timerContainer.addClass('jdiv-visible');
				break;
				
			case 'goto':
				this.nextStep(this.currentStep);
				break;
				
			case 'setvar':
				this.evalExpr(this.currentStep.attr('expr'));
				this.nextStep(this.getNextStep());
				break;
				
			case 'checkvar':
				next = false;
				this.currentStep.children().first().children().each(function () {
					if ($T.evalExpr($(this).attr('expr'))) {
						ch = $(this).children();
						if (ch.length > 0) {
							next = ch.first().attr('step');
						}
						return false;
					}
				});
				if (false === next) next = this.getNextStep();
				this.nextStep(next);
				break;
		}
	},
	createCase : function (obj)
	{
		var next, ch, $T = this, _case;
		ch = obj.children().first();
		if (ch.length > 0) next = ch.attr('step');
		else next = this.getNextStep();
		_case = $('<div class="jdiv-case"><a href="javascript:;">' + obj.attr('case') + '</a></div>');
		_case.attr('goto', next).click(function() {$T.nextStep($(this));});
		this.control.append(_case);
	},
	createButton : function (label, next, css, hide)
	{
		var button = $('<div class="jdiv-button ' + css + (hide ? '' : ' jdiv-visible') + '" goto="' + next + '"><a href="javascript:;">' + label + '</a></div>');
		var $T = this;
		if (false === next) {
			button.click(function() {$T.start();});
		} else {
			button.click(function() {$T.nextStep($(this));});
		}
		return button;
	},
	getNextStep : function ()
	{
		var current, next, thread;
		current = next = this.currentStep;
		var limit = 300;
		do {
			next = next.next();
			if (next.length > 0) {
				return next.attr('step');
			} else {
				thread = current.parent().parent();
				if (thread.attr('main-thread')) return 'end';
				next = thread.parent();
				if (next.length == 0) break;
				current = next;
			}
		} while (limit--);
		throw 'Error, parent not found';
	},
	nextStep : function (obj)
	{
		var next;
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		if (typeof obj == 'string') next = obj;
		else next = obj.attr('goto');
		if ('end' == next) {
			this.end();
		} else {
			this.currentStep = this.target.find('div[step=' + next + ']');
			this.displayStep();
		}
	},
	end : function ()
	{
		this.view.html(this.options.text_end);
		this.control.children('.jdiv-case').remove();
		this.control.children('.jdiv-visible').removeClass('jdiv-visible');
		this.control.children('.jdiv-reset').addClass('jdiv-visible');
	},
	timerSetTextValue : function (val)
	{
		var mins = parseInt(val / 60);
		var secs = val % 60;
		if (secs < 10) {
			this.timerContainer.html(mins + ':0' + secs);
		} else {
			this.timerContainer.html(mins + ':' + secs);
		}
	},
	doTimer : function ()
	{
		this.timerValue--;
		if (this.timerValue <= 0) {
			this.nextStep(this.timerGoto);
		} else {
			this.timerSetTextValue(this.timerValue);
		}
	}
}

jdiExpression = function (code)
{
	this.it = 0;
	this.sym = '';
	this.src = code.toLowerCase();
	this.srclen = this.src.length;
	this.expr = [];
	this.vars = {};
	this.getChar();
	try {
		this.expr = this.list();
	} catch (e) {
		alert("Syntax error: '" + e + "' in '" + this.src + "' after '" + this.src.substr(0, this.it - 1) + "' (char " + this.it + ')');
	}
}

jdiExpression.prototype = 
{
	evaluate : function (vars)
	{
		this.vars = vars || {};
		var r = 0, i;
		for (i = 0; i < this.expr.length; i++) {
			r = this.evalNode(this.expr[i]);
		}
		return r;
	},
	evalNode : function (node)
	{
		var i, r;
		switch (node[0]) {
			case 'num': return node[1];
			case 'var': return this.getVar(node[1]);
			case 'neg': return - this.evalNode(node[1]);
			case 'not': return this.evalNode(node[1]) ? 0 : 1;
			case '()': return this.evalNode(node[1]);
			case ':=': return this.setVar(node[1][1], this.evalNode(node[2]));
			case '+':
				r = this.evalNode(node[1]); 
				for (i = 2; i < node.length; i++) r += this.evalNode(node[i]);
				return r;
			case '-':
				r = this.evalNode(node[1]); 
				for (i = 2; i < node.length; i++) r -= this.evalNode(node[i]);
				return r;
			case '*':
				r = this.evalNode(node[1]); 
				for (i = 2; i < node.length; i++) r *= this.evalNode(node[i]);
				return r;
			case '/':
				r = this.evalNode(node[1]); 
				for (i = 2; i < node.length; i++) r /= this.evalNode(node[i]);
				return r;
			case 'or':
				for (i = 1; i < node.length; i++)
					if (this.evalNode(node[i])) return 1;
				return 0;
			case 'and':
				for (i = 1; i < node.length; i++)
					if (! this.evalNode(node[i])) return 0;
				return 1;
			case '=': return this.evalNode(node[1]) == this.evalNode(node[2]) ? 1 : 0;
			case '!=': return this.evalNode(node[1]) == this.evalNode(node[2]) ? 0 : 1;
			case '>': return this.evalNode(node[1]) > this.evalNode(node[2]) ? 1 : 0;
			case '<': return this.evalNode(node[1]) < this.evalNode(node[2]) ? 1 : 0;
			case '>=': return this.evalNode(node[1]) >= this.evalNode(node[2]) ? 1 : 0;
			case '<=': return this.evalNode(node[1]) <= this.evalNode(node[2]) ? 1 : 0;
		}
		throw 'Eval error: invalid operator: ' + node[0];
	},
	getVar : function (varn)
	{
		if (varn in this.vars) {
			return this.vars[varn];
		}
		return (this.vars[varn] = 0);
	},
	getVars : function (varn)
	{
		return this.vars;
	},
	setVar : function (varn, val)
	{
		return (this.vars[varn] = val);
	},
	getChar : function ()
	{
		this.sym = this.isEnd() ? null : this.src.charAt(this.it++);
		return this.sym;
	},
	isEnd : function ()
	{
		return this.it > this.srclen;
	},
	isTerminator : function ()
	{
		return this.isEnd() || ';' == this.sym;
	},
	isSpace : function (s)
	{
		return ' ' == s || "\r" == s || "\n" == s || "\t" == s;
	},
	isNum : function (s)
	{
		var c = s.charCodeAt(0);
		return c >= 48 && c <= 57;
	},
	isAlpha : function (s)
	{
		var c = s.charCodeAt(0);
		return c >= 97 && c <= 122;
	},
	isAlNum : function (s)
	{
		return this.isNum(s) || this.isAlpha(s);
	},
	expect : function (sym)
	{
		var i, l = sym.length;
		for (i = 0; i < l; i++) {
			if (this.sym != sym.charAt(i)) {
				throw "'" + sym + "' expected";
			}
			this.getChar();
		}
	},
	expectSpace : function ()
	{
		if (! this.isSpace(this.sym)) {
			throw 'space expected';
		}
		this.getChar();
	},
	skipSpaces : function ()
	{
		while (! this.isEnd() && this.isSpace(this.sym)) this.getChar();
		return ! this.isTerminator();
	},
	list : function ()
	{
		var l = [];
		while (this.skipSpaces()) {
			l.push(this.assign());
			this.skipSpaces();
			if (this.isEnd()) break;
			this.expect(';');
		}
		return l;
	},
	assign : function ()
	{
		if (this.skipSpaces()) {
			var l = this.logic2();
			if (this.skipSpaces()) {
				this.expect(':=');
				if (l[0] != 'var') throw 'invalid left value'
				return [':=', l, this.logic2()];
			}
			return l;
		}
		throw 'operand expected';
	},
	logic2 : function ()
	{
		if (this.skipSpaces()) {
			var l = ['or', this.logic1()], tok = '';
			while (this.skipSpaces() && 'or' == (tok = this.getToken())) {
				l.push(this.logic1());
			}
			if ('' != tok && 'or' != tok) {
				throw "'or' expected";
			}
			return l.length > 2 ? l : l[1];
		}
		throw 'operand expected';
	},
	logic1 : function ()
	{
		if (this.skipSpaces()) {
			var l = ['and', this.compare()], tok = '';
			while (this.skipSpaces() && 'and' == (tok = this.getToken())) {
				l.push(this.compare());
			}
			if ('' != tok && 'and' != tok) {
				throw "'and' expected";
			}
			return l.length > 2 ? l : l[1];
		}
		throw 'operand expected';
	},
	compare : function ()
	{
		if (this.skipSpaces()) {
			var op = '';
			var l = this.ariph2();
			if (this.skipSpaces()) {
				if ('=' == this.sym) {
					this.getChar();
					op = '=';
				} else if ('<' == this.sym) {
					this.getChar();
					if ('=' == this.sym) {
						this.getChar();
						op = '<=';
					} else {
						op = '<';
					}
				} else if ('>' == this.sym) {
					this.getChar();
					if ('=' == this.sym) {
						this.getChar();
						op = '>=';
					} else {
						op = '>';
					}
				} else if ('!' == this.sym) {
					this.getChar();
					this.expect('=');
					op = '!=';
				} else {
					return l;
				}
				return [op, l, this.ariph2()];
			}
			return l;
		}
		throw 'operand expected';
	},
	ariph2 : function (l)
	{
		if (this.skipSpaces()) {
			var op = '';
			if (! l) l = ['', this.ariph1()];
			else l = ['', l];
			while (this.skipSpaces() && ('+' == this.sym || '-' == this.sym)) {
				if ('' == op) {
					op = this.sym;
					l[0] = op;
				}
				if (op != this.sym) {
					return this.ariph2(l.length > 2 ? l : l[1]);
				}
				this.getChar();
				l.push(this.ariph1());
			}
			if ('' != op && '+' != op && '-' != op) {
				throw "'+' or '-' expected";
			}
			return l.length > 2 ? l : l[1];
		}
		throw 'operand expected';
	},
	ariph1 : function (l)
	{
		if (this.skipSpaces()) {
			var op = '';
			if (! l) l = ['', this.logic0()];
			else l = ['', l];
			while (this.skipSpaces() && ('*' == this.sym || '/' == this.sym)) {
				if ('' == op) {
					op = this.sym;
					l[0] = op;
				}
				if (op != this.sym) {
					return this.ariph1(l.length > 2 ? l : l[1]);
				}
				this.getChar();
				l.push(this.logic0());
			}
			if ('' != op && '*' != op && '/' != op) {
				throw "'*' or '/' expected";
			}
			return l.length > 2 ? l : l[1];
		}
		throw 'operand expected';
	},
	logic0 : function ()
	{
		if (this.skipSpaces()) {
			if (this.checkToken('not')) {
				return ['not', this.ariph0()];
			}
			return this.ariph0();
		}
		throw 'operand expected';
	},
	ariph0 : function ()
	{
		if (this.skipSpaces()) {
			if (this.sym == '-') {
				this.getChar();
				return ['neg', this.brackets()];
			}
			return this.brackets();
		}
		throw 'operand expected';
	},
	brackets : function ()
	{
		if (this.skipSpaces()) {
			if ('(' == this.sym) {
				this.getChar();
				var b = this.logic2();
				this.expect(')');
				return ['()', b];
			}
			return this.term();
		}
		throw 'operand expected';
	},
	term : function ()
	{
		if (this.skipSpaces()) {
			if (this.isNum(this.sym)) {
				return ['num', this.getNumber()];
			}
			if (this.isAlpha(this.sym)) {
				return ['var', this.getToken()];
			}
		}
		throw 'term expected';
	},
	getNumber : function ()
	{	
		var num = '';
		while (! this.isTerminator() && this.isNum(this.sym)) {
			num += this.sym;
			this.getChar();
		}
		return parseInt(num);
	},
	getToken : function ()
	{	
		var tok = '';
		if (! this.isTerminator() && this.isAlpha(this.sym)) {
			tok += this.sym;
			this.getChar();
			while (! this.isTerminator() && (this.isAlNum(this.sym) || '_' == this.sym)) {
				tok += this.sym;
				this.getChar();
			}
		}
		return tok;
	},
	checkToken : function (tok)
	{	
		var tmp = this.it;
		if (tok == this.getToken()) {
			return true;
		}
		this.it = tmp;
		this.sym = this.isEnd() ? null : this.src.charAt(this.it - 1);
		return false;
	}
};

// jQuery implementation
(function($){
	$.fn.justDoIt = function (options)
	{
		this.each(function () {
			new jdiView(this, options);
		});
	}
})(jQuery);
